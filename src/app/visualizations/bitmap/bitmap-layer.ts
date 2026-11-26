import Layer, {Options} from "ol/layer/Layer";
import {EdrGridSource} from "../../edr/edr-grid-source";
import {LonLat} from "../../edr/edr-api.service";
import {Gradient, GradientMode} from "../../types/gradients.type";
import {LegendData, LegendOptions} from "../../types/legend.type";
import {TimeSeriesOptions} from "../../types/time-series.type";
import {BitmapLayerRenderer} from "./bitmap-layer-renderer";

export type BitmapLayerOptions = Options<EdrGridSource> & {
    /** Colours for the grid values. */
    gradient: Gradient;
    /** Smooth ("linear", the default) or banded ("stepped") colours between gradient stops. */
    gradientMode?: GradientMode;
    /** Labels of the layer's legend; without them the layer has no legend. */
    legend?: LegendOptions;
    /** Shows the layer's values over time in the point weather popup; without it there is no chart. */
    timeSeries?: TimeSeriesOptions;
    /** Polygon in [lon, lat] points outside which nothing is drawn, e.g. a country border. */
    clipPolygon?: LonLat[];
};

/**
 * Shows grid data (e.g. temperature) as a coloured image over the map. The colours are computed
 * per pixel on the GPU by `BitmapLayerRenderer`.
 */
export class BitmapLayer extends Layer<EdrGridSource, BitmapLayerRenderer> {
    private readonly gradient: Gradient;
    private readonly gradientMode: GradientMode;
    private readonly legend?: LegendOptions;
    private readonly timeSeries?: TimeSeriesOptions;
    private readonly clipPolygon?: LonLat[];

    constructor({
        gradient,
        gradientMode = "linear",
        legend,
        timeSeries,
        clipPolygon,
        ...options
    }: BitmapLayerOptions) {
        super(options);
        this.gradient = gradient;
        this.gradientMode = gradientMode;
        this.legend = legend;
        this.timeSeries = timeSeries;
        this.clipPolygon = clipPolygon;
    }

    /** The legend of the layer, with the colours it is drawn with; `undefined` if it has none. */
    getLegend(): LegendData | undefined {
        if (this.legend === undefined) {
            return undefined;
        }
        return {...this.legend, gradient: this.gradient, gradientMode: this.gradientMode};
    }

    /** How to chart the layer's values over time; `undefined` if it has no chart. */
    getTimeSeriesOptions(): TimeSeriesOptions | undefined {
        return this.timeSeries;
    }

    /** Called by OpenLayers when the layer is first rendered. */
    override createRenderer(): BitmapLayerRenderer {
        return new BitmapLayerRenderer(this, this.gradient, this.gradientMode, this.clipPolygon);
    }
}
