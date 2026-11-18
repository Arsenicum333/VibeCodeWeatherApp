/** One colour of a gradient: grid values equal to `value` are drawn in `color`. */
export interface GradientStop {
    /** Value in the units of the grid data. */
    value: number;
    /** Red, green, blue and alpha, each 0–255. */
    color: [number, number, number, number];
}

/**
 * Colour stops ordered by value; colours between two stops are blended linearly. Ready-to-use
 * gradients are defined in `src/app/consts/gradients.ts`.
 */
export type Gradient = GradientStop[];

/**
 * How colours between two stops are chosen:
 * - "linear": blended smoothly from one stop's colour to the next.
 * - "stepped": the colour of the highest stop at or below the value, giving sharp bands.
 */
export type GradientMode = "linear" | "stepped";

/** Most stops a gradient can have; matches the array size in the fragment shader. */
export const MAX_GRADIENT_STOPS = 16;
