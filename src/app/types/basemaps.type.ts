/** A tiled background map in the XYZ scheme, e.g. OpenStreetMap or Esri tiles. */
export interface Basemap {
    /** Tile URL template with `{x}`, `{y}` and `{z}`. */
    url: string;
    /** Credit shown in the map's attribution line (may contain HTML links). */
    attribution: string;
    maxZoom?: number;
}
