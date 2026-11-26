import {MAX_GRADIENT_STOPS} from "../../types/gradients.type";

/** Most points a clip polygon (see `BitmapLayerOptions.clipPolygon`) may have. */
export const MAX_CLIP_POINTS = 128;

/**
 * Draws a mesh whose vertices are in map coordinates. `u_matrix` turns map coordinates into
 * WebGL clip space (-1..1), based on the current view centre, resolution and rotation.
 */
export const BITMAP_VERTEX_SHADER = `#version 300 es
precision highp float;

uniform mat3 u_matrix;

in vec2 a_position;
in vec2 a_uv;
out vec2 v_uv;

void main() {
    v_uv = a_uv;
    gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
}
`;

/**
 * Colours every pixel of the mesh: looks up the grid value at the pixel's position in the data
 * texture (with bilinear interpolation) and converts it to a colour with the gradient.
 */
export const BITMAP_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

const int MAX_STOPS = ${MAX_GRADIENT_STOPS};
const int MAX_CLIP_POINTS = ${MAX_CLIP_POINTS};

// Two channels per grid point: (value, 1) where there is data and (0, 0) where it is missing.
// See packGridTexels() in bitmap-layer-renderer.ts.
uniform sampler2D u_data;
uniform float u_stopValues[MAX_STOPS];
uniform vec4 u_stopColors[MAX_STOPS];
uniform int u_stopCount;
// true: each value gets the colour of the stop below it; false: colours are blended between stops.
uniform bool u_stepped;
// Longitude/latitude covered by the mesh: [west, south, east, north].
uniform vec4 u_meshExtent;
// Optional clip polygon in longitude/latitude; nothing is clipped when u_clipCount < 3.
uniform vec2 u_clipPoints[MAX_CLIP_POINTS];
uniform int u_clipCount;

// Position within the grid: (0, 0) is the north-west corner, (1, 1) the south-east corner.
in vec2 v_uv;
out vec4 fragColor;

vec2 gridPoint(ivec2 coord) {
    ivec2 lastPoint = textureSize(u_data, 0) - 1;
    return texelFetch(u_data, clamp(coord, ivec2(0), lastPoint), 0).rg;
}

// Bilinear interpolation of both channels between the four grid points around uv.
// Missing points are (0, 0), so the result's green channel is the fraction of the neighbourhood
// that has data, and red is the sum of the valid values weighted by that same fraction.
vec2 interpolateGrid(vec2 uv) {
    // Texel centres are at half-integer positions.
    vec2 gridPosition = uv * vec2(textureSize(u_data, 0)) - 0.5;
    vec2 cellStart = floor(gridPosition);
    vec2 t = gridPosition - cellStart;
    ivec2 cell = ivec2(cellStart);

    vec2 north = mix(gridPoint(cell), gridPoint(cell + ivec2(1, 0)), t.x);
    vec2 south = mix(gridPoint(cell + ivec2(0, 1)), gridPoint(cell + ivec2(1, 1)), t.x);
    return mix(north, south, t.y);
}

// Even-odd rule: a point is inside when a ray going east from it crosses the outline an odd
// number of times.
bool insideClipPolygon(vec2 p) {
    bool inside = false;
    vec2 previous = u_clipPoints[0];
    for (int k = 1; k <= MAX_CLIP_POINTS; k++) {
        if (k > u_clipCount) {
            break;
        }
        vec2 current = u_clipPoints[k == u_clipCount ? 0 : k];
        if ((current.y > p.y) != (previous.y > p.y)) {
            float crossLon = current.x + (p.y - current.y) * (previous.x - current.x) / (previous.y - current.y);
            if (p.x < crossLon) {
                inside = !inside;
            }
        }
        previous = current;
    }
    return inside;
}

vec4 gradientColor(float value) {
    if (value <= u_stopValues[0]) {
        return u_stopColors[0];
    }
    for (int k = 1; k < MAX_STOPS; k++) {
        if (k >= u_stopCount) {
            break;
        }
        if (value < u_stopValues[k]) {
            if (u_stepped) {
                return u_stopColors[k - 1];
            }
            float t = (value - u_stopValues[k - 1]) / (u_stopValues[k] - u_stopValues[k - 1]);
            return mix(u_stopColors[k - 1], u_stopColors[k], t);
        }
    }
    return u_stopColors[u_stopCount - 1];
}

void main() {
    vec2 sampled = interpolateGrid(v_uv);
    float dataShare = sampled.g;
    // Draw only where at least half of the neighbourhood has data. The edge of the data then lies
    // halfway between the last valid grid point and the first missing one.
    if (dataShare < 0.5) {
        discard;
    }
    // Clip to the polygon (e.g. the border of Slovakia): v_uv is linear in lon/lat over the mesh.
    vec2 lonLat = vec2(
        mix(u_meshExtent.x, u_meshExtent.z, v_uv.x),
        mix(u_meshExtent.w, u_meshExtent.y, v_uv.y)
    );
    if (u_clipCount >= 3 && !insideClipPolygon(lonLat)) {
        discard;
    }
    // Dividing by the share of valid points ignores the missing ones in the average.
    vec4 color = gradientColor(sampled.r / dataShare);
    // The canvas expects premultiplied alpha.
    fragColor = vec4(color.rgb * color.a, color.a);
}
`;
