import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CustomColorPicker } from '../index.js'
import { mergeAriaIds, resolveFieldError } from '../field.js'

describe('picker field contract', () => {
    test('lets an external error control the resolved field error', () => {
        expect(resolveFieldError('Internal error', undefined, false)).toEqual({
            error: 'Internal error',
            hasError: false,
        })
        expect(
            resolveFieldError('Internal error', 'Server error', false),
        ).toEqual({
            error: 'Server error',
            hasError: true,
        })
        expect(resolveFieldError('Internal error', null, true)).toEqual({
            error: null,
            hasError: false,
        })
    })

    test('merges consumer and generated aria descriptions once', () => {
        expect(
            mergeAriaIds(
                'external-help shared',
                'picker-description shared',
                'picker-error',
            ),
        ).toBe('external-help shared picker-description picker-error')
    })

    test('renders labels, descriptions, errors and disables the form input', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomColorPicker, {
                id: 'brand-color',
                name: 'brandColor',
                value: '',
                onValueChange: () => undefined,
                label: 'Brand color',
                description: 'Used throughout the application',
                error: 'Choose an approved color',
                required: true,
                disabled: true,
                'aria-describedby': 'external-help',
                'aria-controls': 'brand-color-dialog',
                'aria-keyshortcuts': 'Alt+ArrowDown',
            }),
        )

        expect(markup).toContain(
            '<label id="brand-color-label" for="brand-color"',
        )
        expect(markup).toContain('Used throughout the application')
        expect(markup).toContain('role="alert"')
        expect(markup).toContain('Choose an approved color')
        expect(markup).toContain(
            'aria-describedby="external-help brand-color-description brand-color-error"',
        )
        expect(markup).toMatch(
            /<input(?=[^>]*name="brandColor")(?=[^>]*disabled="")[^>]*>/,
        )
        expect(markup).toContain('aria-controls="brand-color-dialog"')
        expect(markup).toContain('aria-keyshortcuts="Alt+ArrowDown"')
    })

    test('keeps a read-only trigger focusable and exposes its state', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomColorPicker, {
                id: 'brand-color',
                value: '#13ecd6',
                onValueChange: () => undefined,
                readOnly: true,
                showInput: false,
            }),
        )

        expect(markup).toContain('id="brand-color"')
        expect(markup).toContain('aria-readonly="true"')
        expect(markup).not.toContain('aria-disabled="true"')
        expect(markup).not.toContain(
            'id="brand-color" type="button" disabled=""',
        )
    })

    test('lets an explicit null error clear native required validation', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomColorPicker, {
                name: 'brandColor',
                value: '',
                onValueChange: () => undefined,
                required: true,
                error: null,
            }),
        )

        expect(markup).toMatch(/<input(?=[^>]*name="brandColor")[^>]*>/)
        expect(markup).not.toMatch(
            /<input(?=[^>]*name="brandColor")(?=[^>]*required="")[^>]*>/,
        )
        expect(markup).not.toContain('aria-required="true"')
    })

    test('treats an empty external error as a cleared error', () => {
        expect(resolveFieldError('Internal error', '', true)).toEqual({
            error: '',
            hasError: false,
        })
    })

    test('renders numeric label and description content', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomColorPicker, {
                id: 'numeric-content',
                value: '#13ecd6',
                onValueChange: () => undefined,
                label: 0,
                description: 0,
            }),
        )

        expect(markup).toContain('id="numeric-content-label"')
        expect(markup).toContain('id="numeric-content-description"')
        expect(markup).toContain('aria-labelledby="numeric-content-label"')
    })
})
