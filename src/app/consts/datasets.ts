import {EdrDataset} from "../types/edr-datasets.type";

/** SHMU ALADIN weather model for Slovakia: hourly forecasts for the next few days. */
export const ALADIN_SLOVAKIA: EdrDataset = {
    baseUrl: "https://api.openweather.cloud/edr/shmu/aladin/slovakia",
    domain: [16.8, 47.7, 22.6, 49.7],
    attribution: "Weather data: ALADIN model by SHMU",
};

/** SHMU weather radar composites: observations every 5 minutes (clipped to Slovakia area). */
export const SHMU_RADARS: EdrDataset = {
    baseUrl: "https://api.openweather.cloud/edr/radars",
    domain: [16.8, 47.7, 22.6, 49.7],
    attribution: "Radar data: SHMU",
};
