import Layer, {Options} from "ol/layer/Layer";
import {EdrGridSource} from "../../edr/edr-grid-source";
import {Gradient, GradientMode} from "../gradients";
import {BitmapLayerRenderer} from "./bitmap-layer-renderer";

export type BitmapLayerOptions = Options<EdrGridSource> & {
    /** Colours for the grid values. */
    gradient: Gradient;
    /** Smooth ("linear", the default) or banded ("stepped") colours between gradient stops. */
    gradientMode?: GradientMode;
};

/**
 * Shows grid data (e.g. temperature) as a coloured image over the map. The colours are computed
 * per pixel on the GPU by `BitmapLayerRenderer`.
 */
export class BitmapLayer extends Layer<EdrGridSource, BitmapLayerRenderer> {
    private readonly gradient: Gradient;
    private readonly gradientMode: GradientMode;

    constructor({gradient, gradientMode = "linear", ...options}: BitmapLayerOptions) {
        super(options);
        this.gradient = gradient;
        this.gradientMode = gradientMode;
    }

    /** Called by OpenLayers when the layer is first rendered. */
    override createRenderer(): BitmapLayerRenderer {
        return new BitmapLayerRenderer(this, this.gradient, this.gradientMode);
    }
}
