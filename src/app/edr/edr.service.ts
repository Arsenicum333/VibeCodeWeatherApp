import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {Observable} from "rxjs";
import {Coverage} from "./coverage-json";

/** EDR (OGC Environmental Data Retrieval) service with the SHMU ALADIN model for Slovakia. */
const EDR_BASE_URL = "https://api.openweather.cloud/edr/shmu/aladin/slovakia";

/** What the cube request fetches. List all collections at `${EDR_BASE_URL}/collections`. */
const TEMPERATURE_CUBE_QUERY = {
    /** Collection with parameters at fixed heights above ground; holds 2 m air temperature. */
    collectionId: "sd:SHMU-Aladin-Slovakia_height-above-ground_2",
    /** Parameter to fetch; the value is in Kelvin. */
    parameterName: "temperature",
    /** Area around Slovakia as [minLon, minLat, maxLon, maxLat]. */
    bbox: [16.8, 47.7, 22.6, 49.7],
    /** Vertical level: 2 metres above ground. */
    z: "2",
    /** Coordinate system of the bbox and of the returned grid (longitude/latitude). */
    crs: "CRS:84",
    /** Response format; the cube query defaults to binary GRIB2. */
    format: "CoverageJSON",
} as const;

@Injectable({providedIn: "root"})
export class EdrService {
    private readonly http = inject(HttpClient);

    /** Fetches the 2 m temperature grid over Slovakia for the current hour. */
    getTemperatureCube(): Observable<Coverage> {
        const query = TEMPERATURE_CUBE_QUERY;
        const url = `${EDR_BASE_URL}/collections/${encodeURIComponent(query.collectionId)}/cube`;
        const params = new HttpParams()
            .set("parameter-name", query.parameterName)
            .set("bbox", query.bbox.join(","))
            .set("z", query.z)
            .set("crs", query.crs)
            .set("f", query.format)
            // The forecast covers only a few days, so ask for the current hour rather than a fixed time.
            // Without a datetime the service returns every forecast step at once (several MB).
            .set("datetime", this.currentHour());

        return this.http.get<Coverage>(url, {params});
    }

    /** Current time rounded down to the hour, e.g. `2026-11-18T13:00:00.000Z`. */
    private currentHour(): string {
        const now = new Date();
        now.setUTCMinutes(0, 0, 0);
        return now.toISOString();
    }
}
