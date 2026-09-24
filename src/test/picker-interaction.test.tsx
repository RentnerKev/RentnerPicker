import { afterEach, describe, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomColorPicker } from '../index.js'

afterEach(() => {
    cleanup()
})

describe('picker interactions', () => {
    test('reports validity transitions for the visible draft', async () => {
        const validityChanges: boolean[] = []
        const valueChanges: string[] = []

        render(
            <CustomColorPicker
                value="#13ecd6"
                onValueChange={(value) => valueChanges.push(value)}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
            />,
        )

        const input = screen.getByPlaceholderText('#13ecd6')

        expect(validityChanges).toEqual([true])

        fireEvent.change(input, { target: { value: 'invalid' } })
        fireEvent.change(input, { target: { value: 'still-invalid' } })

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })
        expect(valueChanges).toEqual([])

        fireEvent.change(input, { target: { value: 'AbC' } })

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false, true])
        })

        fireEvent.blur(input)

        expect(valueChanges).toEqual(['#aabbcc'])
    })

    test('forwards blur from the visible field trigger', () => {
        const onBlur = mock(() => undefined)

        render(
            <CustomColorPicker
                value="#13ecd6"
                onValueChange={() => undefined}
                onBlur={onBlur}
            />,
        )

        fireEvent.blur(screen.getByRole('button', { name: 'Farbe auswählen' }))

        expect(onBlur).toHaveBeenCalledTimes(1)
    })

    test('does not blur the field when focus moves into the open picker', () => {
        const onBlur = mock(() => undefined)

        render(
            <>
                <CustomColorPicker
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    onBlur={onBlur}
                />
                <button type="button">Outside</button>
            </>,
        )

        const trigger = screen.getByRole('button', {
            name: 'Farbe auswählen',
        })
        fireEvent.click(trigger)

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        fireEvent.blur(trigger, { relatedTarget: colorArea })
        expect(onBlur).not.toHaveBeenCalled()

        fireEvent.blur(colorArea, {
            relatedTarget: screen.getByRole('button', { name: 'Outside' }),
        })
        expect(onBlur).toHaveBeenCalledTimes(1)
    })

    test('keeps an invalid draft out of submitted form data', () => {
        render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                />
            </form>,
        )

        fireEvent.change(screen.getByPlaceholderText('#13ecd6'), {
            target: { value: 'invalid' },
        })

        const form = screen.getByRole('form') as HTMLFormElement

        expect(new FormData(form).get('brandColor')).toBe('#13ecd6')
    })

    test('omits disabled values and retains read-only values in forms', () => {
        const { rerender } = render(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    disabled
                />
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement

        expect(new FormData(form).get('brandColor')).toBeNull()

        rerender(
            <form aria-label="color form">
                <CustomColorPicker
                    name="brandColor"
                    value="#13ecd6"
                    onValueChange={() => undefined}
                    readOnly
                />
            </form>,
        )

        expect(new FormData(form).get('brandColor')).toBe('#13ecd6')
    })

    test('reports disabled fields as excluded from validation', async () => {
        const validityChanges: boolean[] = []
        const { rerender } = render(
            <CustomColorPicker
                value="invalid"
                onValueChange={() => undefined}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
                disabled
            />,
        )

        expect(validityChanges).toEqual([true])

        rerender(
            <CustomColorPicker
                value="invalid"
                onValueChange={() => undefined}
                onValidityChange={(isValid) => validityChanges.push(isValid)}
            />,
        )

        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })
    })

    test('moves focus into the color area and restores it on Escape', async () => {
        const user = userEvent.setup()

        render(
            <CustomColorPicker
                value="#808080"
                onValueChange={() => undefined}
                showPresets={false}
            />,
        )

        const trigger = screen.getByRole('button', {
            name: 'Farbe auswählen',
        })

        await user.click(trigger)

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        expect(document.activeElement).toBe(colorArea)

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).toBeNull()
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })

    test('supports precise and coarse keyboard changes in the color area', () => {
        const changes: string[] = []

        render(
            <CustomColorPicker
                value="#808080"
                onValueChange={(value) => changes.push(value)}
                showPresets={false}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Farbe auswählen' }))

        const colorArea = screen.getByRole('button', {
            name: /Farbfläche/,
        })
        const marker = colorArea.querySelector('span') as HTMLSpanElement

        expect(marker.style.left).toBe('0%')
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight' })
        expect(marker.style.left).toBe('1%')

        fireEvent.keyDown(colorArea, { key: 'ArrowLeft' })
        expect(marker.style.left).toBe('0%')

        fireEvent.keyDown(colorArea, { key: 'ArrowDown' })
        expect(marker.style.top).toBe('51%')

        fireEvent.keyDown(colorArea, { key: 'ArrowUp' })
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight', shiftKey: true })
        expect(marker.style.left).toBe('10%')

        fireEvent.keyDown(colorArea, { key: 'PageUp' })
        expect(marker.style.top).toBe('40%')

        fireEvent.keyDown(colorArea, { key: 'PageDown' })
        expect(marker.style.top).toBe('50%')

        fireEvent.keyDown(colorArea, { key: 'Home' })
        expect(marker.style.left).toBe('0%')

        fireEvent.keyDown(colorArea, { key: 'End' })
        expect(marker.style.left).toBe('100%')

        fireEvent.keyDown(colorArea, { key: 'ArrowRight' })
        expect(marker.style.left).toBe('100%')
        expect(changes).toHaveLength(9)
    })

    test('lets an external error control reported validity', async () => {
        const validityChanges: boolean[] = []

        function Harness() {
            const [error, setError] = useState<string | null | undefined>(
                undefined,
            )

            return (
                <>
                    <CustomColorPicker
                        value="#13ecd6"
                        onValueChange={() => undefined}
                        onValidityChange={(isValid) =>
                            validityChanges.push(isValid)
                        }
                        error={error}
                    />
                    <button
                        type="button"
                        onClick={() => setError('Server error')}
                    >
                        Set error
                    </button>
                    <button type="button" onClick={() => setError(null)}>
                        Clear error
                    </button>
                </>
            )
        }

        const user = userEvent.setup()
        render(<Harness />)

        expect(validityChanges).toEqual([true])

        await user.click(screen.getByRole('button', { name: 'Set error' }))
        await waitFor(() => {
            expect(validityChanges).toEqual([true, false])
        })

        await user.click(screen.getByRole('button', { name: 'Clear error' }))
        await waitFor(() => {
            expect(validityChanges).toEqual([true, false, true])
        })
    })
})
