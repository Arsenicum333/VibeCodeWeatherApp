import {Basemap} from "../types/basemaps.type";

const ESRI_ATTRIBUTION = "Basemap: Esri, HERE, Garmin, © OpenStreetMap contributors";

/** Esri Light Gray Canvas without labels, so the weather colours stand out on it. */
export const ESRI_LIGHT_GRAY_BASE: Basemap = {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: ESRI_ATTRIBUTION,
    maxZoom: 16,
};

/** Only the place names of the light grey map, to draw above the weather layers. */
export const ESRI_LIGHT_GRAY_LABELS: Basemap = {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: ESRI_ATTRIBUTION,
    maxZoom: 16,
};
