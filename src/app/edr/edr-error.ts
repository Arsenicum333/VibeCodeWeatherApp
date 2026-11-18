import {HttpErrorResponse} from "@angular/common/http";

/**
 * The EDR service answered `204 No Content`: the request was valid, but there is no data for it,
 * e.g. a vertical level, time or area that the collection does not have.
 */
export class EdrNoDataError extends Error {
    constructor() {
        super(
            "The EDR service has no data for this request (HTTP 204). Check the collection, parameter, level and time."
        );
    }
}

/** Short, human-readable description of a failed EDR request, for showing to the user. */
export function describeEdrError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
            return "Cannot reach the EDR service. Check your internet connection.";
        }
        // EDR errors have a JSON body like {"code": "400", "description": "Parameter 'x' not found"}.
        // Other failures (e.g. from a proxy) may have no such body; then the status code is all we have.
        const description = (error.error as {description?: string} | null)?.description;
        const summary = `EDR request failed (HTTP ${error.status})`;
        return description ? `${summary}: ${description}` : summary;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "Loading the weather data failed for an unknown reason.";
}
