import {Gradient, GradientMode} from "./gradients.type";

/** How a layer's legend is labelled. */
export interface LegendOptions {
    /** Title including the unit, e.g. `"Temperature [°C]"`. */
    title: string;
    /** Converts gradient stop values for display (e.g. Kelvin to °C); shows them unchanged by default. */
    formatValue?: (value: number) => string;
}

/** Everything needed to draw the legend of a layer: its labels and the colours it draws with. */
export interface LegendData extends LegendOptions {
    gradient: Gradient;
    gradientMode: GradientMode;
}
