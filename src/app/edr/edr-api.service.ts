import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {map, Observable} from "rxjs";
import {Coverage, PointCoverage, PointCoverageCollection} from "../types/coverage-json.type";
import {EdrCollection} from "../types/edr-collection.type";
import {EdrNoDataError} from "./edr-error";
import {EdrParameter} from "../types/edr-parameters.type";

/** Bounding box in longitude/latitude degrees: [minLon, minLat, maxLon, maxLat]. */
export type LonLatBbox = [number, number, number, number];

/** A point in longitude/latitude degrees: [lon, lat]. */
export type LonLat = [number, number];

const EDR_QUERY = {
    crs: "CRS:84",
    format: "CoverageJSON",
} as const;

@Injectable({providedIn: "root"})
export class EdrApiService {
    private readonly http = inject(HttpClient);

    /**
     * Fetches the grid of `parameter` inside `bbox` at `time` (e.g. `2026-11-18T13:00:00Z`), from
     * the EDR service (OGC Environmental Data Retrieval) of the parameter's dataset.
     */
    getCube(parameter: EdrParameter, bbox: LonLatBbox, time: string): Observable<Coverage> {
        const query = EDR_QUERY;
        const collection = encodeURIComponent(parameter.collectionId);
        const url = `${parameter.dataset.baseUrl}/collections/${collection}/cube`;
        let params = new HttpParams()
            .set("parameter-name", parameter.parameterName)
            .set("bbox", bbox.join(","))
            .set("crs", query.crs)
            .set("f", query.format)
            .set("datetime", time);
        if (parameter.z !== undefined) {
            params = params.set("z", parameter.z);
        }
        if (parameter.gridSize !== undefined) {
            params = params
                .set("resolution-x", parameter.gridSize)
                .set("resolution-y", parameter.gridSize);
        }

        return this.http.get<Coverage | null>(url, {params}).pipe(
            map(coverage => {
                if (coverage === null) {
                    throw new EdrNoDataError();
                }
                return coverage;
            })
        );
    }

    /**
     * Fetches the value of `parameter` at the point `lonLat` at `time`. `crs=CRS:84` is required:
     * without it the service answers `204 No Content`.
     */
    getPosition(parameter: EdrParameter, [lon, lat]: LonLat, time: string): Observable<PointCoverage> {
        const collection = encodeURIComponent(parameter.collectionId);
        const url = `${parameter.dataset.baseUrl}/collections/${collection}/position`;
        let params = new HttpParams()
            .set("coords", `POINT(${lon} ${lat})`)
            .set("parameter-name", parameter.parameterName)
            .set("crs", EDR_QUERY.crs)
            .set("f", EDR_QUERY.format)
            .set("datetime", time);
        if (parameter.z !== undefined) {
            params = params.set("z", parameter.z);
        }

        return this.http.get<PointCoverage | null>(url, {params}).pipe(
            map(coverage => {
                if (coverage === null) {
                    throw new EdrNoDataError();
                }
                return coverage;
            })
        );
    }

    /**
     * Fetches the values of `parameter` at the point `lonLat` for every time from `start` to `end`
     * (both included), oldest first. Missing values are `undefined`.
     */
    getPositionSeries(
        parameter: EdrParameter,
        lonLat: LonLat,
        start: string,
        end: string
    ): Observable<{time: string; value?: number}[]> {
        const collection = encodeURIComponent(parameter.collectionId);
        const url = `${parameter.dataset.baseUrl}/collections/${collection}/position`;
        let params = new HttpParams()
            .set("coords", `POINT(${lonLat[0]} ${lonLat[1]})`)
            .set("parameter-name", parameter.parameterName)
            .set("crs", EDR_QUERY.crs)
            .set("f", EDR_QUERY.format)
            .set("datetime", `${start}/${end}`);
        if (parameter.z !== undefined) {
            params = params.set("z", parameter.z);
        }

        return this.http.get<PointCoverageCollection | null>(url, {params}).pipe(
            map(collection => {
                if (collection === null) {
                    throw new EdrNoDataError();
                }
                return collection.coverages
                    .map(coverage => ({
                        time: coverage.domain.axes.t.values[0],
                        value: coverage.ranges[parameter.parameterName]?.values[0] ?? undefined,
                    }))
                    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
            })
        );
    }

    /** Times at which the collection of `parameter` has data, oldest first as the service lists them. */
    getTimes(parameter: EdrParameter): Observable<string[]> {
        const collection = encodeURIComponent(parameter.collectionId);
        const url = `${parameter.dataset.baseUrl}/collections/${collection}`;
        return this.http
            .get<EdrCollection>(url, {params: {f: "json"}})
            .pipe(map(metadata => metadata.extent.temporal?.values ?? []));
    }
}
