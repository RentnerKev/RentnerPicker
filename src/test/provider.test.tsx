import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CustomColorPicker, PickerProvider } from '../index.js'

afterEach(cleanup)

describe('picker provider defaults', () => {
    test('inherits locale and design defaults through nested providers', () => {
        render(
            <PickerProvider
                locale="en"
                messages={{ selectColor: 'Choose a swatch' }}
                customDesign={{ hoverText: 'hover:text-pink-400' }}
            >
                <PickerProvider customDesign={{ bg: 'bg-brand-picker' }}>
                    <CustomColorPicker
                        value="#13ecd6"
                        onValueChange={() => undefined}
                    />
                </PickerProvider>
            </PickerProvider>,
        )

        const trigger = screen.getByRole('button', {
            name: 'Choose a swatch',
        })
        fireEvent.click(trigger)

        expect(screen.getByRole('dialog').className).toContain(
            'bg-brand-picker',
        )
        expect(
            screen.getByRole('button', { name: 'Close picker' }).className,
        ).toContain('hover:text-pink-400')
    })
})
