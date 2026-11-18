import {HttpClient, HttpParams} from "@angular/common/http";
import {Injectable, inject} from "@angular/core";
import {map, Observable} from "rxjs";
import {Coverage} from "../types/coverage-json.type";
import {EdrNoDataError} from "./edr-error";
import {EdrParameter} from "../types/edr-parameters.type";

/** Bounding box in longitude/latitude degrees: [minLon, minLat, maxLon, maxLat]. */
export type LonLatBbox = [number, number, number, number];

const CUBE_QUERY = {
    crs: "CRS:84",
    format: "CoverageJSON",
} as const;

@Injectable({providedIn: "root"})
export class EdrApiService {
    private readonly http = inject(HttpClient);

    /**
     * Fetches the grid of `parameter` inside `bbox` for the current hour, from the EDR service
     * (OGC Environmental Data Retrieval) of the parameter's dataset.
     */
    getCube(parameter: EdrParameter, bbox: LonLatBbox): Observable<Coverage> {
        const query = CUBE_QUERY;
        const collection = encodeURIComponent(parameter.collectionId);
        const url = `${parameter.dataset.baseUrl}/collections/${collection}/cube`;
        let params = new HttpParams()
            .set("parameter-name", parameter.parameterName)
            .set("bbox", bbox.join(","))
            .set("crs", query.crs)
            .set("f", query.format)
            .set("datetime", this.currentHour());
        if (parameter.z !== undefined) {
            params = params.set("z", parameter.z);
        }

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
