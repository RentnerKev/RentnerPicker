import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react'
import type {
    ChangeEvent,
    InvalidEvent,
    KeyboardEvent,
    PointerEvent,
    Ref,
} from 'react'
import {
    clamp,
    formatColor,
    getHsvFromValue,
    hsvToRgb,
    rgbToHex,
    toPickerHex,
} from '../color.js'
import type { HsvColor } from '../color.js'
import { getColorError } from '../colorValidation.js'
import { resolveFieldError } from '../field.js'
import { pickerMessageCatalog } from '../i18n.js'
import type { PickerMessages } from '../i18n.js'
import type { CustomColorPickerProps } from '../types.js'
import usePickerOverlay from './usePickerOverlay.js'

interface EyeDropperConstructor {
    new (): {
        open: () => Promise<{ sRGBHex: string }>
    }
}

interface EyeDropperWindow extends Window {
    EyeDropper?: EyeDropperConstructor
}

function assignRef<Element>(
    ref: Ref<Element> | undefined,
    value: Element | null,
) {
    if (typeof ref === 'function') {
        ref(value)
        return
    }

    if (ref) {
        ref.current = value
    }
}

function subscribeToEyeDropperSupport() {
    return () => undefined
}

function getEyeDropperSupportSnapshot() {
    return typeof window !== 'undefined' && 'EyeDropper' in window
}

function getEyeDropperSupportServerSnapshot() {
    return false
}

