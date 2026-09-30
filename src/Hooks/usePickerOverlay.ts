import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { clamp } from '../color.js'

export interface PickerPosition {
    top: number
    left: number
    width: number
    maxHeight: number
}

interface UsePickerOverlayOptions {
    initialFocusRef: RefObject<HTMLElement | null>
    isOpen: boolean
    onClose: (restoreFocus?: boolean) => void
}

export default function usePickerOverlay({
    initialFocusRef,
    isOpen,
    onClose,
}: UsePickerOverlayOptions) {
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

        setPickerPosition({ top, left, width, maxHeight })
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        initialFocusRef.current?.focus()

        function handlePointerDown(event: globalThis.PointerEvent) {
            const target = event.target as Node

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

        updatePickerPosition()
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('resize', updatePickerPosition)
        window.addEventListener('scroll', updatePickerPosition, true)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('resize', updatePickerPosition)
            window.removeEventListener('scroll', updatePickerPosition, true)
        }
    }, [initialFocusRef, isOpen, onClose, updatePickerPosition])

    return {
        ref: {
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
