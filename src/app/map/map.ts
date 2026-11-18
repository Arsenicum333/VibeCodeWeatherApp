import {Component, ElementRef, OnDestroy, afterNextRender, viewChild} from "@angular/core";
import OlMap from "ol/Map";
import View from "ol/View";
import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

@Component({
    selector: "app-map",
    templateUrl: "./map.html",
    styleUrl: "./map.css",
})
export class MapComponent implements OnDestroy {
    private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>("mapContainer");
    private map?: OlMap;

    constructor() {
        // Create the map only once the container element is in the DOM and has a size.
        afterNextRender(() => {
            this.map = this.createMap(this.mapContainer().nativeElement);
        });
    }

    ngOnDestroy(): void {
        this.map?.setTarget();
    }

    private createMap(target: HTMLElement): OlMap {
        return new OlMap({
            target,
            layers: this.createLayers(),
            view: new View({center: [0, 0], zoom: 2}),
        });
    }

    /** Layers are rendered bottom to top, in array order. */
    private createLayers(): BaseLayer[] {
        return [new TileLayer({source: new OSM()})];
    }
}
