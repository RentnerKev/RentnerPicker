import { describe, expect, test } from 'bun:test'
import {
    hexToRgb,
    parseColor,
    rgbaToHex,
    formatColor,
    isValidColor,
    normalizeColor,
} from '../../../lib/Color/color.ts'
import {
    getHsvFromValue,
    hsvToRgb,
    rgbToHex,
} from '../../../lib/Color/color.ts'

describe('color utilities', () => {
    test('normalizes supported HEX values to lowercase six-digit HEX', () => {
        expect(normalizeColor('#AbC')).toBe('#aabbcc')
        expect(normalizeColor(' A1B2C3 ')).toBe('#a1b2c3')
        expect(normalizeColor('123')).toBe('#112233')
        expect(isValidColor('AbC')).toBeTrue()
    })

    test('normalizes RGB values and validates channel boundaries', () => {
        expect(normalizeColor('rgb(19, 236, 214)')).toBe('#13ecd6')
        expect(normalizeColor('RGB(0, 127, 255)')).toBe('#007fff')
        expect(isValidColor('rgb(0, 127, 255)')).toBeTrue()
        expect(normalizeColor('rgb(256, 0, 0)')).toBeNull()
        expect(normalizeColor('rgb(-1, 0, 0)')).toBeNull()
    })

    test('rejects unsupported alpha, percentage and malformed colors', () => {
        const invalidColors = [
            '',
            '#abcd',
            '#00112233',
            'rgba(0, 0, 0, 0.5)',
            'rgb(100%, 0%, 0%)',
            'not-a-color',
        ]

        for (const color of invalidColors) {
            expect(isValidColor(color)).toBeFalse()
            expect(normalizeColor(color)).toBeNull()
        }
    })

    test('converts short and long HEX values to RGB', () => {
        expect(hexToRgb('#13ecd6')).toEqual({
            red: 19,
            green: 236,
            blue: 214,
        })
        expect(hexToRgb('f0a')).toEqual({
            red: 255,
            green: 0,
            blue: 170,
        })
        expect(hexToRgb('rgb(1, 2, 3)')).toBeNull()
        expect(hexToRgb('#ffff')).toBeNull()
    })

    test('preserves HSV precision so HEX colors round-trip without changes', () => {
        const hsv = getHsvFromValue('#abcdef')

        expect(hsv.hue).toBeCloseTo(210, 10)
        expect(hsv.saturation).toBeCloseTo((68 / 239) * 100, 10)
        expect(hsv.value).toBeCloseTo((239 / 255) * 100, 10)
        expect(rgbToHex(hsvToRgb(hsv))).toBe('#abcdef')
    })
})

describe('alpha color utilities', () => {
    test('parses alpha hex and rgba without changing legacy validation', () => {
        expect(parseColor('#f008')).toEqual({
            red: 255,
            green: 0,
            blue: 0,
            alpha: 136 / 255,
        })
        expect(parseColor('rgba(12, 34, 56, .5)')).toEqual({
            red: 12,
            green: 34,
            blue: 56,
            alpha: 0.5,
        })
        expect(parseColor('rgb(12, 34, 56)')?.alpha).toBe(1)
        expect(normalizeColor('#aBcD', true)).toBe('#aabbccdd')
        expect(normalizeColor('rgba(0, 127, 255, 0)', true)).toBe('#007fff00')
        expect(normalizeColor('#fff', true)).toBe('#ffffffff')
        expect(isValidColor('rgba(0, 0, 0, 0.5)')).toBeFalse()
        expect(isValidColor('rgba(0, 0, 0, 0.5)', true)).toBeTrue()
    })

    test('rejects invalid alpha and channels rather than clamping text', () => {
        for (const color of [
            '#12345',
            '#123456789',
            'rgba(256, 0, 0, .5)',
            'rgba(0, 0, 0, -1)',
            'rgba(0, 0, 0, 1.1)',
            'rgba(0, 0, 0, NaN)',
            'rgba(0, 0, 0, 50%)',
        ]) {
            expect(parseColor(color)).toBeNull()
            expect(isValidColor(color, true)).toBeFalse()
        }
    })

    test('formats alpha endpoints, rounds hex bytes and retains rgba precision', () => {
        expect(rgbaToHex({ red: 255, green: 0, blue: 128, alpha: 0.5 })).toBe(
            '#ff008080',
        )
        expect(
            parseColor(formatColor('rgba(1, 2, 3, 0.00000001)', 'rgba'))?.alpha,
        ).toBe(0.00000001)
        expect(formatColor('#1230', 'rgba')).toBe('rgba(17, 34, 51, 0)')
        expect(formatColor('#123f', 'rgba')).toBe('rgba(17, 34, 51, 1)')
        expect(formatColor('rgba(12, 34, 56, 0.5)', 'rgba')).toBe(
            'rgba(12, 34, 56, 0.5)',
        )
        expect(formatColor('rgba(12, 34, 56, 0.5)', 'hex8')).toBe('#0c223880')
        expect(getHsvFromValue('#ff000080').hue).toBe(0)
    })
})
