import {Component, input, model} from "@angular/core";

export interface LayerState {
    temperature: boolean;
    precipitation: boolean;
    radar: boolean;
}

/**
 * Allows users to toggle visibility of weather layers. Shows checkboxes for each layer with
 * descriptive icons and labels.
 */
@Component({
    selector: "app-layer-toggle",
    templateUrl: "./layer-toggle.html",
    styleUrl: "./layer-toggle.css",
})
export class LayerToggleComponent {
    readonly layers = model.required<LayerState>();

    protected readonly layerOptions = [
        {id: "temperature", label: "Temperature", icon: "🌡️"},
        {id: "precipitation", label: "Precipitation", icon: "🌧️"},
        {id: "radar", label: "Radar", icon: "📡"},
    ] as const;

    protected toggleLayer(id: keyof LayerState): void {
        const current = this.layers();
        this.layers.set({...current, [id]: !current[id]});
    }
}
