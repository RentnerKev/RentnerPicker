import { afterEach, expect, mock, test } from 'bun:test'
import { useState, type ChangeEvent, type PointerEvent } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import useCustomColorPickerLogic from '../../../../shared/Picker/Hooks/useCustomColorPickerLogic.ts'
import usePickerOverlay from '../../../../shared/Picker/Hooks/usePickerOverlay.ts'

afterEach(cleanup)

const change = (value: string) =>
    ({ target: { value } }) as ChangeEvent<HTMLInputElement>
const onClose = () => undefined

test('deduplicates accepted identical pointers and invalidates coordinates after controlled changes', () => {
    const changed = mock()
    const hook = renderHook(
        ({ external }: { external?: string }) => {
            const [value, setValue] = useState('#13ecd6')
            return useCustomColorPickerLogic({
                value: external ?? value,
                onValueChange(next) {
                    changed(next)
                    setValue(next)
                },
            })
        },
        { initialProps: {} },
    )
    const area = document.createElement('button')
    const rect = mock(
        () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect,
    )
    area.getBoundingClientRect = rect
    area.setPointerCapture = mock()
    const event = {
        buttons: 1,
        clientX: 50,
        clientY: 50,
        pointerId: 1,
        currentTarget: area,
    } as unknown as PointerEvent<HTMLButtonElement>
    act(() => hook.result.current.handler.handleColorAreaPointer(event))
    for (let index = 0; index < 120; index++)
        act(() => hook.result.current.handler.handleColorAreaPointerMove(event))
    expect(changed).toHaveBeenCalledTimes(1)
    expect(area.setPointerCapture).toHaveBeenCalledTimes(1)
    expect(rect).toHaveBeenCalledTimes(2)
    hook.rerender({ external: '#ff0000' })
    act(() => hook.result.current.handler.handleColorAreaPointerMove(event))
    expect(rect).toHaveBeenCalledTimes(3)
    expect(changed).toHaveBeenCalledTimes(2)
})

test('retains latent HSV hue for black and gray without duplicate serialized callbacks', () => {
    const changed = mock()
    const hook = renderHook(() => {
        const [value, setValue] = useState('#000000')
        return useCustomColorPickerLogic({
            value,
            onValueChange(next) {
                changed(next)
                setValue(next)
            },
        })
    })
    act(() => hook.result.current.handler.handleHueChange(change('180')))
    expect(changed).toHaveBeenCalledTimes(0)
    expect(hook.result.current.state.hsvColor.hue).toBe(180)
    act(() => hook.result.current.handler.handleBrightnessChange(change('50')))
    expect(changed).toHaveBeenLastCalledWith('#808080')
    expect(hook.result.current.state.hsvColor.hue).toBe(180)
    act(() => hook.result.current.handler.handleSaturationChange(change('100')))
    expect(changed).toHaveBeenLastCalledWith('#008080')
    act(() => hook.result.current.handler.handleSaturationChange(change('100')))
    expect(changed).toHaveBeenCalledTimes(2)
})

test('ignores popup and unrelated scrolling, updates ancestor geometry and retains identical position objects', () => {
    const ancestor = document.createElement('div')
    const root = document.createElement('div')
    const popup = document.createElement('div')
    ancestor.append(root)
    document.body.append(ancestor, popup)
    let top = 100
    const rect = mock(
        () => ({ left: 100, top, width: 100, bottom: top + 50 }) as DOMRect,
    )
    root.getBoundingClientRect = rect
    const invalidate = mock()
    const initialFocusRef = { current: null }
    const hook = renderHook(() =>
        usePickerOverlay({
            isOpen: true,
            initialFocusRef,
            onClose,
            onGeometryChange: invalidate,
        }),
    )
    hook.result.current.refs.rootRef.current = root
    hook.result.current.refs.popupRef.current = popup
    act(() => window.dispatchEvent(new Event('resize')))
    const position = hook.result.current.state.pickerPosition
    act(() => popup.dispatchEvent(new Event('scroll')))
    expect(rect).toHaveBeenCalledTimes(1)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(hook.result.current.state.pickerPosition).toBe(position)
    top = 200
    act(() => ancestor.dispatchEvent(new Event('scroll')))
    expect(hook.result.current.state.pickerPosition.top).not.toBe(position.top)
    expect(invalidate).toHaveBeenCalledTimes(5)
    hook.unmount()
    ancestor.remove()
    popup.remove()
    act(() => window.dispatchEvent(new Event('resize')))
    expect(rect).toHaveBeenCalledTimes(3)
})

test('refreshes geometry for composed ancestors and noncomposed scrolling inside a shadow root', () => {
    const ancestor = document.createElement('div')
    const host = document.createElement('div')
    ancestor.append(host)
    document.body.append(ancestor)
    const shadow = host.attachShadow({ mode: 'open' })
    const innerAncestor = document.createElement('div')
    const root = document.createElement('div')
    const unrelated = document.createElement('div')
    innerAncestor.append(root)
    shadow.append(innerAncestor, unrelated)
    let top = 100
    const rect = mock(
        () => ({ left: 100, top, width: 100, bottom: top + 50 }) as DOMRect,
    )
    root.getBoundingClientRect = rect
    const initialFocusRef = { current: null }
    const hook = renderHook(
        ({ open }) =>
            usePickerOverlay({ isOpen: open, initialFocusRef, onClose }),
        { initialProps: { open: false } },
    )
    hook.result.current.refs.rootRef.current = root
    hook.rerender({ open: true })
    const position = hook.result.current.state.pickerPosition
    top = 200
    act(() => ancestor.dispatchEvent(new Event('scroll')))
    expect(hook.result.current.state.pickerPosition.top).not.toBe(position.top)
    const outsidePosition = hook.result.current.state.pickerPosition
    top = 250
    act(() =>
        innerAncestor.dispatchEvent(new Event('scroll', { composed: false })),
    )
    expect(hook.result.current.state.pickerPosition.top).not.toBe(
        outsidePosition.top,
    )
    const reads = rect.mock.calls.length
    act(() => unrelated.dispatchEvent(new Event('scroll', { composed: false })))
    expect(rect).toHaveBeenCalledTimes(reads)
    hook.unmount()
    act(() =>
        innerAncestor.dispatchEvent(new Event('scroll', { composed: false })),
    )
    expect(rect).toHaveBeenCalledTimes(reads)
    ancestor.remove()
})
