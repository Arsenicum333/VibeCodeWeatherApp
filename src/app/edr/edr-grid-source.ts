import {Signal} from "@angular/core";
import {Extent} from "ol/extent";
import {ProjectionLike, transformExtent} from "ol/proj";
import Source from "ol/source/Source";
import {catchError, map, Observable, of, switchMap, tap, throwError} from "rxjs";
import {describeEdrError, EdrNoDataError} from "./edr-error";
import {EdrParameter} from "../types/edr-parameters.type";
import {EdrApiService, LonLat, LonLatBbox} from "./edr-api.service";
import {GridData} from "../data-types/grid-data";

/**
 * Name of the OpenLayers property holding the last load error. Changes to it fire a
 * "propertychange" event with this `key`.
 */
export const LOAD_ERROR_PROPERTY = "loadError";

/**
 * Extra margin around the visible area, in degrees. It keeps a few grid points around the view
 * when zoomed in, so the edges of the screen are not left without data.
 */
const BBOX_MARGIN_DEG = 0.1;

/** Source of grids of one EDR parameter (e.g. temperature), for the area the map shows. */
export class EdrGridSource extends Source {
    /** Times at which the parameter has data, oldest first; `undefined` until they are loaded. */
    private times?: string[];

    constructor(
        private readonly edrApiService: EdrApiService,
        /** What to fetch, e.g. one of `ALADIN_PARAMETERS`. */
        private readonly parameter: EdrParameter,
        /**
         * Time selected by the user, e.g. `2026-11-18T13:00:00Z`; read when data is requested. The
         * source shows its own latest time at or before it (see `getTime()`).
         */
        private readonly selectedTime: Signal<string>
    ) {
        super({attributions: parameter.dataset.attribution});
    }

    /**
     * Longitude/latitude bbox to request for the visible map `extent`, clipped to the area the
     * parameter's dataset covers. Returns `undefined` when the view does not overlap that area.
     */
    getRequestBbox(extent: Extent, projection: ProjectionLike): LonLatBbox | undefined {
        const [minLon, minLat, maxLon, maxLat] = transformExtent(extent, projection, "EPSG:4326");
        const [domainMinLon, domainMinLat, domainMaxLon, domainMaxLat] = this.parameter.dataset.domain;
        const roundDown = (value: number): number => Math.floor(value * 100) / 100;
        const roundUp = (value: number): number => Math.ceil(value * 100) / 100;

        // Rounding to 0.01° keeps the URL short and makes repeated requests for the same area equal.
        const bbox: LonLatBbox = [
            Math.max(roundDown(minLon - BBOX_MARGIN_DEG), domainMinLon),
            Math.max(roundDown(minLat - BBOX_MARGIN_DEG), domainMinLat),
            Math.min(roundUp(maxLon + BBOX_MARGIN_DEG), domainMaxLon),
            Math.min(roundUp(maxLat + BBOX_MARGIN_DEG), domainMaxLat),
        ];
        const overlapsDomain = bbox[0] < bbox[2] && bbox[1] < bbox[3];
        return overlapsDomain ? bbox : undefined;
    }

    /** EDR name of the parameter, e.g. `"temperature"`. */
    getParameterName(): string {
        return this.parameter.parameterName;
    }

    /** Time selected by the user, which may differ from the time the source shows. */
    getSelectedTime(): string {
        return this.selectedTime();
    }

    /**
     * Time the layer shows for the selected time: the latest of its own times at or before it, so
     * e.g. an hourly forecast shows 13:00 for 13:45. `undefined` (nothing to show) when the selected
     * time is before the first time, or more than one time step after the last one (e.g. radar
     * in the future). Until the times are loaded, it is the selected time itself.
     */
    getTime(): string | undefined {
        const selected = this.selectedTime();
        const times = this.times;
        if (times === undefined) {
            return selected;
        }
        const selectedMs = Date.parse(selected);
        let index = times.length - 1;
        while (index >= 0 && Date.parse(times[index]) > selectedMs) {
            index--;
        }
        if (index < 0) {
            return undefined;
        }
        const last = times.length - 1;
        const step = last > 0 ? Date.parse(times[last]) - Date.parse(times[last - 1]) : 0;
        if (index === last && selectedMs - Date.parse(times[last]) > step) {
            return undefined;
        }
        return times[index];
    }

    /** Times at which the parameter has data, oldest first. The source also uses them in `getTime()`. */
    getAvailableTimes(): Observable<string[]> {
        if (this.times !== undefined) {
            return of(this.times);
        }
        return this.edrApiService.getTimes(this.parameter).pipe(
            map(times => [...times].sort((a, b) => Date.parse(a) - Date.parse(b))),
            tap(times => {
                this.times = times;
                // The time the layer shows may differ now, so the layer has to render again.
                this.changed();
            })
        );
    }

    /** Values of the parameter at `lonLat` for all its times, oldest first. */
    getValuesOverTime(lonLat: LonLat): Observable<{time: string; value?: number}[]> {
        return this.getAvailableTimes().pipe(
            switchMap(times => {
                if (times.length === 0 || !this.isInDomain(lonLat)) {
                    return of([]);
                }
                return this.edrApiService.getPositionSeries(
                    this.parameter,
                    lonLat,
                    times[0],
                    times.at(-1)!
                );
            })
        );
    }

    /**
     * Fetches the parameter's grid inside `bbox` at `time`. Also updates `getLoadError()`: it is set when
     * the request fails and cleared when data arrives.
     */
    getGridData(bbox: LonLatBbox, time: string): Observable<GridData> {
        return this.edrApiService.getCube(this.parameter, bbox, time).pipe(
            map(coverage => GridData.fromCoverage(coverage, this.parameter.parameterName)),
            tap({
                next: () => this.set(LOAD_ERROR_PROPERTY, undefined),
                error: (error: unknown) => this.set(LOAD_ERROR_PROPERTY, describeEdrError(error)),
            })
        );
    }

    /**
     * Value of the parameter at `lonLat` at `time`, in the unit of the data, or `undefined` where
     * the dataset has no data (e.g. outside its area). Does not change `getLoadError()`.
     */
    getValueAt(lonLat: LonLat, time: string): Observable<number | undefined> {
        if (!this.isInDomain(lonLat)) {
            return of(undefined);
        }
        return this.edrApiService.getPosition(this.parameter, lonLat, time).pipe(
            map(coverage => coverage.ranges[this.parameter.parameterName]?.values[0] ?? undefined),
            catchError((error: unknown) =>
                error instanceof EdrNoDataError ? of(undefined) : throwError(() => error)
            )
        );
    }

    /**
     * Message describing why the last request failed, or `undefined` if it succeeded. To react to
     * changes, listen for "propertychange" events whose `key` is `LOAD_ERROR_PROPERTY`.
     */
    getLoadError(): string | undefined {
        return this.get(LOAD_ERROR_PROPERTY);
    }

    private isInDomain([lon, lat]: LonLat): boolean {
        const [minLon, minLat, maxLon, maxLat] = this.parameter.dataset.domain;
        return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
    }
}
