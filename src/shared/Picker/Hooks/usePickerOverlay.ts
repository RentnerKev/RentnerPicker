import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import { clamp } from '../../../lib/Color/color.ts'
import {
    getAncestorShadowRoots,
    isComposedAncestor,
} from '../../../lib/DOM/overlayGeometry.ts'

import type {
    PickerPosition,
    UsePickerOverlayOptions,
    PickerOverlayResult,
} from '../Types/picker.types.ts'

const DEFAULT_PICKER_POSITION: PickerPosition = Object.freeze({
    top: 0,
    left: 0,
    width: 288,
    maxHeight: 360,
})

export default function usePickerOverlay({
    initialFocusRef,
    isOpen,
    onClose,
    onGeometryChange,
}: UsePickerOverlayOptions): PickerOverlayResult {
    const rootRef = useRef<HTMLDivElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)
    const positionedPopupRef = useRef<HTMLDivElement | null>(null)
    const [popup, setPopup] = useState<HTMLDivElement | null>(null)
    const [measurement, setMeasurement] = useState<{
        popup: HTMLDivElement
        ready: boolean
    } | null>(null)
    const setPopupRef = useCallback((node: HTMLDivElement | null) => {
        popupRef.current = node
        setPopup(node)
        if (!node) {
            positionedPopupRef.current = null
            setMeasurement(null)
        }
    }, [])
    const isPositioned =
        isOpen &&
        popup !== null &&
        measurement?.popup === popup &&
        measurement.ready
    const [pickerPosition, setPickerPosition] = useState<PickerPosition>(
        DEFAULT_PICKER_POSITION,
    )

    const updatePickerPosition = useCallback(() => {
        const root = rootRef.current
        const mountedPopup = popupRef.current

        if (!root || !mountedPopup) {
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
        setMeasurement((previous) => {
            const ready = previous?.popup === mountedPopup
            if (ready) positionedPopupRef.current = mountedPopup
            return previous?.popup === mountedPopup && previous.ready
                ? previous
                : {
                      popup: mountedPopup,
                      ready,
                  }
        })
    }, [])

    // A portal mounts only when opened. Apply its fixed constraints while hidden,
    // then confirm the mounted element's layout before allowing a visible frame.
    useLayoutEffect(() => {
        if (isOpen && popup) updatePickerPosition()
    }, [isOpen, popup, updatePickerPosition])
    useLayoutEffect(() => {
        if (measurement && !measurement.ready) updatePickerPosition()
    }, [measurement, updatePickerPosition])
    useLayoutEffect(() => {
        if (isPositioned) initialFocusRef.current?.focus()
    }, [initialFocusRef, isPositioned])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function handlePointerDown(event: globalThis.PointerEvent) {
            const target = event.composedPath()[0] ?? event.target
            if (!(target instanceof Node)) return

            if (
                !rootRef.current?.contains(target) &&
                !popupRef.current?.contains(target)
            ) {
                let active = popupRef.current?.ownerDocument.activeElement
                while (active?.shadowRoot?.activeElement)
                    active = active.shadowRoot.activeElement
                if (
                    active instanceof HTMLElement &&
                    popupRef.current?.contains(active)
                )
                    active.blur()
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

        const shadowRoots = getAncestorShadowRoots(rootRef.current)
        const hasShadowRoots = shadowRoots.length > 0

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
                (hasShadowRoots
                    ? isComposedAncestor(target, root)
                    : target instanceof Node &&
                      root !== null &&
                      target.contains(root))
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

        if (
            popupRef.current &&
            positionedPopupRef.current === popupRef.current
        ) {
            onGeometryChange?.()
        } else {
            handleGeometryChange()
        }
        document.addEventListener('pointerdown', handlePointerDown, {
            passive: true,
        })
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('resize', handleGeometryChange, {
            passive: true,
        })
        window.addEventListener('scroll', handleScroll, {
            capture: true,
            passive: true,
        })
        for (const shadowRoot of shadowRoots)
            shadowRoot.addEventListener('scroll', handleScroll, {
                capture: true,
                passive: true,
            })

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
            setPopupRef,
            rootRef,
        },
        handler: {
            updatePickerPosition,
        },
        state: {
            pickerPosition,
            isPositioned,
        },
        setter: {
            setPickerPosition,
        },
    }
}
