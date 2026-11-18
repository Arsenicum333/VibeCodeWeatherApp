import type {LonLatBbox} from "./edr.service";

/** One EDR service (e.g. a weather model) on api.openweather.cloud. */
export interface EdrDataset {
    /** URL of the EDR service; `${baseUrl}/collections` lists its collections and parameters. */
    baseUrl: string;
    /** Area the dataset covers. Requests are clipped to it; outside it there is no data. */
    domain: LonLatBbox;
    /** Credit shown in the map's attribution line. */
    attribution: string;
}

/** SHMU ALADIN weather model for Slovakia: hourly forecasts for the next few days. */
export const ALADIN_SLOVAKIA: EdrDataset = {
    baseUrl: "https://api.openweather.cloud/edr/shmu/aladin/slovakia",
    domain: [16.8, 47.7, 22.6, 49.7],
    attribution: "Weather data: ALADIN model by SHMU",
};
