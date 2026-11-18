import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {map, Observable} from "rxjs";
import {Coverage} from "./coverage-json";
import {EdrNoDataError} from "./edr-error";

/** Bounding box in longitude/latitude degrees: [minLon, minLat, maxLon, maxLat]. */
export type LonLatBbox = [number, number, number, number];

/** EDR (OGC Environmental Data Retrieval) service with the SHMU ALADIN model for Slovakia. */
const EDR_BASE_URL = "https://api.openweather.cloud/edr/shmu/aladin/slovakia";

export const ALADIN_SLOVAKIA_DOMAIN: LonLatBbox = [16.8, 47.7, 22.6, 49.7];

const CUBE_QUERY = {
    collectionId: "sd:SHMU-Aladin-Slovakia_height-above-ground_2",
    z: "2",
    crs: "CRS:84",
    format: "CoverageJSON",
} as const;

@Injectable({providedIn: "root"})
export class EdrService {
    private readonly http = inject(HttpClient);

    /** Fetches the grid of `parameterName` (e.g. `temperature`) inside `bbox` for the current hour. */
    getCube(parameterName: string, bbox: LonLatBbox): Observable<Coverage> {
        const query = CUBE_QUERY;
        const url = `${EDR_BASE_URL}/collections/${encodeURIComponent(query.collectionId)}/cube`;
        const params = new HttpParams()
            .set("parameter-name", parameterName)
            .set("bbox", bbox.join(","))
            .set("z", query.z)
            .set("crs", query.crs)
            .set("f", query.format)
            .set("datetime", this.currentHour());

        return this.http.get<Coverage | null>(url, {params}).pipe(
            map(coverage => {
                if (coverage === null) {
                    throw new EdrNoDataError();
                }
                return coverage;
            })
        );
    }

    /** Current time rounded down to the hour, e.g. `2026-11-18T13:00:00.000Z`. */
    private currentHour(): string {
        const now = new Date();
        now.setUTCMinutes(0, 0, 0);
        return now.toISOString();
    }
}
