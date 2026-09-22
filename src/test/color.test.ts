import { describe, expect, test } from 'bun:test'
import { hexToRgb, isValidColor, normalizeColor } from '../index.js'

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
})
