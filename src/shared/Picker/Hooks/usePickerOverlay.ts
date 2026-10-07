import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp } from '../../../lib/Color/color.js'
import {
    getAncestorShadowRoots,
    isComposedAncestor,
} from '../../../lib/DOM/overlayGeometry.js'

import type {
    PickerPosition,
    UsePickerOverlayOptions,
    PickerOverlayResult,
} from '../Types/picker.types.js'

export default function usePickerOverlay({
    initialFocusRef,
    isOpen,
    onClose,
    onGeometryChange,
}: UsePickerOverlayOptions): PickerOverlayResult {
    const rootRef = useRef<HTMLDivElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)
    const [pickerPosition, setPickerPosition] = useState<PickerPosition>({
        top: 0,
        left: 0,
        width: 288,
        maxHeight: 360,
    })

    const updatePickerPosition = useCallback(() => {
        const root = rootRef.current

        if (!root) {
            return
        }

        const rect = root.getBoundingClientRect()
        const viewportWidth = Math.max(window.innerWidth, 0)
        const viewportHeight = Math.max(window.innerHeight, 0)
        const horizontalGutter = Math.min(8, viewportWidth / 2)
        const verticalGutter = Math.min(8, viewportHeight / 2)
        const gap = verticalGutter
        const width = Math.min(
            Math.max(rect.width, 288),
            Math.max(viewportWidth - horizontalGutter * 2, 0),
        )
        const maxLeft = Math.max(
            horizontalGutter,
            viewportWidth - horizontalGutter - width,
        )
        const left = clamp(rect.left, horizontalGutter, maxLeft)
        const spaceBelow = Math.max(
            0,
            viewportHeight - verticalGutter - rect.bottom - gap,
        )
        const spaceAbove = Math.max(0, rect.top - verticalGutter - gap)
        const availableHeight = Math.max(0, viewportHeight - verticalGutter * 2)
        const openAbove =
            spaceBelow < Math.min(360, availableHeight) &&
            spaceAbove > spaceBelow
        const preferredSpace = openAbove ? spaceAbove : spaceBelow
        const coverTrigger = preferredSpace < Math.min(120, availableHeight)
        const maxHeight = Math.min(
            360,
            coverTrigger ? availableHeight : preferredSpace,
        )
        const top = coverTrigger
            ? verticalGutter
            : openAbove
              ? Math.max(verticalGutter, rect.top - gap - maxHeight)
              : Math.min(
                    rect.bottom + gap,
                    Math.max(
                        verticalGutter,
                        viewportHeight - verticalGutter - maxHeight,
                    ),
                )

        setPickerPosition((previous) =>
            previous.top === top &&
            previous.left === left &&
            previous.width === width &&
            previous.maxHeight === maxHeight
                ? previous
                : { top, left, width, maxHeight },
        )
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        initialFocusRef.current?.focus()

        function handlePointerDown(event: globalThis.PointerEvent) {
            const target = event.composedPath()[0] ?? event.target
            if (!(target instanceof Node)) return

            if (
                !rootRef.current?.contains(target) &&
                !popupRef.current?.contains(target)
            ) {
                onClose(false)
            }
        }

        function handleKeyDown(event: globalThis.KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose(true)
            }
        }

        function handleGeometryChange() {
            onGeometryChange?.()
            updatePickerPosition()
        }

        function handleScroll(event: Event) {
            const target = event.composedPath()[0] ?? event.target
            const root = rootRef.current
            if (target instanceof Node && popupRef.current?.contains(target)) {
                // Scrolling the popup moves the color area, but never the anchor.
                onGeometryChange?.()
                return
            }
            if (
                target === window ||
                target === document ||
                isComposedAncestor(target, root)
            ) {
                handleGeometryChange()
            }
        }

        const observer =
            typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(handleGeometryChange)
        if (rootRef.current) observer?.observe(rootRef.current)
        if (initialFocusRef.current) observer?.observe(initialFocusRef.current)

        handleGeometryChange()
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('resize', handleGeometryChange)
        window.addEventListener('scroll', handleScroll, true)
        const shadowRoots = getAncestorShadowRoots(rootRef.current)
        for (const shadowRoot of shadowRoots)
            shadowRoot.addEventListener('scroll', handleScroll, true)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('resize', handleGeometryChange)
            window.removeEventListener('scroll', handleScroll, true)
            for (const shadowRoot of shadowRoots)
                shadowRoot.removeEventListener('scroll', handleScroll, true)
            observer?.disconnect()
        }
    }, [
        initialFocusRef,
        isOpen,
        onClose,
        onGeometryChange,
        updatePickerPosition,
    ])

    return {
        refs: {
            popupRef,
            rootRef,
        },
        handler: {
            updatePickerPosition,
        },
        state: {
            pickerPosition,
        },
        setter: {
            setPickerPosition,
        },
    }
}
