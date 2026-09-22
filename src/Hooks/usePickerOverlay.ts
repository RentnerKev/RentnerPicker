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
        const width = Math.min(
            Math.max(rect.width, 288),
            Math.max(window.innerWidth - 16, 0),
        )
        const maxLeft = Math.max(8, window.innerWidth - width - 8)
        const left = clamp(rect.left, 8, maxLeft)
        const spaceBelow = window.innerHeight - rect.bottom - 8
        const spaceAbove = rect.top - 8
        const openAbove = spaceBelow < 360 && spaceAbove > spaceBelow
        const maxHeight = Math.max(openAbove ? spaceAbove : spaceBelow, 160)
        const top = openAbove
            ? Math.max(8, rect.top - Math.min(360, maxHeight) - 8)
            : rect.bottom + 8

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
