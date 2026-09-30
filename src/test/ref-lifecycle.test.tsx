import { afterEach, describe, expect, mock, test } from 'bun:test'
import { createRef, type Ref } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { CustomColorPicker } from '../index.js'
import { composeRefs } from '../Hooks/useComposedRefs.js'

afterEach(() => {
    cleanup()
})

function PickerHarness({
    value = '#abcdef',
    triggerRef,
}: {
    value?: string
    triggerRef?: Ref<HTMLButtonElement>
}) {
    return (
        <CustomColorPicker
            aria-label="Brand color"
            value={value}
            onValueChange={() => undefined}
            triggerRef={triggerRef}
        />
    )
}

describe('picker trigger refs', () => {
    test('runs cleanup-returning refs once and keeps the adapter stable', () => {
        const cleanupRef = mock(() => undefined)
        const triggerRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => cleanupRef()
            }
        })
        const view = render(<PickerHarness triggerRef={triggerRef} />)
        const trigger = screen.getByRole('button', { name: 'Brand color' })

        expect(triggerRef).toHaveBeenCalledTimes(1)
        expect(triggerRef).toHaveBeenCalledWith(trigger)

        view.rerender(<PickerHarness value="#123456" triggerRef={triggerRef} />)

        expect(triggerRef).toHaveBeenCalledTimes(1)

        view.unmount()

        expect(cleanupRef).toHaveBeenCalledTimes(1)
        expect(triggerRef).toHaveBeenCalledTimes(1)
    })

    test('cleans up a replaced callback and nulls a legacy callback on detach', () => {
        const firstCleanup = mock(() => undefined)
        const firstRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => firstCleanup()
            }
        })
        const legacyRef = mock((_node: HTMLButtonElement | null) => undefined)
        const view = render(<PickerHarness triggerRef={firstRef} />)
        const trigger = screen.getByRole('button', { name: 'Brand color' })

        view.rerender(<PickerHarness triggerRef={legacyRef} />)

        expect(firstCleanup).toHaveBeenCalledTimes(1)
        expect(firstRef).toHaveBeenCalledTimes(1)
        expect(legacyRef).toHaveBeenCalledWith(trigger)

        view.unmount()

        expect(legacyRef).toHaveBeenCalledTimes(2)
        expect(legacyRef).toHaveBeenLastCalledWith(null)
    })

    test('moves object refs when their identity changes and clears them on detach', () => {
        const firstRef = createRef<HTMLButtonElement>()
        const secondRef = createRef<HTMLButtonElement>()
        const view = render(<PickerHarness triggerRef={firstRef} />)
        const trigger = screen.getByRole('button', { name: 'Brand color' })

        expect(firstRef.current).toBe(trigger)

        view.rerender(<PickerHarness triggerRef={secondRef} />)

        expect(firstRef.current).toBeNull()
        expect(secondRef.current).toBe(trigger)

        view.unmount()

        expect(secondRef.current).toBeNull()
    })

    test('invokes a duplicate callback ref only once per attachment', () => {
        const cleanupRef = mock(() => undefined)
        const callbackRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => cleanupRef()
            }
        })
        const composedRef = composeRefs([callbackRef, callbackRef])
        const trigger = document.createElement('button')
        const detach = composedRef(trigger)

        expect(callbackRef).toHaveBeenCalledTimes(1)
        expect(callbackRef).toHaveBeenCalledWith(trigger)

        detach?.()

        expect(cleanupRef).toHaveBeenCalledTimes(1)
    })

    test('clears object and legacy refs even when a callback cleanup throws', () => {
        const objectRef = createRef<HTMLButtonElement>()
        const legacyRef = mock((_node: HTMLButtonElement | null) => undefined)
        const throwingRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => {
                    throw new Error('cleanup failed')
                }
            }
        })
        const composedRef = composeRefs([throwingRef, objectRef, legacyRef])
        const trigger = document.createElement('button')
        const detach = composedRef(trigger)

        expect(objectRef.current).toBe(trigger)
        expect(legacyRef).toHaveBeenCalledWith(trigger)
        expect(typeof detach).toBe('function')

        expect(() => detach?.()).toThrow('cleanup failed')

        expect(objectRef.current).toBeNull()
        expect(legacyRef).toHaveBeenLastCalledWith(null)
    })
})
