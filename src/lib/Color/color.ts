import type {
    HsvColor,
    ColorFormat,
    RgbColor,
    RgbaColor,
} from './Types/color.types.ts'
export type { HsvColor } from './Types/color.types.ts'

const rgbColorPattern =
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
const rgbaColorPattern =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*\)$/i

const HEX_BYTES: readonly string[] = Array.from({ length: 256 }, (_, value) =>
    value.toString(16).padStart(2, '0'),
)

export const defaultPickerColor = '#13ecd6'

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function hexNibble(code: number): number {
    if (code >= 48 && code <= 57) return code - 48
    if (code >= 97 && code <= 102) return code - 87
    if (code >= 65 && code <= 70) return code - 55
    return -1
}

function parseHexOpaque(trimmed: string): RgbColor | null {
    const start = trimmed.charCodeAt(0) === 35 ? 1 : 0
    const length = trimmed.length - start
    if (length === 6) {
        const r0 = hexNibble(trimmed.charCodeAt(start))
        const r1 = hexNibble(trimmed.charCodeAt(start + 1))
        const g0 = hexNibble(trimmed.charCodeAt(start + 2))
        const g1 = hexNibble(trimmed.charCodeAt(start + 3))
        const b0 = hexNibble(trimmed.charCodeAt(start + 4))
        const b1 = hexNibble(trimmed.charCodeAt(start + 5))
        if ((r0 | r1 | g0 | g1 | b0 | b1) < 0) return null
        return {
            red: (r0 << 4) | r1,
            green: (g0 << 4) | g1,
            blue: (b0 << 4) | b1,
        }
    }
    if (length === 3) {
        const r = hexNibble(trimmed.charCodeAt(start))
        const g = hexNibble(trimmed.charCodeAt(start + 1))
        const b = hexNibble(trimmed.charCodeAt(start + 2))
        if ((r | g | b) < 0) return null
        return {
            red: (r << 4) | r,
            green: (g << 4) | g,
            blue: (b << 4) | b,
        }
    }
    return null
}

function parseHexAlpha(trimmed: string): RgbaColor | null {
    const start = trimmed.charCodeAt(0) === 35 ? 1 : 0
    const length = trimmed.length - start
    if (length === 8) {
        const r0 = hexNibble(trimmed.charCodeAt(start))
        const r1 = hexNibble(trimmed.charCodeAt(start + 1))
        const g0 = hexNibble(trimmed.charCodeAt(start + 2))
        const g1 = hexNibble(trimmed.charCodeAt(start + 3))
        const b0 = hexNibble(trimmed.charCodeAt(start + 4))
        const b1 = hexNibble(trimmed.charCodeAt(start + 5))
        const a0 = hexNibble(trimmed.charCodeAt(start + 6))
        const a1 = hexNibble(trimmed.charCodeAt(start + 7))
        if ((r0 | r1 | g0 | g1 | b0 | b1 | a0 | a1) < 0) return null
        return {
            red: (r0 << 4) | r1,
            green: (g0 << 4) | g1,
            blue: (b0 << 4) | b1,
            alpha: ((a0 << 4) | a1) / 255,
        }
    }
    if (length === 4) {
        const r = hexNibble(trimmed.charCodeAt(start))
        const g = hexNibble(trimmed.charCodeAt(start + 1))
        const b = hexNibble(trimmed.charCodeAt(start + 2))
        const a = hexNibble(trimmed.charCodeAt(start + 3))
        if ((r | g | b | a) < 0) return null
        return {
            red: (r << 4) | r,
            green: (g << 4) | g,
            blue: (b << 4) | b,
            alpha: ((a << 4) | a) / 255,
        }
    }
    return null
}

function isLowercaseHexDigits(
    value: string,
    start: number,
    length: number,
): boolean {
    for (let index = 0; index < length; index++) {
        const code = value.charCodeAt(start + index)
        if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 102))) {
            return false
        }
    }
    return true
}

function normalizeHexTrimmed(trimmed: string): string | null {
    const start = trimmed.charCodeAt(0) === 35 ? 1 : 0
    const length = trimmed.length - start
    if (length === 6) {
        if (start === 1 && isLowercaseHexDigits(trimmed, 1, 6)) return trimmed
        const rgb = parseHexOpaque(trimmed)
        return rgb ? rgbToHex(rgb) : null
    }
    if (length === 3) {
        const rgb = parseHexOpaque(trimmed)
        return rgb ? rgbToHex(rgb) : null
    }
    return null
}

function parseRgbTrimmed(trimmed: string): RgbColor | null {
    const first = trimmed.charCodeAt(0)
    if (first !== 114 && first !== 82) return null
    const match = rgbColorPattern.exec(trimmed)
    if (!match) return null

    const red = Number(match[1])
    const green = Number(match[2])
    const blue = Number(match[3])

    if (red > 255 || green > 255 || blue > 255) {
        return null
    }

    return { red, green, blue }
}

function parseRgbaTrimmed(trimmed: string): RgbaColor | null {
    const first = trimmed.charCodeAt(0)
    if (first !== 114 && first !== 82) return null
    const match = rgbaColorPattern.exec(trimmed)
    if (!match) return null

    const red = Number(match[1])
    const green = Number(match[2])
    const blue = Number(match[3])
    const alpha = Number(match[4])

    if (
        red > 255 ||
        green > 255 ||
        blue > 255 ||
        !Number.isFinite(alpha) ||
        alpha > 1
    ) {
        return null
    }

    return { red, green, blue, alpha }
}

