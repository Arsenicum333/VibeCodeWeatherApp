/**
 * Which data to request from the EDR service. Every parameter lives in a specific collection, so
 * both are needed. List all collections and their parameters at
 * https://api.openweather.cloud/edr/shmu/aladin/slovakia/collections
 */
export interface EdrParameter {
    collectionId: string;
    parameterName: string;
    z?: string;
}

/** Parameters of the ALADIN Slovakia model that are ready to use in `EdrGridSource`. */
export const ALADIN_PARAMETERS = {
    temperature2m: {
        collectionId: "sd:SHMU-Aladin-Slovakia_height-above-ground_2",
        parameterName: "temperature",
        z: "2",
    },
} satisfies Record<string, EdrParameter>;
