import {
    Component,
    ElementRef,
    OnDestroy,
    afterNextRender,
    effect,
    inject,
    linkedSignal,
    signal,
    viewChild,
} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import OlMap from "ol/Map";
import View from "ol/View";
import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import {fromLonLat} from "ol/proj";
import XYZ from "ol/source/XYZ";
import {ESRI_LIGHT_GRAY_BASE, ESRI_LIGHT_GRAY_LABELS} from "../consts/basemaps";
import {SLOVAKIA_BORDER} from "../consts/borders";
import {
    PRECIPITATION_GRADIENT_IN_MM,
    RADAR_REFLECTIVITY_GRADIENT_IN_DBZ,
    TEMPERATURE_GRADIENT_IN_KELVIN,
} from "../consts/gradients";
import {ALADIN_PARAMETERS, SHMU_RADAR_PARAMETERS} from "../consts/parameters";
import {EdrGridSource} from "../edr/edr-grid-source";
import {EdrApiService} from "../edr/edr-api.service";
import {BitmapLayer} from "../visualizations/bitmap/bitmap-layer";
import {TimeSeriesChartComponent} from "../time-series-chart/time-series-chart";
import {TimeSliderComponent} from "../time-slider/time-slider";
import {LegendComponent} from "../visualizations/legend/legend";
import {MapLayersHelperService} from "./map-layers-helper.service";
import {LayerToggleComponent, LayerState} from "./layer-toggle";
import {InfoPanelComponent} from "./info-panel";

@Component({
    selector: "app-map",
    templateUrl: "./map.html",
    styleUrl: "./map.css",
    imports: [
        DatePipe,
        DecimalPipe,
        LegendComponent,
        TimeSeriesChartComponent,
        TimeSliderComponent,
        LayerToggleComponent,
        InfoPanelComponent,
    ],
    providers: [],
})
export class MapComponent implements OnDestroy {
    protected readonly mapLayersHelper: MapLayersHelperService;
    protected readonly layerStates = signal<LayerState>({
        temperature: true,
        precipitation: true,
        radar: true,
    });

    private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>("mapContainer");
    private readonly edrApiService = inject(EdrApiService);
    private map?: OlMap;
    private weatherLayers: {
        temperature?: BitmapLayer;
        precipitation?: BitmapLayer;
        radar?: BitmapLayer;
    } = {};

    /**
     * Time selected on the timeline; each layer shows its own latest time at or before it. Keeps the
     * chosen time while it is still available; otherwise picks "now", the latest time that is not
     * in the future (the newest radar image).
     */
    protected readonly selectedTime = linkedSignal<string[], string>({
        source: () => this.mapLayersHelper.availableTimes(),
        computation: (times, previous) => {
            if (previous !== undefined && times.includes(previous.value)) {
                return previous.value;
            }
            const now = Date.now();
            const past = times.filter(time => Date.parse(time) <= now);
            return past.at(-1) ?? times[0] ?? currentHour();
        },
    });

    constructor() {
        this.mapLayersHelper = new MapLayersHelperService();
        // Create the map only once the container element is in the DOM and has a size.
        afterNextRender(() => {
            this.map = this.createMap(this.mapContainer().nativeElement);
            this.mapLayersHelper.listenForLoadErrors(this.map);
            this.mapLayersHelper.collectLegends(this.map);
            this.mapLayersHelper.collectAvailableTimes(this.map);
            this.mapLayersHelper.listenForPointQueries(this.map);
        });
        // The renderers read the selected time in every frame, so a new frame is enough.
        effect(() => {
            this.selectedTime();
            this.map?.render();
        });
        // Update layer visibility when layer states change
        effect(() => {
            const states = this.layerStates();
            if (this.weatherLayers.temperature) {
                this.weatherLayers.temperature.setOpacity(states.temperature ? 0.7 : 0);
            }
            if (this.weatherLayers.precipitation) {
                this.weatherLayers.precipitation.setOpacity(states.precipitation ? 0.9 : 0);
            }
            if (this.weatherLayers.radar) {
                this.weatherLayers.radar.setOpacity(states.radar ? 0.85 : 0);
            }
        });
    }

    private createMap(target: HTMLElement): OlMap {
        return new OlMap({
            target,
            layers: this.createLayers(),
            // Centred on Slovakia.
            view: new View({center: fromLonLat([19.7, 48.7]), zoom: 7}),
        });
    }

    /** Layers are rendered bottom to top, in array order. */
    private createLayers(): BaseLayer[] {
        const time = this.selectedTime.asReadonly();
        this.weatherLayers.temperature = new BitmapLayer({
            source: new EdrGridSource(this.edrApiService, ALADIN_PARAMETERS.temperature2m, time),
            gradient: TEMPERATURE_GRADIENT_IN_KELVIN,
            gradientMode: "linear",
            opacity: 0.7,
            legend: {
                title: "Temperature [°C]",
                formatValue: kelvin => String(Math.round(kelvin - 273.15)),
            },
            timeSeries: {
                title: "Temperature forecast [°C]",
                toDisplayUnit: kelvin => kelvin - 273.15,
            },
        });
        this.weatherLayers.precipitation = new BitmapLayer({
            source: new EdrGridSource(this.edrApiService, ALADIN_PARAMETERS.precipitation1h, time),
            gradient: PRECIPITATION_GRADIENT_IN_MM,
            gradientMode: "stepped",
            opacity: 0.9,
            legend: {title: "Precipitation forecast [mm/h]"},
        });
        this.weatherLayers.radar = new BitmapLayer({
            source: new EdrGridSource(this.edrApiService, SHMU_RADAR_PARAMETERS.cappi2km, time),
            gradient: RADAR_REFLECTIVITY_GRADIENT_IN_DBZ,
            gradientMode: "stepped",
            opacity: 0.85,
            clipPolygon: SLOVAKIA_BORDER,
            legend: {title: "Radar reflectivity [dBZ]"},
        });
        return [
            new TileLayer({source: new XYZ(ESRI_LIGHT_GRAY_BASE)}),
            this.weatherLayers.temperature,
            this.weatherLayers.precipitation,
            this.weatherLayers.radar,
            // Place names and borders above the weather, so they stay readable.
            new TileLayer({source: new XYZ(ESRI_LIGHT_GRAY_LABELS)}),
        ];
    }

    ngOnDestroy(): void {
        this.map?.setTarget();
    }
}

/** Current time rounded down to the hour, in the format of EDR times, e.g. `2026-11-18T13:00:00Z`. */
function currentHour(): string {
    const now = new Date();
    now.setUTCMinutes(0, 0, 0);
    return now.toISOString().replace(".000Z", "Z");
}
