import Layer, {Options} from "ol/layer/Layer";
import {EdrGridSource} from "../../edr/edr-grid-source";
import {Gradient} from "../../gradient";
import {BitmapLayerRenderer} from "./bitmap-layer-renderer";

export type BitmapLayerOptions = Options<EdrGridSource> & {
    /** Colours for the grid values. */
    gradient: Gradient;
};

/**
 * Shows grid data (e.g. temperature) as a coloured image over the map. The colours are computed
 * per pixel on the GPU by `BitmapLayerRenderer`.
 */
export class BitmapLayer extends Layer<EdrGridSource, BitmapLayerRenderer> {
    private readonly gradient: Gradient;

    constructor({gradient, ...options}: BitmapLayerOptions) {
        super(options);
        this.gradient = gradient;
    }

    /** Called by OpenLayers when the layer is first rendered. */
    override createRenderer(): BitmapLayerRenderer {
        return new BitmapLayerRenderer(this, this.gradient);
    }
}