export default function useCustomColorPickerLogic({
    value,
    onValueChange,
    onValidityChange,
    required,
    format = 'hex',
    messages = pickerMessageCatalog.de,
    error: externalError,
    disabled = false,
    readOnly = false,
    triggerRef: forwardedTriggerRef,
}: Pick<
    CustomColorPickerProps,
    | 'value'
    | 'onValueChange'
    | 'onValidityChange'
    | 'required'
    | 'format'
    | 'error'
    | 'disabled'
    | 'readOnly'
    | 'triggerRef'
> & {
    messages?: PickerMessages
}) {
    const safeValue = value !== undefined && value !== null ? String(value) : ''
    const [draftValue, setDraftValue] = useState(safeValue)
    const [previousSafeValue, setPreviousSafeValue] = useState(safeValue)
    const [isTouched, setIsTouched] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const isEyeDropperSupported = useSyncExternalStore(
        subscribeToEyeDropperSupport,
        getEyeDropperSupportSnapshot,
        getEyeDropperSupportServerSnapshot,
    )
    const [hsvColor, setHsvColor] = useState<HsvColor>(() =>
        getHsvFromValue(safeValue),
    )
    const colorAreaRef = useRef<HTMLButtonElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const onValidityChangeRef = useRef(onValidityChange)
    const previousValidityRef = useRef<boolean | undefined>(undefined)
    const internalError = getColorError(draftValue, required, messages)
    const { error, hasError } = resolveFieldError(
        internalError,
        externalError,
        isTouched,
    )
    const isValid = disabled || !error
    const hasValidityChangeHandler = onValidityChange !== undefined

    const setTriggerRef = useCallback(
        (node: HTMLButtonElement | null) => {
            triggerRef.current = node
            assignRef(forwardedTriggerRef, node)
        },
        [forwardedTriggerRef],
    )

    const closePicker = useCallback((restoreFocus = false) => {
        setIsOpen(false)

        if (restoreFocus) {
            queueMicrotask(() => triggerRef.current?.focus())
        }
    }, [])

    const overlay = usePickerOverlay({
        initialFocusRef: colorAreaRef,
        isOpen,
        onClose: closePicker,
    })

    const selectedHex = useMemo(() => rgbToHex(hsvToRgb(hsvColor)), [hsvColor])
    const hueColor = useMemo(
        () =>
            rgbToHex(
                hsvToRgb({
                    hue: hsvColor.hue,
                    saturation: 100,
                    value: 100,
                }),
            ),
        [hsvColor.hue],
    )
    const previewColor = error
        ? toPickerHex(safeValue)
        : toPickerHex(draftValue || selectedHex)

    if ((disabled || readOnly) && isOpen) {
        setIsOpen(false)
    }

    if (previousSafeValue !== safeValue) {
        setPreviousSafeValue(safeValue)
        setDraftValue(safeValue)
        setHsvColor(getHsvFromValue(safeValue))
    }

    useEffect(() => {
        onValidityChangeRef.current = onValidityChange
    }, [onValidityChange])

    useEffect(() => {
        if (!hasValidityChangeHandler) {
            previousValidityRef.current = undefined
            return
        }

        if (previousValidityRef.current === isValid) {
            return
        }

        previousValidityRef.current = isValid
        onValidityChangeRef.current?.(isValid)
    }, [hasValidityChangeHandler, isValid])

    useEffect(() => {
        validationInputRef.current?.setCustomValidity(
            disabled ? '' : error || '',
        )
    }, [disabled, error])

    useEffect(() => {
        const input = validationInputRef.current
        const form = input?.form

        if (!input || !form) {
            return
        }

        const currentInput = input

        function handleFormSubmit() {
            if (currentInput.validity.valid) {
                setIsTouched(false)
            }
        }

        form.addEventListener('submit', handleFormSubmit)

        return () => {
            form.removeEventListener('submit', handleFormSubmit)
        }
    }, [])

    function commitHex(
        nextHex: string,
        nextHsvColor = getHsvFromValue(nextHex),
    ) {
        if (disabled || readOnly) return

        const nextValue = formatColor(nextHex, format)
        setHsvColor(nextHsvColor)
        setDraftValue(nextValue)
        onValueChange(nextValue)
    }

    function commitHsvColor(nextHsvColor: HsvColor) {
        commitHex(rgbToHex(hsvToRgb(nextHsvColor)), nextHsvColor)
    }

    function commitColor(nextValue: string) {
        if (disabled || readOnly) return

        const nextInternalError = getColorError(nextValue, required, messages)
        setDraftValue(nextValue)

        if (nextInternalError) {
            setIsTouched(true)
            return
        }

        if (!nextValue.trim()) {
            onValueChange('')
            return
        }

        commitHex(toPickerHex(nextValue))
    }

    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return
        setDraftValue(event.target.value)
    }

    function handleTextBlur() {
        if (disabled || readOnly) return
        setIsTouched(true)
        commitColor(draftValue)
    }

    function handleColorAreaPointer(event: PointerEvent<HTMLButtonElement>) {
        if (disabled || readOnly) return

        const rect = event.currentTarget.getBoundingClientRect()

        if (rect.width <= 0 || rect.height <= 0) {
            return
        }

        const nextSaturation = clamp(
            ((event.clientX - rect.left) / rect.width) * 100,
            0,
            100,
        )
        const nextValue = clamp(
            100 - ((event.clientY - rect.top) / rect.height) * 100,
            0,
            100,
        )
        const nextHsvColor = {
            ...hsvColor,
            saturation: Math.round(nextSaturation),
            value: Math.round(nextValue),
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        commitHsvColor(nextHsvColor)
    }

    function handleColorAreaPointerMove(
        event: PointerEvent<HTMLButtonElement>,
    ) {
        if (event.buttons === 1) {
            handleColorAreaPointer(event)
        }
    }

    function handleColorAreaKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (disabled || readOnly) return

        const step = event.shiftKey ? 10 : 1
        let nextHsvColor: HsvColor

        switch (event.key) {
            case 'ArrowLeft':
                nextHsvColor = {
                    ...hsvColor,
                    saturation: clamp(hsvColor.saturation - step, 0, 100),
                }
                break
            case 'ArrowRight':
                nextHsvColor = {
                    ...hsvColor,
                    saturation: clamp(hsvColor.saturation + step, 0, 100),
                }
                break
            case 'ArrowUp':
                nextHsvColor = {
                    ...hsvColor,
                    value: clamp(hsvColor.value + step, 0, 100),
                }
                break
            case 'ArrowDown':
                nextHsvColor = {
                    ...hsvColor,
                    value: clamp(hsvColor.value - step, 0, 100),
                }
                break
            case 'PageUp':
                nextHsvColor = {
                    ...hsvColor,
                    value: clamp(hsvColor.value + 10, 0, 100),
                }
                break
            case 'PageDown':
                nextHsvColor = {
                    ...hsvColor,
                    value: clamp(hsvColor.value - 10, 0, 100),
                }
                break
            case 'Home':
                nextHsvColor = { ...hsvColor, saturation: 0 }
                break
            case 'End':
                nextHsvColor = { ...hsvColor, saturation: 100 }
                break
            default:
                return
        }

        event.preventDefault()

        if (
            nextHsvColor.saturation === hsvColor.saturation &&
            nextHsvColor.value === hsvColor.value
        ) {
            return
        }

        commitHsvColor(nextHsvColor)
    }

    function handleHueChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return

        const nextHsvColor = {
            ...hsvColor,
            hue: clamp(Number(event.target.value), 0, 359),
        }

        commitHsvColor(nextHsvColor)
    }

    function handlePresetClick(nextValue: string) {
        if (disabled || readOnly) return
        commitColor(nextValue)
        setIsOpen(false)
    }

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
        triggerRef.current?.focus()
    }

    async function handleEyeDropperClick() {
        if (disabled || readOnly) return

        const EyeDropper = (window as EyeDropperWindow).EyeDropper

        if (!EyeDropper) {
            return
        }

        try {
            const result = await new EyeDropper().open()
            commitHex(result.sRGBHex)
            closePicker(true)
        } catch {
            return
        }
    }

    function handleClosePicker() {
        closePicker(true)
    }

    function togglePicker() {
        if (disabled || readOnly) return

        if (isOpen) {
            closePicker(true)
            return
        }

        setHsvColor(getHsvFromValue(draftValue || safeValue))
        setIsOpen(true)
    }

    return {
        ref: {
            colorAreaRef,
            popupRef: overlay.ref.popupRef,
            rootRef: overlay.ref.rootRef,
            setTriggerRef,
            triggerRef,
            validationInputRef,
        },
        handler: {
            handleClosePicker,
            handleColorAreaKeyDown,
            handleColorAreaPointer,
            handleColorAreaPointerMove,
            handleEyeDropperClick,
            handleHueChange,
            handleInvalid,
            handlePresetClick,
            handleTextBlur,
            handleTextChange,
            togglePicker,
        },
        state: {
            draftValue,
            error,
            hasError,
            hueColor,
            hsvColor,
            isEyeDropperSupported,
            isOpen,
            isValid,
            pickerPosition: overlay.state.pickerPosition,
            previewColor,
            safeValue,
            selectedHex,
        },
        setter: {
            setDraftValue,
            setHsvColor,
            setIsOpen,
            setIsTouched,
        },
    }
}
