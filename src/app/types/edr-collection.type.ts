/** The part of an EDR collection's metadata (`GET ${baseUrl}/collections/{collectionId}`) the app uses. */
export interface EdrCollection {
    id: string;
    extent: {
        temporal?: {
            /** Times with data, e.g. `2026-11-18T13:00:00Z`. */
            values?: string[];
        };
    };
}
