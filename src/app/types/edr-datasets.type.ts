import type {LonLatBbox} from "../edr/edr-api.service";

/**
 * One EDR service (e.g. a weather model) on api.openweather.cloud. The datasets the app uses are
 * defined in `src/app/consts/datasets.ts`.
 */
export interface EdrDataset {
    /** URL of the EDR service; `${baseUrl}/collections` lists its collections and parameters. */
    baseUrl: string;
    /** Area the dataset covers. Requests are clipped to it; outside it there is no data. */
    domain: LonLatBbox;
    /** Credit shown in the map's attribution line. */
    attribution: string;
}