/** Parses supported RGB/RGBA and three-, four-, six- or eight-digit HEX. */
export function parseColor(value: string): RgbaColor | null {
    const trimmed = value.trim()
    if (!trimmed) return null

    const opaque = parseHexOpaque(trimmed)
    if (opaque) {
        return {
            red: opaque.red,
            green: opaque.green,
            blue: opaque.blue,
            alpha: 1,
        }
    }

    const alphaHex = parseHexAlpha(trimmed)
    if (alphaHex) return alphaHex

    const rgb = parseRgbTrimmed(trimmed)
    if (rgb) {
        return { red: rgb.red, green: rgb.green, blue: rgb.blue, alpha: 1 }
    }

    return parseRgbaTrimmed(trimmed)
}

export function rgbaToHex({ red, green, blue, alpha }: RgbaColor): string {
    const r = HEX_BYTES[clamp(Math.round(red), 0, 255)]
    const g = HEX_BYTES[clamp(Math.round(green), 0, 255)]
    const b = HEX_BYTES[clamp(Math.round(blue), 0, 255)]
    const a = HEX_BYTES[clamp(Math.round(alpha * 255), 0, 255)]
    return `#${r}${g}${b}${a}`
}

export function rgbToHex({ red, green, blue }: RgbColor) {
    const r = HEX_BYTES[clamp(Math.round(red), 0, 255)]
    const g = HEX_BYTES[clamp(Math.round(green), 0, 255)]
    const b = HEX_BYTES[clamp(Math.round(blue), 0, 255)]
    return `#${r}${g}${b}`
}

/**
 * Converts a three- or six-digit HEX color to RGB. The leading hash is
 * optional. Unsupported or malformed values return `null`.
 */
export function hexToRgb(value: string): RgbColor | null {
    const trimmed = value.trim()
    return trimmed ? parseHexOpaque(trimmed) : null
}

/**
 * Normalizes supported HEX and `rgb(r, g, b)` values to lowercase six-digit
 * HEX. The leading hash is optional for HEX input. Invalid values return
 * `null` instead of silently falling back to another color. With enableAlpha,
 * RGBA and alpha HEX input are accepted and normalized to eight-digit HEX.
 */
export function normalizeColor(
    value: string,
    enableAlpha = false,
): string | null {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (enableAlpha) {
        if (
            trimmed.length === 9 &&
            trimmed.charCodeAt(0) === 35 &&
            isLowercaseHexDigits(trimmed, 1, 8)
        ) {
            return trimmed
        }
        const opaque = parseHexOpaque(trimmed)
        if (opaque) {
            return `#${HEX_BYTES[opaque.red]}${HEX_BYTES[opaque.green]}${HEX_BYTES[opaque.blue]}ff`
        }
        const alphaHex = parseHexAlpha(trimmed)
        if (alphaHex) return rgbaToHex(alphaHex)
        const rgb = parseRgbTrimmed(trimmed)
        if (rgb) {
            return `#${HEX_BYTES[rgb.red]}${HEX_BYTES[rgb.green]}${HEX_BYTES[rgb.blue]}ff`
        }
        const rgba = parseRgbaTrimmed(trimmed)
        return rgba ? rgbaToHex(rgba) : null
    }

    const normalizedHex = normalizeHexTrimmed(trimmed)
    if (normalizedHex) {
        return normalizedHex
    }

    const rgb = parseRgbTrimmed(trimmed)
    return rgb ? rgbToHex(rgb) : null
}

export function isValidColor(value: string, enableAlpha = false) {
    const trimmed = value.trim()
    if (!trimmed) return false

    if (parseHexOpaque(trimmed) !== null) return true
    if (enableAlpha && parseHexAlpha(trimmed) !== null) return true
    if (parseRgbTrimmed(trimmed) !== null) return true
    return enableAlpha && parseRgbaTrimmed(trimmed) !== null
}

export function rgbToHsv({ red, green, blue }: RgbColor): HsvColor {
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const delta = max - min

    let hue = 0

    if (delta !== 0) {
        if (max === red) {
            hue = 60 * (((green - blue) / delta) % 6)
        } else if (max === green) {
            hue = 60 * ((blue - red) / delta + 2)
        } else {
            hue = 60 * ((red - green) / delta + 4)
        }
    }

    return {
        hue: hue < 0 ? hue + 360 : hue,
        saturation: max === 0 ? 0 : (delta / max) * 100,
        value: (max / 255) * 100,
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

const defaultPickerHsv: HsvColor = rgbToHsv(parseHexOpaque(defaultPickerColor)!)

export function toPickerHex(value: string, enableAlpha = false) {
    return normalizeColor(value, enableAlpha) ?? defaultPickerColor
}

export function formatColor(value: string, format: ColorFormat) {
    const rgba = parseColor(value)
    if (!rgba) return value
    if (format === 'rgba')
        return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${rgba.alpha})`
    if (format === 'hex8') return rgbaToHex(rgba)
    if (format === 'rgb') return `rgb(${rgba.red}, ${rgba.green}, ${rgba.blue})`
    return rgbToHex(rgba)
}

export function getHsvFromValue(value: string): HsvColor {
    const rgb = parseColor(value)
    return rgb ? rgbToHsv(rgb) : { ...defaultPickerHsv }
}
