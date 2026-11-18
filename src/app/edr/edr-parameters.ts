import {EdrDataset} from "./edr-datasets";

/**
 * Which data to request from an EDR service. Every parameter lives in a specific collection of a
 * specific dataset, so all three are needed. List all collections and their parameters at
 * `${dataset.baseUrl}/collections`. Ready-to-use parameters are defined in
 * `src/app/consts/parameters.ts`.
 */
export interface EdrParameter {
    dataset: EdrDataset;
    collectionId: string;
    parameterName: string;
    z?: string;
}
