import {TimeSeries} from "./time-series.type";

/** One line of the point weather popup, e.g. temperature. */
export interface PointWeatherValue {
    /** What the value is, with its unit, e.g. `"Temperature [°C]"`. */
    label: string;
    /** Formatted value; `undefined` while loading or where the layer has no data. */
    value?: string;
    /** Time of the value, when the layer has one for the selected time. */
    time?: string;
}

/** Weather at the point the user clicked, for the popup over the map. */
export interface PointWeather {
    /** Clicked point in longitude/latitude degrees. */
    lonLat: [number, number];
    /** Time selected by the user, e.g. `2026-11-18T13:00:00Z`. */
    time: string;
    /** Position of the point on the screen, in CSS pixels from the top-left corner of the map. */
    pixel: [number, number];
    values: PointWeatherValue[];
    loading: boolean;
    /** Why the values could not be loaded. */
    error?: string;
    /** Values over time of the layers that have a chart. */
    series: TimeSeries[];
    seriesLoading: boolean;
}
