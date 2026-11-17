import { afterEach, beforeEach, expect, mock, test } from 'bun:test'
import {
    act,
    cleanup,
    fireEvent,
    render,
    renderHook,
    screen,
} from '@testing-library/react'
import { CustomColorPicker } from '../../../../shared/Picker/Components/CustomColorPicker.tsx'
import { useEyeDropper } from '../../../../shared/Picker/Hooks/useEyeDropper.ts'
import type { CustomColorPickerProps } from '../../../../shared/Picker/Types/picker.types.ts'

const original = Object.getOwnPropertyDescriptor(window, 'EyeDropper')
const requests: Array<
    ReturnType<typeof Promise.withResolvers<{ sRGBHex: string }>> & {
        signal?: AbortSignal
    }
> = []

beforeEach(() => {
    requests.length = 0
    Object.defineProperty(window, 'EyeDropper', {
        configurable: true,
        value: class {
            open(options?: { signal?: AbortSignal }) {
                const request = Promise.withResolvers<{ sRGBHex: string }>()
                requests.push({ ...request, signal: options?.signal })
                // Intentionally ignores abort to verify stale-result protection independently.
                return request.promise
            }
        },
    })
})
afterEach(() => {
    cleanup()
    if (original) Object.defineProperty(window, 'EyeDropper', original)
    else Reflect.deleteProperty(window, 'EyeDropper')
})
function picker(props: Partial<CustomColorPickerProps> = {}) {
    return (
        <CustomColorPicker
            value="#123456"
            onValueChange={() => {}}
            locale="en"
            {...props}
        />
    )
}
function launch() {
    fireEvent.click(screen.getByRole('button', { name: 'Select color' }))
    fireEvent.click(
        screen.getByRole('button', { name: 'Select color with eyedropper' }),
    )
}

test('duplicate invocations share one native selection and return current callbacks', async () => {
    const selected = mock()
    const closed = mock()
    const { result } = renderHook(() =>
        useEyeDropper({ enabled: true, onSelect: selected, onSuccess: closed }),
    )
    let first: Promise<void> | undefined
    await act(async () => {
        first = result.current.handler.select()
        await result.current.handler.select()
    })
    expect(requests).toHaveLength(1)
    expect(result.current.state.isPending).toBe(true)
    expect(requests[0]?.signal?.aborted).toBe(false)
    await act(async () => {
        requests[0]?.resolve({ sRGBHex: '#abcdef' })
        await first
    })
    expect(selected).toHaveBeenCalledWith('#abcdef')
    expect(closed).toHaveBeenCalledTimes(1)
    expect(result.current.state.isPending).toBe(false)
})

test.each(['disabled', 'readOnly'] as const)(
    'pending selection aborts and never commits after %s is enabled',
    async (flag) => {
        const changed = mock()
        const view = render(picker({ onValueChange: changed }))
        launch()
        view.rerender(picker({ onValueChange: changed, [flag]: true }))
        expect(requests[0]?.signal?.aborted).toBe(true)
        view.rerender(picker({ onValueChange: changed }))
        fireEvent.click(screen.getByRole('button', { name: 'Select color' }))
        await act(async () => requests[0]?.resolve({ sRGBHex: '#abcdef' }))
        expect(changed).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeTruthy()
    },
)

test.each([
    [{ format: 'rgb' }, 'rgb(171, 205, 239)'],
    [{ format: 'hex', enableAlpha: true }, '#abcdefff'],
    [{ format: 'rgba' }, 'rgba(171, 205, 239, 1)'],
    [{ format: 'hex8' }, '#abcdefff'],
] satisfies [Partial<CustomColorPickerProps>, string][])(
    'pending selection uses latest output configuration and callback: %j',
    async (configuration, expected) => {
        const first = mock()
        const latest = mock()
        const view = render(picker({ onValueChange: first }))
        launch()
        expect(
            screen
                .getByRole('button', { name: 'Select color with eyedropper' })
                .getAttribute('aria-busy'),
        ).toBe('true')
        view.rerender(picker({ ...configuration, onValueChange: latest }))
        await act(async () => requests[0]?.resolve({ sRGBHex: '#abcdef' }))
        expect(first).not.toHaveBeenCalled()
        expect(latest).toHaveBeenCalledWith(expected)
        expect(screen.queryByRole('dialog')).toBeNull()
    },
)

test('cancel and reopen ignore the old result and keep a newer request pending', async () => {
    const changed = mock()
    render(picker({ onValueChange: changed }))
    launch()
    fireEvent.click(screen.getByRole('button', { name: 'Close picker' }))
    expect(requests[0]?.signal?.aborted).toBe(true)
    launch()
    expect(requests).toHaveLength(2)
    await act(async () => requests[0]?.resolve({ sRGBHex: '#ffffff' }))
    expect(changed).not.toHaveBeenCalled()
    expect(
        screen
            .getByRole('button', { name: 'Select color with eyedropper' })
            .getAttribute('aria-busy'),
    ).toBe('true')
    await act(async () => requests[1]?.resolve({ sRGBHex: '#abcdef' }))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalledWith('#abcdef')
    expect(screen.queryByRole('dialog')).toBeNull()
})

test('native cancellation preserves the color and permits retry', async () => {
    const changed = mock()
    render(picker({ onValueChange: changed }))
    launch()
    await act(async () =>
        requests[0]?.reject(new DOMException('Cancelled', 'AbortError')),
    )
    expect(changed).not.toHaveBeenCalled()
    const dropper = screen.getByRole('button', {
        name: 'Select color with eyedropper',
    })
    expect(dropper.hasAttribute('disabled')).toBe(false)
    fireEvent.click(dropper)
    expect(requests).toHaveLength(2)
    await act(async () => requests[1]?.reject(new Error('Native failure')))
    expect(changed).not.toHaveBeenCalled()
})

test('unmount aborts the pending request and suppresses callbacks after settlement', async () => {
    const changed = mock()
    const view = render(picker({ onValueChange: changed }))
    launch()
    view.unmount()
    expect(requests[0]?.signal?.aborted).toBe(true)
    await act(async () => requests[0]?.resolve({ sRGBHex: '#abcdef' }))
    expect(changed).not.toHaveBeenCalled()
})

test('a stale retained handler cannot launch after unmount', async () => {
    const selected = mock()
    const { result, unmount } = renderHook(() =>
        useEyeDropper({
            enabled: true,
            onSelect: selected,
            onSuccess: () => {},
        }),
    )
    const select = result.current.handler.select
    unmount()
    await select()
    expect(requests).toHaveLength(0)
})

test('a pending alpha selection uses opaque hex if alpha editing is turned off before completion', async () => {
    const changed = mock()
    const view = render(
        picker({ format: 'hex', enableAlpha: true, onValueChange: changed }),
    )
    launch()
    view.rerender(
        picker({ format: 'hex', enableAlpha: false, onValueChange: changed }),
    )
    await act(async () => requests[0]?.resolve({ sRGBHex: '#abcdef' }))
    expect(changed).toHaveBeenCalledWith('#abcdef')
})

test('accepting a selection that unmounts the owner suppresses the subsequent close callback', async () => {
    const closed = mock()
    const { result, unmount } = renderHook(() =>
        useEyeDropper({
            enabled: true,
            onSelect: () => unmount(),
            onSuccess: closed,
        }),
    )
    let task: Promise<void> | undefined
    await act(async () => {
        task = result.current.handler.select()
    })
    await act(async () => {
        requests[0]?.resolve({ sRGBHex: '#abcdef' })
        await task
    })
    expect(closed).not.toHaveBeenCalled()
})
