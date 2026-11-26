/** How a layer's values over time are shown in the chart of the point weather popup. */
export interface TimeSeriesOptions {
    /** Title including the unit, e.g. `"Temperature [°C]"`. */
    title: string;
    /** Converts values from the data's unit to the unit in the title (e.g. Kelvin to °C). */
    toDisplayUnit?: (value: number) => number;
}

/** One value of a time series, in the display unit. */
export interface TimeSeriesPoint {
    /** E.g. `2026-11-18T13:00:00Z`. */
    time: string;
    /** `undefined` where the data has a gap. */
    value?: number;
}

/** A layer's values over time at one point, for a chart. */
export interface TimeSeries {
    title: string;
    points: TimeSeriesPoint[];
}
