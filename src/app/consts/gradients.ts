import {Gradient} from "../types/gradients.type";

const KELVIN_AT_0_CELSIUS = 273.15;

function celsius(value: number): number {
    return value + KELVIN_AT_0_CELSIUS;
}

/** Air temperature colours, with values in Kelvin (the unit of the EDR temperature data). */
export const TEMPERATURE_GRADIENT_IN_KELVIN: Gradient = [
    {value: celsius(-30), color: [145, 0, 200, 255]},
    {value: celsius(-20), color: [80, 40, 220, 255]},
    {value: celsius(-10), color: [40, 110, 240, 255]},
    {value: celsius(0), color: [140, 210, 250, 255]},
    {value: celsius(5), color: [120, 200, 130, 255]},
    {value: celsius(10), color: [190, 230, 90, 255]},
    {value: celsius(15), color: [250, 220, 70, 255]},
    {value: celsius(20), color: [250, 160, 40, 255]},
    {value: celsius(30), color: [230, 50, 30, 255]},
    {value: celsius(40), color: [140, 0, 30, 255]},
];

/**
 * Precipitation colours, with values in mm (kg/m², the unit of the EDR precipitation data). Less
 * than 0.1 mm is transparent, so dry areas show the layers below.
 */
export const PRECIPITATION_GRADIENT_IN_MM: Gradient = [
    {value: 0, color: [0, 0, 0, 0]},
    {value: 0.1, color: [170, 215, 255, 200]},
    {value: 0.5, color: [100, 170, 245, 230]},
    {value: 1, color: [40, 110, 230, 255]},
    {value: 2, color: [20, 60, 190, 255]},
    {value: 5, color: [120, 40, 200, 255]},
    {value: 10, color: [200, 30, 170, 255]},
    {value: 20, color: [230, 30, 60, 255]},
    {value: 50, color: [255, 150, 0, 255]},
];

/**
 * Radar reflectivity colours, with values in dBZ. Weak echoes below 5 dBZ (drizzle, noise) are
 * transparent; then light rain in blue, moderate rain in green and yellow, storms in red and purple.
 */
export const RADAR_REFLECTIVITY_GRADIENT_IN_DBZ: Gradient = [
    {value: 5, color: [0, 0, 0, 0]},
    {value: 10, color: [140, 200, 255, 190]},
    {value: 15, color: [60, 140, 240, 220]},
    {value: 20, color: [0, 170, 110, 235]},
    {value: 25, color: [0, 130, 40, 245]},
    {value: 30, color: [250, 220, 0, 255]},
    {value: 35, color: [255, 150, 0, 255]},
    {value: 40, color: [240, 40, 30, 255]},
    {value: 45, color: [190, 0, 90, 255]},
    {value: 50, color: [150, 0, 200, 255]},
    {value: 55, color: [240, 200, 255, 255]},
];

/** Relative humidity colours, with values in percent (0-100). Dry air in yellow, humid air in blue. */
export const HUMIDITY_GRADIENT_IN_PERCENT: Gradient = [
    {value: 0, color: [255, 220, 0, 200]},
    {value: 20, color: [255, 180, 0, 220]},
    {value: 40, color: [100, 180, 255, 240]},
    {value: 60, color: [60, 140, 240, 255]},
    {value: 80, color: [30, 100, 220, 255]},
    {value: 100, color: [20, 50, 180, 255]},
];

/** Wind speed colours, with values in m/s. Calm in grey, light breeze in blue, strong winds in red. */
export const WIND_SPEED_GRADIENT_IN_MS: Gradient = [
    {value: 0, color: [150, 150, 150, 180]},
    {value: 2, color: [100, 180, 240, 220]},
    {value: 4, color: [60, 150, 240, 240]},
    {value: 6, color: [255, 220, 0, 255]},
    {value: 8, color: [255, 150, 0, 255]},
    {value: 10, color: [240, 50, 50, 255]},
    {value: 15, color: [200, 0, 100, 255]},
];

/** Pressure colours, with values in hPa. Low pressure (storms) in purple, high pressure in red. */
export const PRESSURE_GRADIENT_IN_HPA: Gradient = [
    {value: 980, color: [150, 0, 200, 220]},
    {value: 1000, color: [100, 100, 240, 240]},
    {value: 1013, color: [150, 200, 150, 255]},
    {value: 1020, color: [255, 200, 100, 255]},
    {value: 1040, color: [255, 100, 50, 255]},
];
