import {EdrParameter} from "../types/edr-parameters.type";
import {ALADIN_SLOVAKIA, SHMU_RADARS} from "./datasets";

/** Parameters of the ALADIN Slovakia model that are ready to use in `EdrGridSource`. */
export const ALADIN_PARAMETERS = {
    temperature2m: {
        dataset: ALADIN_SLOVAKIA,
        collectionId: "sd:SHMU-Aladin-Slovakia_height-above-ground_2",
        parameterName: "temperature",
        z: "2",
    },
    /** Total precipitation accumulated over the last hour, in kg/m² (= mm). */
    precipitation1h: {
        dataset: ALADIN_SLOVAKIA,
        collectionId: "sd:SHMU-Aladin-Slovakia_single-level_3",
        parameterName: "surfprec-total_gnd-surf_stat:acc/PT1H",
    },
} satisfies Record<string, EdrParameter>;

/** Products of the SHMU radar network. */
export const SHMU_RADAR_PARAMETERS = {
    /**
     * Radar reflectivity 2 km above sea level (CAPPI), in dBZ. The service labels it mm/h, but the
     * values (about -20 to 60, negative for weak echoes) are reflectivity. No echo is `null`.
     */
    cappi2km: {
        dataset: SHMU_RADARS,
        collectionId: "shmu-cappi-2km",
        parameterName: "shmu-cappi-2km",
        // The full grid of the visible area is about 8 MB; 350 × 350 points is about 2 MB.
        gridSize: 350,
    },
} satisfies Record<string, EdrParameter>;
