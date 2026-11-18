import {signal} from "@angular/core";
import OlMap from "ol/Map";
import {EdrGridSource, LOAD_ERROR_PROPERTY} from "../edr/edr-grid-source";

export class MapLayersHelperService {
    private readonly loadErrorsSignal = signal<string[]>([]);
    readonly loadErrors = this.loadErrorsSignal.asReadonly();

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
}
