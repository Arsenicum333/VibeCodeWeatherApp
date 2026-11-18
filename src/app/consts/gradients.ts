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
