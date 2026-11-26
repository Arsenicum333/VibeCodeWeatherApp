import {signal} from "@angular/core";
import {Coordinate} from "ol/coordinate";
import OlMap from "ol/Map";
import {toLonLat} from "ol/proj";
import {forkJoin, map as mapValues, of, Subscription} from "rxjs";
import {describeEdrError} from "../edr/edr-error";
import {EdrGridSource, LOAD_ERROR_PROPERTY} from "../edr/edr-grid-source";
import {LegendData} from "../types/legend.type";
import {PointWeather, PointWeatherValue} from "../types/point-weather.type";
import {TimeSeries} from "../types/time-series.type";
import {BitmapLayer} from "../visualizations/bitmap/bitmap-layer";

export class MapLayersHelperService {
    private readonly loadErrorsSignal = signal<string[]>([]);
    readonly loadErrors = this.loadErrorsSignal.asReadonly();

    private readonly availableTimesSignal = signal<string[]>([]);
    /** Times for which at least one EDR layer on the map has data, oldest first. */
    readonly availableTimes = this.availableTimesSignal.asReadonly();

    private readonly legendsSignal = signal<LegendData[]>([]);
    readonly legends = this.legendsSignal.asReadonly();

    private readonly pointWeatherSignal = signal<PointWeather | undefined>(undefined);
    /** Weather at the point the user clicked last; `undefined` when the popup is closed. */
    readonly pointWeather = this.pointWeatherSignal.asReadonly();
    /** Map coordinate of the clicked point. */
    private pointCoordinate?: Coordinate;
    private pointRequest?: Subscription;
    private seriesRequest?: Subscription;
    /** Times the layers showed when the point values were loaded, to notice when they change. */
    private pointTimesKey?: string;

    /** Keeps `loadErrors` up to date with the load errors of every EDR layer on the map. */
    public listenForLoadErrors(map: OlMap): void {
        const edrSources = map
            .getAllLayers()
            .map(layer => layer.getSource())
            .filter(source => source instanceof EdrGridSource);

        const updateLoadErrors = (): void => {
            const errors = edrSources.map(source => source.getLoadError());
            this.loadErrorsSignal.set(errors.filter(error => error !== undefined));
        };

        for (const source of edrSources) {
            source.on("propertychange", event => {
                if (event.key === LOAD_ERROR_PROPERTY) {
                    updateLoadErrors();
                }
            });
        }
    }

    /** Fills `legends` with the legends of the map's bitmap layers, bottom layer first. */
    public collectLegends(map: OlMap): void {
        const legends = map
            .getAllLayers()
            .filter(layer => layer instanceof BitmapLayer)
            .map(layer => layer.getLegend())
            .filter(legend => legend !== undefined);
        this.legendsSignal.set(legends);
    }

    /**
     * Fills `availableTimes` with the times of all EDR layers on the map together (e.g. past radar
     * images and future forecast hours). For each time, every layer shows its own latest time at or
     * before it, or nothing (see `EdrGridSource.getTime()`).
     */
    public collectAvailableTimes(map: OlMap): void {
        const edrSources = map
            .getAllLayers()
            .map(layer => layer.getSource())
            .filter(source => source instanceof EdrGridSource);
        if (edrSources.length === 0) {
            return;
        }

        forkJoin(edrSources.map(source => source.getAvailableTimes())).subscribe({
            next: timesPerSource => {
                const all = [...new Set(timesPerSource.flat())];
                this.availableTimesSignal.set(all.sort((a, b) => Date.parse(a) - Date.parse(b)));
            },
            error: (error: unknown) => console.error("Failed to load the available times", error),
        });
    }

    /**
     * Shows the values of all bitmap layers at the point the user clicks, in `pointWeather`. The
     * values follow the layers' time, and the popup position follows the map when it moves.
     */
    public listenForPointQueries(map: OlMap): void {
        map.on("singleclick", event => this.queryPoint(map, event.coordinate));
        map.on("postrender", () => {
            const point = this.pointWeatherSignal();
            if (point === undefined || this.pointCoordinate === undefined) {
                return;
            }
            if (this.layersTimesKey(map) !== this.pointTimesKey) {
                this.queryPoint(map, this.pointCoordinate, false);
                return;
            }
            const pixel = map.getPixelFromCoordinate(this.pointCoordinate);
            if (pixel && (pixel[0] !== point.pixel[0] || pixel[1] !== point.pixel[1])) {
                this.pointWeatherSignal.set({...point, pixel: [pixel[0], pixel[1]]});
            }
        });
    }

