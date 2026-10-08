import type { EyeDropperWindow } from '../Types/eyedropper.types.ts'
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react'
import type {
    ChangeEvent,
    InvalidEvent,
    FocusEvent,
    KeyboardEvent,
    PointerEvent,
} from 'react'
import {
    clamp,
    formatColor,
    getHsvFromValue,
    hsvToRgb,
    normalizeColor,
    rgbToHex,
    toPickerHex,
} from '../../../lib/Color/color.ts'
import type { HsvColor } from '../../../lib/Color/Types/color.types.ts'
import { getColorError } from '../../../lib/Color/colorValidation.ts'
import { mergeAriaIds, resolveFieldError } from '../../../lib/Field/field.ts'
import { usePickerDefaults, usePickerMessages } from './usePickerContext.ts'
import type { PickerMessages } from '../../../lib/Messages/Types/i18n.types.ts'
import type {
    CustomColorPickerProps,
    CustomColorPickerLogicResult,
} from '../Types/picker.types.ts'
import usePickerOverlay from './usePickerOverlay.ts'
import useComposedRefs from './useComposedRefs.ts'

function getFormSubmitter(
    form: HTMLFormElement,
    submitter: HTMLElement | null,
) {
    if (submitter?.tagName === 'BUTTON') {
        const button = submitter as HTMLButtonElement
        return button.form === form && button.type === 'submit' ? button : null
    }

    if (submitter?.tagName === 'INPUT') {
        const input = submitter as HTMLInputElement

        return input.form === form && ['submit', 'image'].includes(input.type)
            ? input
            : null
    }

    return null
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

function isSameColorValue(left: string, right: string) {
    if (left === right) {
        return true
    }

    const normalizedLeft = normalizeColor(left)

    return normalizedLeft !== null && normalizedLeft === normalizeColor(right)
}

function getCommittedValue(value: string, format: 'hex' | 'rgb') {
    if (!value.trim()) {
        return ''
    }

    return formatColor(toPickerHex(value), format)
}

const defaultPresets = [
    '#13ecd6',
    '#3f40ad',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#f8fafc',
    '#111827',
]

export default function useCustomColorPickerLogic({
    value,
    onValueChange,
    onValidityChange,
    required,
    format = 'hex',
    messages: providedMessages,
    locale: providedLocale,
    error: externalError,
    disabled = false,
    readOnly = false,
    triggerRef: forwardedTriggerRef,
    id,
    onBlur,
    label,
    description,
    customDesign,
    presets = defaultPresets,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    name: _name,
    placeholder: _placeholder,
    showInput: _showInput,
    showPresets: _showPresets,
    icon: _icon,
    className: _className,
    ...ariaProps
}: CustomColorPickerProps): CustomColorPickerLogicResult {
    const defaults = usePickerDefaults()
    const messages = usePickerMessages(providedLocale, providedMessages)
    const generatedId = useId()
    const fieldId = id ?? `color-picker-${generatedId}`
    const hasLabel = label !== undefined && label !== null && label !== false
    const hasDescription =
        description !== undefined &&
        description !== null &&
        description !== false
    const labelId = hasLabel ? `${fieldId}-label` : undefined
    const descriptionId = hasDescription ? `${fieldId}-description` : undefined
    const errorId = `${fieldId}-error`
    const safeValue = value !== undefined && value !== null ? String(value) : ''
    const [draftValue, setDraftValue] = useState(safeValue)
    const currentStateRef = useRef<{
        draftValue: string
        safeValue: string
        required: boolean | undefined
        format: 'hex' | 'rgb'
        messages: PickerMessages
        externalError: string | null | undefined
        disabled: boolean
        readOnly: boolean
        commitColor: (nextValue: string) => void
    }>({
        draftValue,
        safeValue,
        required,
        format,
        messages,
        externalError,
        disabled,
        readOnly,
        commitColor: () => undefined,
    })

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
    const currentHsvRef = useRef(hsvColor)
    const requestedValueRef = useRef(safeValue)
    const lastPointerRef = useRef<{
        target: HTMLButtonElement
        clientX: number
        clientY: number
    } | null>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const onValidityChangeRef = useRef(onValidityChange)
    const previousValidityRef = useRef<boolean | undefined>(undefined)
    const replayingSubmitRef = useRef(false)
    const pendingSubmitCountRef = useRef(0)
    const pendingSubmitCommitRef = useRef<{
        baseValue: string
        nextValue: string
    } | null>(null)
    const [pendingValueChange, setPendingValueChange] = useState<{
        baseValue: string
        nextValue: string
        nextHsvColor: HsvColor
        reconciled: boolean
    } | null>(null)
    const internalError = getColorError(draftValue, required, messages)
    const { error, hasError } = resolveFieldError(
        internalError,
        externalError,
        isTouched,
    )
    const isValid = disabled || readOnly || !error
    const hasValidityChangeHandler = onValidityChange !== undefined

    const design = {
        bg: 'bg-input-dark',
        border: 'border-border-dark',
        text: 'text-white',
        placeholder: 'placeholder-gray-400',
        focusRing: 'focus-within:ring-primary/50',
        focusBorder: 'focus-within:border-primary',
        errorBorder: 'border-red-500',
        errorRing: 'focus-within:ring-red-500/50',
        errorText: 'text-red-400',
        labelText: 'text-gray-200',
        descriptionText: 'text-gray-400',
        iconColor: 'text-gray-500',
        iconFocus: 'group-focus-within:text-primary',
        hoverText: 'hover:text-white',
        previewBorder: 'border-border-dark',
        presetBorder: 'border-border-dark',
        presetActiveBorder: 'ring-primary border-primary',
        ...defaults.customDesign,
        ...customDesign,
    }

    const setTriggerRef = useComposedRefs(triggerRef, forwardedTriggerRef)

    const closePicker = useCallback((restoreFocus = false) => {
        setIsOpen(false)

        if (restoreFocus) {
            queueMicrotask(() => triggerRef.current?.focus())
        }
    }, [])

    const invalidatePointer = useCallback(() => {
        lastPointerRef.current = null
    }, [])

    useLayoutEffect(() => {
        currentHsvRef.current = hsvColor
        requestedValueRef.current =
            pendingValueChange && !pendingValueChange.reconciled
                ? pendingValueChange.nextValue
                : safeValue
    }, [hsvColor, pendingValueChange, safeValue])

    useLayoutEffect(invalidatePointer, [
        disabled,
        invalidatePointer,
        isOpen,
        readOnly,
        safeValue,
    ])

    const overlay = usePickerOverlay({
        initialFocusRef: colorAreaRef,
        isOpen,
        onClose: closePicker,
        onGeometryChange: invalidatePointer,
    })

    const resolvedLabelledBy = mergeAriaIds(ariaLabelledBy, labelId)
    const resolvedDescribedBy = mergeAriaIds(
        ariaDescribedBy,
        descriptionId,
        hasError ? errorId : undefined,
    )
    const resolvedAriaLabel =
        ariaLabel ?? (resolvedLabelledBy ? undefined : messages.selectColor)
    const presetEntries = useMemo(() => {
        const activeColor = normalizeColor(safeValue)
        return presets.map((preset) => ({
            preset,
            isActive:
                activeColor !== null && activeColor === normalizeColor(preset),
        }))
    }, [presets, safeValue])
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
        if (
            pendingValueChange &&
            isSameColorValue(safeValue, pendingValueChange.nextValue)
        ) {
            setDraftValue(safeValue)
            setHsvColor(pendingValueChange.nextHsvColor)
            setPendingValueChange(null)
        } else {
            setPendingValueChange(null)
            setDraftValue(safeValue)
            setHsvColor(getHsvFromValue(safeValue))
        }
    } else if (pendingValueChange) {
        if (isSameColorValue(safeValue, pendingValueChange.nextValue)) {
            setHsvColor(pendingValueChange.nextHsvColor)
            setPendingValueChange(null)
        } else if (
            isSameColorValue(safeValue, pendingValueChange.baseValue) &&
            !pendingValueChange.reconciled
        ) {
            setDraftValue(safeValue)
            setHsvColor(getHsvFromValue(safeValue))
            setPendingValueChange({
                ...pendingValueChange,
                reconciled: true,
            })
        } else if (!isSameColorValue(safeValue, pendingValueChange.baseValue)) {
            setPendingValueChange(null)
        }
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
        const input = validationInputRef.current

        if (!input) {
            return
        }

        const currentInput = input
        const ownerDocument = input.ownerDocument

        function handleFormSubmit(event: SubmitEvent) {
            const currentForm = currentInput.form

            if (!currentForm || event.target !== currentForm) {
                return
            }

            if (replayingSubmitRef.current) {
                replayingSubmitRef.current = false
                if (currentInput.validity.valid) {
                    setIsTouched(false)
                }
                return
            }

            if (event.defaultPrevented) {
                return
            }

            const currentState = currentStateRef.current
            const submitter = getFormSubmitter(currentForm, event.submitter)
            const skipNativeValidation =
                currentForm.noValidate || Boolean(submitter?.formNoValidate)
            const nextInternalError = getColorError(
                currentState.draftValue,
                currentState.required,
                currentState.messages,
            )

            if (currentState.disabled || currentState.readOnly) {
                if (currentInput.validity.valid) {
                    setIsTouched(false)
                }
                return
            }

            if (currentState.externalError && !skipNativeValidation) {
                event.preventDefault()
                event.stopPropagation()
                event.stopImmediatePropagation()
                setIsTouched(true)
                triggerRef.current?.focus()
                return
            }

            if (nextInternalError) {
                if (skipNativeValidation) {
                    if (currentInput.validity.valid) {
                        setIsTouched(false)
                    }
                    return
                }

                if (
                    currentState.externalError === null ||
                    currentState.externalError === ''
                ) {
                    if (currentInput.validity.valid) {
                        setIsTouched(false)
                    }
                    return
                }

                event.preventDefault()
                event.stopPropagation()
                event.stopImmediatePropagation()
                setIsTouched(true)
                triggerRef.current?.focus()
                return
            }

            const nextValue = getCommittedValue(
                currentState.draftValue,
                currentState.format,
            )
            const currentValue = currentState.safeValue

            if (isSameColorValue(currentValue, nextValue)) {
                if (currentInput.validity.valid) {
                    setIsTouched(false)
                }
                setDraftValue(currentValue)
                return
            }

            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()

            const originalSubmitter = event.submitter
            pendingSubmitCountRef.current += 1

            // A new task lets React commit accepted values and the browser leave
            // its native submission algorithm. Keep each attempt alive even if
            // onValueChange removes this picker from the remaining form.
            setTimeout(() => {
                try {
                    if (!currentForm.isConnected) {
                        return
                    }

                    replayingSubmitRef.current = true
                    const replaySubmitter = getFormSubmitter(
                        currentForm,
                        originalSubmitter,
                    )

                    if (
                        skipNativeValidation &&
                        !currentForm.noValidate &&
                        !replaySubmitter?.formNoValidate
                    ) {
                        currentForm.noValidate = true

                        try {
                            currentForm.requestSubmit(
                                replaySubmitter ?? undefined,
                            )
                        } finally {
                            currentForm.noValidate = false
                        }
                    } else {
                        currentForm.requestSubmit(replaySubmitter ?? undefined)
                    }
                } finally {
                    replayingSubmitRef.current = false
                    pendingSubmitCountRef.current -= 1

                    if (pendingSubmitCountRef.current === 0) {
                        pendingSubmitCommitRef.current = null
                    }
                }
            }, 0)

            const pendingCommit = pendingSubmitCommitRef.current

            if (
                !pendingCommit ||
                !isSameColorValue(pendingCommit.baseValue, currentValue) ||
                !isSameColorValue(pendingCommit.nextValue, nextValue)
            ) {
                pendingSubmitCommitRef.current = {
                    baseValue: currentValue,
                    nextValue,
                }
                currentState.commitColor(currentState.draftValue)
            }
        }

        ownerDocument.addEventListener('submit', handleFormSubmit, true)

        return () => {
            ownerDocument.removeEventListener('submit', handleFormSubmit, true)
        }
    }, [])

    const commitHex = useCallback(
        (nextHex: string, nextHsvColor = getHsvFromValue(nextHex)) => {
            if (disabled || readOnly) return

            const nextValue = formatColor(nextHex, format)
            const valueChanged = !isSameColorValue(
                requestedValueRef.current,
                nextValue,
            )
            currentHsvRef.current = nextHsvColor
            if (!valueChanged) {
                setHsvColor(nextHsvColor)
                setDraftValue(nextValue)
                setPendingValueChange((current) =>
                    current ? { ...current, nextHsvColor } : null,
                )
                return
            }
            requestedValueRef.current = nextValue
            setPendingValueChange({
                baseValue: safeValue,
                nextValue,
                nextHsvColor,
                reconciled: false,
            })
            setHsvColor(nextHsvColor)
            setDraftValue(nextValue)
            onValueChange(nextValue)
        },
        [disabled, format, onValueChange, readOnly, safeValue],
    )

    function commitHsvColor(nextHsvColor: HsvColor) {
        const current = currentHsvRef.current
        if (
            current.hue === nextHsvColor.hue &&
            current.saturation === nextHsvColor.saturation &&
            current.value === nextHsvColor.value
        )
            return
        commitHex(rgbToHex(hsvToRgb(nextHsvColor)), nextHsvColor)
    }

    const commitColor = useCallback(
        (nextValue: string) => {
            if (disabled || readOnly) return

            const nextInternalError = getColorError(
                nextValue,
                required,
                messages,
            )
            setDraftValue(nextValue)

            if (nextInternalError) {
                setIsTouched(true)
                return
            }

            if (!nextValue.trim()) {
                setDraftValue('')

                if (safeValue === '') {
                    setHsvColor(getHsvFromValue(''))
                    return
                }

                setPendingValueChange({
                    baseValue: safeValue,
                    nextValue: '',
                    nextHsvColor: getHsvFromValue(''),
                    reconciled: false,
                })
                onValueChange('')
                return
            }

            const nextHex = toPickerHex(nextValue)
            const formattedValue = formatColor(nextHex, format)

            if (isSameColorValue(safeValue, formattedValue)) {
                setDraftValue(safeValue)
                setHsvColor(getHsvFromValue(safeValue))
                return
            }

            commitHex(nextHex)
        },
        [
            commitHex,
            disabled,
            format,
            messages,
            onValueChange,
            readOnly,
            required,
            safeValue,
        ],
    )

    const setValidationInputRef = useCallback(
        (node: HTMLInputElement | null) => {
            validationInputRef.current = node

            if (!node) {
                return
            }

            currentStateRef.current = {
                draftValue,
                safeValue,
                required,
                format,
                messages,
                externalError,
                disabled,
                readOnly,
                commitColor,
            }
            node.value = draftValue
            node.setCustomValidity(disabled ? '' : error || '')
        },
        [
            commitColor,
            disabled,
            draftValue,
            error,
            externalError,
            format,
            messages,
            readOnly,
            required,
            safeValue,
        ],
    )

    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return

        const nextValue = event.target.value
        currentStateRef.current.draftValue = nextValue
        const validationInput = validationInputRef.current
        const nextError =
            externalError !== undefined
                ? externalError
                : getColorError(nextValue, required, messages)

        setDraftValue(nextValue)

        if (validationInput) {
            validationInput.value = nextValue
            validationInput.setCustomValidity(disabled ? '' : nextError || '')
        }
    }

    function handleTextBlur() {
        if (disabled || readOnly) return
        setIsTouched(true)
        commitColor(draftValue)
    }

    function updateColorAreaPointer(event: PointerEvent<HTMLButtonElement>) {
        if (disabled || readOnly) return

        const previous = lastPointerRef.current
        if (
            previous?.target === event.currentTarget &&
            previous.clientX === event.clientX &&
            previous.clientY === event.clientY
        )
            return

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
            ...currentHsvRef.current,
            saturation: nextSaturation,
            value: nextValue,
        }

        lastPointerRef.current = {
            target: event.currentTarget,
            clientX: event.clientX,
            clientY: event.clientY,
        }
        commitHsvColor(nextHsvColor)
    }

    function handleColorAreaPointer(event: PointerEvent<HTMLButtonElement>) {
        if (disabled || readOnly) return
        invalidatePointer()
        event.currentTarget.setPointerCapture(event.pointerId)
        updateColorAreaPointer(event)
    }

    function handleColorAreaPointerMove(
        event: PointerEvent<HTMLButtonElement>,
    ) {
        if (event.buttons === 1) {
            updateColorAreaPointer(event)
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
            hue: clamp(Number(event.target.value), 0, 360),
        }

        commitHsvColor(nextHsvColor)
    }

    function handleSaturationChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return

        commitHsvColor({
            ...hsvColor,
            saturation: clamp(Number(event.target.value), 0, 100),
        })
    }

    function handleBrightnessChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return

        commitHsvColor({
            ...hsvColor,
            value: clamp(Number(event.target.value), 0, 100),
        })
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

    function handleFieldBlur(event: FocusEvent<HTMLElement>) {
        const nextTarget = event.relatedTarget

        if (
            nextTarget instanceof Node &&
            (overlay.refs.rootRef.current?.contains(nextTarget) ||
                overlay.refs.popupRef.current?.contains(nextTarget))
        ) {
            return
        }

        onBlur?.(event)
    }

    return {
        refs: {
            colorAreaRef,
            popupRef: overlay.refs.popupRef,
            rootRef: overlay.refs.rootRef,
            setTriggerRef,
            triggerRef,
            setValidationInputRef,
        },
        handler: {
            handleFieldBlur,
            handleClosePicker,
            handleBrightnessChange,
            handleColorAreaKeyDown,
            handleColorAreaPointer,
            handleColorAreaPointerMove,
            handleEyeDropperClick,
            handleHueChange,
            handleInvalid,
            handlePresetClick,
            handleSaturationChange,
            handleTextBlur,
            handleTextChange,
            togglePicker,
        },
        state: {
            fieldId,
            hasLabel,
            hasDescription,
            labelId,
            descriptionId,
            errorId,
            messages,
            resolvedLabelledBy,
            resolvedDescribedBy,
            resolvedAriaLabel,
            design,
            presetEntries,
            ariaProps,
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
