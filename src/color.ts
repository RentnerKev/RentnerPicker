import type { ColorFormat, RgbColor } from './types.js'

const hexColorPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const rgbColorPattern =
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i

export const defaultPickerColor = '#13ecd6'

export interface HsvColor {
    hue: number
    saturation: number
    value: number
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function normalizeHex(value: string): string | null {
    const match = value.trim().match(hexColorPattern)

    if (!match) {
        return null
    }

    const hex = match[1].toLowerCase()
    const expandedHex =
        hex.length === 3
            ? hex
                  .split('')
                  .map((character) => `${character}${character}`)
                  .join('')
            : hex

    return `#${expandedHex}`
}

function parseRgb(value: string): RgbColor | null {
    const match = value.trim().match(rgbColorPattern)

    if (!match) {
        return null
    }

    const [red, green, blue] = match.slice(1).map(Number)

    if ([red, green, blue].some((channel) => channel > 255)) {
        return null
    }

    return { red, green, blue }
}

export function rgbToHex({ red, green, blue }: RgbColor) {
    return `#${[red, green, blue]
        .map((channel) =>
            clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'),
        )
        .join('')}`
}

/**
 * Converts a three- or six-digit HEX color to RGB. The leading hash is
 * optional. Unsupported or malformed values return `null`.
 */
export function hexToRgb(value: string): RgbColor | null {
    const normalizedHex = normalizeHex(value)

    if (!normalizedHex) {
        return null
    }

    return {
        red: parseInt(normalizedHex.slice(1, 3), 16),
        green: parseInt(normalizedHex.slice(3, 5), 16),
        blue: parseInt(normalizedHex.slice(5, 7), 16),
    }
}

/**
 * Normalizes supported HEX and `rgb(r, g, b)` values to lowercase six-digit
 * HEX. The leading hash is optional for HEX input. Invalid values return
 * `null` instead of silently falling back to another color.
 */
export function normalizeColor(value: string): string | null {
    const normalizedHex = normalizeHex(value)

    if (normalizedHex) {
        return normalizedHex
    }

    const rgb = parseRgb(value)

    return rgb ? rgbToHex(rgb) : null
}

export function isValidColor(value: string) {
    return normalizeColor(value) !== null
}

export function rgbToHsv({ red, green, blue }: RgbColor): HsvColor {
    const normalizedRed = red / 255
    const normalizedGreen = green / 255
    const normalizedBlue = blue / 255
    const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue)
    const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue)
    const delta = max - min

    let hue = 0

    if (delta !== 0) {
        if (max === normalizedRed) {
            hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6)
        } else if (max === normalizedGreen) {
            hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2)
        } else {
            hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4)
        }
    }

    return {
        hue: Math.round(hue < 0 ? hue + 360 : hue),
        saturation: max === 0 ? 0 : Math.round((delta / max) * 100),
        value: Math.round(max * 100),
    }
}

export function hsvToRgb({ hue, saturation, value }: HsvColor): RgbColor {
    const normalizedHue = ((hue % 360) + 360) % 360
    const normalizedSaturation = clamp(saturation, 0, 100) / 100
    const normalizedValue = clamp(value, 0, 100) / 100
    const chroma = normalizedValue * normalizedSaturation
    const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1))
    const match = normalizedValue - chroma

    let red = 0
    let green = 0
    let blue = 0

    if (normalizedHue < 60) {
        red = chroma
        green = x
    } else if (normalizedHue < 120) {
        red = x
        green = chroma
    } else if (normalizedHue < 180) {
        green = chroma
        blue = x
    } else if (normalizedHue < 240) {
        green = x
        blue = chroma
    } else if (normalizedHue < 300) {
        red = x
        blue = chroma
    } else {
        red = chroma
        blue = x
    }

    return {
        red: Math.round((red + match) * 255),
        green: Math.round((green + match) * 255),
        blue: Math.round((blue + match) * 255),
    }
}

export function toPickerHex(value: string) {
    return normalizeColor(value) ?? defaultPickerColor
}

export function formatColor(value: string, format: ColorFormat) {
    const normalizedColor = normalizeColor(value)

    if (!normalizedColor) {
        return value
    }

    if (format === 'rgb') {
        const rgb = hexToRgb(normalizedColor)

        return rgb ? `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})` : value
    }

    return normalizedColor
}

export function getHsvFromValue(value: string): HsvColor {
    const rgb = hexToRgb(toPickerHex(value))

    return rgb ? rgbToHsv(rgb) : { hue: 176, saturation: 92, value: 93 }
}
