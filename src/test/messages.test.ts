import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    CustomColorPicker,
    pickerMessageCatalog,
    resolvePickerMessages,
} from '../index.js'

describe('picker locale messages', () => {
    test('keeps German defaults', () => {
        const messages = resolvePickerMessages()

        expect(messages).toEqual(pickerMessageCatalog.de)
        expect(messages.required).toBe('Dieses Feld ist erforderlich')
        expect(messages.invalidColor).toBe(
            'Bitte eine gültige HEX- oder RGB-Farbe angeben',
        )
        expect(messages.eyeDropper).toBe('Farbe mit Pipette auswählen')
        expect(messages.closePicker).toBe('Picker schließen')
        expect(messages.presetColor('#abc')).toBe('Farbe #abc auswählen')
    })

    test('provides complete English defaults', () => {
        const messages = resolvePickerMessages('en')

        expect(messages).toEqual(pickerMessageCatalog.en)
        expect(messages.required).toBe('This field is required')
        expect(messages.invalidColor).toBe(
            'Please enter a valid HEX or RGB color',
        )
        expect(messages.eyeDropper).toBe('Select color with eyedropper')
        expect(messages.closePicker).toBe('Close picker')
        expect(messages.colorArea).toBe('Color area')
        expect(messages.hue).toBe('Hue')
        expect(messages.selectColor).toBe('Select color')
        expect(messages.presetColor('#abc')).toBe('Select color #abc')
    })

    test('merges partial overrides and localizes rendered ARIA labels', () => {
        const messages = resolvePickerMessages('en', {
            selectColor: 'Choose a color',
            presetColor: (color) => `Use ${color}`,
        })

        expect(messages.invalidColor).toBe(
            'Please enter a valid HEX or RGB color',
        )
        expect(messages.selectColor).toBe('Choose a color')
        expect(messages.presetColor('#abc')).toBe('Use #abc')

        const markup = renderToStaticMarkup(
            createElement(CustomColorPicker, {
                value: '#abc',
                onValueChange: () => undefined,
                locale: 'en',
                messages: {
                    selectColor: 'Choose a color',
                    presetColor: (color) => `Use ${color}`,
                },
                presets: ['#abc'],
            }),
        )

        expect(markup).toContain('aria-label="Choose a color"')
        expect(markup).toContain('aria-label="Use #abc"')
    })
})
