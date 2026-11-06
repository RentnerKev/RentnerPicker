export interface HsvColor {
    hue: number
    saturation: number
    value: number
}

export type ColorFormat = 'hex' | 'rgb' | 'hex8' | 'rgba'

export interface RgbColor {
    red: number
    green: number
    blue: number
}

/** RGB channels are 0–255; alpha is 0–1. */
export interface RgbaColor extends RgbColor {
    alpha: number
}