    /** Closes the point weather popup. */
    public clearPointWeather(): void {
        this.pointRequest?.unsubscribe();
        this.seriesRequest?.unsubscribe();
        this.pointCoordinate = undefined;
        this.pointWeatherSignal.set(undefined);
    }

    /**
     * Loads the values of all layers at `coordinate` for the times they show now, and with
     * `withSeries` also the values over time of the layers that have a chart.
     */
    private queryPoint(map: OlMap, coordinate: Coordinate, withSeries = true): void {
        const layers = this.edrBitmapLayers(map);
        const pixel = map.getPixelFromCoordinate(coordinate);
        if (layers.length === 0 || !pixel) {
            return;
        }
        const [lon, lat] = toLonLat(coordinate, map.getView().getProjection());
        const lonLat: [number, number] = [lon, lat];
        const labels = layers.map(
            ({layer, source}) => layer.getLegend()?.title ?? source.getParameterName()
        );
        const times = layers.map(({source}) => source.getTime());
        const previous = this.pointWeatherSignal();
        this.pointRequest?.unsubscribe();
        this.pointCoordinate = coordinate;
        this.pointTimesKey = this.layersTimesKey(map);
        this.pointWeatherSignal.set({
            lonLat,
            time: layers[0].source.getSelectedTime(),
            pixel: [pixel[0], pixel[1]],
            values: labels.map((label, index) => ({label, time: times[index]})),
            loading: true,
            series: withSeries ? [] : (previous?.series ?? []),
            seriesLoading: withSeries || (previous?.seriesLoading ?? false),
        });

        const requests = layers.map(({source}, index) => {
            const time = times[index];
            return time === undefined ? of(undefined) : source.getValueAt(lonLat, time);
        });
        this.pointRequest = forkJoin(requests).subscribe({
            next: values => {
                const formatted = values.map((value, index): PointWeatherValue => {
                    const entry = {label: labels[index], time: times[index]};
                    if (value === undefined) {
                        return entry;
                    }
                    const formatValue = layers[index].layer.getLegend()?.formatValue;
                    return {...entry, value: formatValue?.(value) ?? value.toFixed(1)};
                });
                this.updatePoint({values: formatted, loading: false});
            },
            error: (error: unknown) =>
                this.updatePoint({loading: false, error: describeEdrError(error)}),
        });

        if (withSeries) {
            this.querySeries(layers, lonLat);
        }
    }

    /** Loads the values over time at `lonLat` of the layers that have a chart. */
    private querySeries(
        layers: {layer: BitmapLayer; source: EdrGridSource}[],
        lonLat: [number, number]
    ): void {
        this.seriesRequest?.unsubscribe();
        const charted = layers.filter(({layer}) => layer.getTimeSeriesOptions() !== undefined);
        if (charted.length === 0) {
            this.updatePoint({seriesLoading: false});
            return;
        }
        const requests = charted.map(({layer, source}) => {
            const {title, toDisplayUnit = (value: number) => value} = layer.getTimeSeriesOptions()!;
            return source.getValuesOverTime(lonLat).pipe(
                mapValues((points): TimeSeries => ({
                    title,
                    points: points.map(({time, value}) => ({
                        time,
                        value: value === undefined ? undefined : toDisplayUnit(value),
                    })),
                }))
            );
        });
        this.seriesRequest = forkJoin(requests).subscribe({
            next: series =>
                this.updatePoint({
                    series: series.filter(s => s.points.length > 0),
                    seriesLoading: false,
                }),
            error: (error: unknown) => {
                console.error("Failed to load the values over time", error);
                this.updatePoint({seriesLoading: false});
            },
        });
    }

    /** Changes the current point, keeping its latest pixel position. */
    private updatePoint(changes: Partial<PointWeather>): void {
        const point = this.pointWeatherSignal();
        if (point !== undefined) {
            this.pointWeatherSignal.set({...point, ...changes});
        }
    }

    /** Bitmap layers with an EDR source, bottom layer first. */
    private edrBitmapLayers(map: OlMap): {layer: BitmapLayer; source: EdrGridSource}[] {
        return map
            .getAllLayers()
            .filter(layer => layer instanceof BitmapLayer)
            .map(layer => ({layer, source: layer.getSource()}))
            .filter(
                (entry): entry is {layer: BitmapLayer; source: EdrGridSource} => entry.source !== null
            );
    }

    /** The times all EDR layers show now, joined into one string to compare. */
    private layersTimesKey(map: OlMap): string {
        return this.edrBitmapLayers(map)
            .map(({source}) => source.getTime() ?? "-")
            .join("|");
    }
}
