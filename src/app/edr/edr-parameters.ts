import {ALADIN_SLOVAKIA, EdrDataset} from "./edr-datasets";

/**
 * Which data to request from an EDR service. Every parameter lives in a specific collection of a
 * specific dataset, so all three are needed. List all collections and their parameters at
 * `${dataset.baseUrl}/collections`.
 */
export interface EdrParameter {
    dataset: EdrDataset;
    collectionId: string;
    parameterName: string;
    z?: string;
}

/** Parameters of the ALADIN Slovakia model that are ready to use in `EdrGridSource`. */
export const ALADIN_PARAMETERS = {
    temperature2m: {
        dataset: ALADIN_SLOVAKIA,
        collectionId: "sd:SHMU-Aladin-Slovakia_height-above-ground_2",
        parameterName: "temperature",
        z: "2",
    },
} satisfies Record<string, EdrParameter>;
