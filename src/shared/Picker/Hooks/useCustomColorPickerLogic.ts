import { useEyeDropper } from './useEyeDropper.ts'
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
    MouseEvent,
    PointerEvent,
} from 'react'
import {
    clamp,
    defaultPickerColor,
    formatColor,
    getHsvFromValue,
    hsvToRgb,
    normalizeColor,
    parseColor,
    rgbaToHex,
    rgbToHex,
} from '../../../lib/Color/color.ts'
import type {
    ColorFormat,
    HsvColor,
    RgbaColor,
} from '../../../lib/Color/Types/color.types.ts'
import { getColorError } from '../../../lib/Color/colorValidation.ts'
import { mergeAriaIds, resolveFieldError } from '../../../lib/Field/field.ts'
import { usePickerDefaults, usePickerMessages } from './usePickerContext.ts'
import type { PickerMessages } from '../../../lib/Messages/Types/i18n.types.ts'
import type {
    CustomColorPickerDesign,
    CustomColorPickerProps,
    CustomColorPickerLogicResult,
    PickerClassNames,
} from '../Types/picker.types.ts'
import usePickerOverlay from './usePickerOverlay.ts'
import useComposedRefs from './useComposedRefs.ts'

const NOOP = () => undefined

const EMPTY_CLASS_NAMES: PickerClassNames = Object.freeze({})

const EMPTY_PRESET_ENTRIES: Array<{ preset: string; isActive: boolean }> = []

const DEFAULT_PICKER_DESIGN: Required<CustomColorPickerDesign> = Object.freeze({
    bg: 'bg-rentner-control',
    border: 'border-rentner-border',
    text: 'text-rentner-foreground',
    placeholder: 'placeholder-rentner-muted',
    focusRing: 'focus-within:ring-rentner-accent',
    focusBorder: 'focus-within:border-rentner-accent',
    errorBorder: 'border-rentner-danger',
    errorRing: 'focus-within:ring-rentner-danger',
    errorText: 'text-rentner-danger',
    labelText: 'text-rentner-foreground',
    descriptionText: 'text-rentner-muted',
    iconColor: 'text-rentner-muted',
    iconFocus: 'group-focus-within:text-rentner-accent',
    hoverText: 'hover:text-rentner-foreground',
    previewBorder: 'border-rentner-border',
    presetBorder: 'border-rentner-border',
    presetActiveBorder: 'ring-rentner-accent border-rentner-accent',
})

function formatRgbaValue(rgba: RgbaColor, format: ColorFormat): string {
    if (format === 'rgba') {
        return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${rgba.alpha})`
    }
    if (format === 'hex8') return rgbaToHex(rgba)
    if (format === 'rgb') return `rgb(${rgba.red}, ${rgba.green}, ${rgba.blue})`
    return rgbToHex(rgba)
}

function isSameRgba(left: RgbaColor | null, right: RgbaColor | null): boolean {
    return (
        left !== null &&
        right !== null &&
        left.red === right.red &&
        left.green === right.green &&
        left.blue === right.blue &&
        left.alpha === right.alpha
    )
}

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

        return input.form === form &&
            (input.type === 'submit' || input.type === 'image')
            ? input
            : null
    }

    return null
}

function subscribeToEyeDropperSupport() {
    return NOOP
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

    const parsedLeft = parseColor(left)
    if (!parsedLeft) return false

    const parsedRight = parseColor(right)
    return isSameRgba(parsedLeft, parsedRight)
}

function getCommittedValue(value: string, format: ColorFormat) {
    if (!value.trim()) {
        return ''
    }

    return formatColor(value, format)
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

function handleTriggerMouseDown(event: MouseEvent<HTMLButtonElement>) {
    // WebKit otherwise blurs an already focused button before its click.
    if (event.button === 0 && event.currentTarget.matches(':focus')) {
        event.preventDefault()
    }
}

export default function useCustomColorPickerLogic({
    value,
    onValueChange,
    onValidityChange,
    required,
    format: providedFormat = 'hex',
    enableAlpha: providedEnableAlpha = false,
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
    classNames: providedClassNames,
    controlSize,
    portalContainer,
    portalClassName,
    portalZIndex,
    presets = defaultPresets,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    name: _name,
    placeholder: _placeholder,
    showInput: _showInput,
    showPresets = true,
    icon: _icon,
    className: _className,
    ...ariaProps
}: CustomColorPickerProps): CustomColorPickerLogicResult {
    const enableAlpha =
        providedEnableAlpha ||
        providedFormat === 'rgba' ||
        providedFormat === 'hex8'
    const format = enableAlpha
        ? providedFormat === 'rgb' || providedFormat === 'rgba'
            ? 'rgba'
            : 'hex8'
        : providedFormat
    const defaults = usePickerDefaults()
    const defaultClassNames = defaults.classNames
    const classNames = useMemo(() => {
        if (!defaultClassNames && !providedClassNames) return EMPTY_CLASS_NAMES
        if (!providedClassNames) return defaultClassNames!
        if (!defaultClassNames) return providedClassNames
        return { ...defaultClassNames, ...providedClassNames }
    }, [defaultClassNames, providedClassNames])
    const size = controlSize ?? defaults.controlSize
    const sizeClassName =
        size === 'sm'
            ? 'h-rentner-control-sm'
            : size === 'md'
              ? 'h-rentner-control-md'
              : size === 'lg'
                ? 'h-rentner-control-lg'
                : ''
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
    const [draftState, setDraftState] = useState<{
        baseValue: string
        value: string
    } | null>(null)
    const draftValue =
        draftState && draftState.baseValue === safeValue
            ? draftState.value
            : safeValue
    const [hsvOverride, setHsvOverride] = useState<{
        forValue: string
        hsv: HsvColor
    } | null>(null)
    const parsedSafeColor = useMemo(() => parseColor(safeValue), [safeValue])
    const parsedDraftColor = useMemo(
        () =>
            draftValue === safeValue ? parsedSafeColor : parseColor(draftValue),
        [draftValue, safeValue, parsedSafeColor],
    )
    const fallbackHsv = useMemo(() => getHsvFromValue(safeValue), [safeValue])
    const hsvColor = useMemo(() => {
        if (!hsvOverride) return fallbackHsv
        if (
            hsvOverride.forValue === safeValue ||
            (parsedSafeColor !== null &&
                isSameRgba(parseColor(hsvOverride.forValue), parsedSafeColor))
        ) {
            return hsvOverride.hsv
        }
        return fallbackHsv
    }, [hsvOverride, safeValue, parsedSafeColor, fallbackHsv])
    const currentStateRef = useRef<{
        draftValue: string
        safeValue: string
        required: boolean | undefined
        format: ColorFormat
        enableAlpha: boolean
        messages: PickerMessages
        externalError: string | null | undefined
        disabled: boolean
        readOnly: boolean
        error: string | null
        commitColor: (nextValue: string) => void
    } | null>(null)

    const [isTouched, setIsTouched] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const isEyeDropperSupported = useSyncExternalStore(
        subscribeToEyeDropperSupport,
        getEyeDropperSupportSnapshot,
        getEyeDropperSupportServerSnapshot,
    )
    const colorAreaRef = useRef<HTMLButtonElement>(null)
    const currentHsvRef = useRef(hsvColor)
    const requestedValueRef = useRef(safeValue)
    const requestedRgbaRef = useRef<RgbaColor | null>(parsedSafeColor)
    const lastPointerRef = useRef<{
        target: HTMLButtonElement
        clientX: number
        clientY: number
    } | null>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const lastCustomValidityRef = useRef<string | null>(null)
    const onValidityChangeRef = useRef(onValidityChange)
    const previousValidityRef = useRef<boolean | undefined>(undefined)
    const replayingSubmitRef = useRef(false)
    const pendingSubmitCountRef = useRef(0)
    const pendingSubmitCommitRef = useRef<{
        baseValue: string
        nextValue: string
    } | null>(null)
    const internalError = useMemo(() => {
        const trimmed = draftValue.trim()
        if (required && !trimmed) return messages.required
        if (!trimmed) return null
        if (!parsedDraftColor) return messages.invalidColor
        if (!enableAlpha) {
            return getColorError(draftValue, required, messages, false)
        }
        return null
    }, [draftValue, required, messages, parsedDraftColor, enableAlpha])
    const { error, hasError } = resolveFieldError(
        internalError,
        externalError,
        isTouched,
    )
    const isValid = disabled || readOnly || !error
    const hasValidityChangeHandler = onValidityChange !== undefined

    const defaultCustomDesign = defaults.customDesign
    const design = useMemo(() => {
        if (!defaultCustomDesign && !customDesign) return DEFAULT_PICKER_DESIGN
        return {
            ...DEFAULT_PICKER_DESIGN,
            ...defaultCustomDesign,
            ...customDesign,
        }
    }, [defaultCustomDesign, customDesign])

    const setTriggerRef = useComposedRefs(triggerRef, forwardedTriggerRef)

    const eyeDropper = useEyeDropper({
        enabled: isOpen && !disabled && !readOnly,
        onSelect: (nextHex) => commitHex(nextHex),
        onSuccess: () => closePicker(true),
    })
    const cancelEyeDropper = eyeDropper.handler.cancel
    const closePicker = useCallback(
        (restoreFocus = false) => {
            cancelEyeDropper()
            setIsOpen(false)

            if (restoreFocus) {
                queueMicrotask(() => triggerRef.current?.focus())
            }
        },
        [cancelEyeDropper],
    )

    const invalidatePointer = useCallback(() => {
        lastPointerRef.current = null
    }, [])

    useLayoutEffect(() => {
        currentHsvRef.current = hsvColor
        requestedValueRef.current = safeValue
        requestedRgbaRef.current = parsedSafeColor
        onValidityChangeRef.current = onValidityChange
    }, [hsvColor, safeValue, parsedSafeColor, onValidityChange])

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
    const parsedPresets = useMemo(() => {
        if (!showPresets || presets.length === 0) return null
        return presets.map((preset) => ({
            preset,
            rgba: enableAlpha ? parseColor(preset) : null,
            normalized: enableAlpha ? null : normalizeColor(preset),
        }))
    }, [showPresets, presets, enableAlpha])
    const normalizedOpaqueSafe = useMemo(
        () => (!enableAlpha ? normalizeColor(safeValue, false) : null),
        [enableAlpha, safeValue],
    )
    const activePresetMask = useMemo(() => {
        if (!parsedPresets) return ''
        const hasActive = enableAlpha
            ? parsedSafeColor !== null
            : normalizedOpaqueSafe !== null
        if (!hasActive) return ''
        let mask = ''
        for (let index = 0; index < parsedPresets.length; index++) {
            const entry = parsedPresets[index]!
            const active = enableAlpha
                ? isSameRgba(parsedSafeColor, entry.rgba)
                : normalizedOpaqueSafe === entry.normalized
            if (active) mask = mask ? `${mask},${index}` : `${index}`
        }
        return mask
    }, [parsedPresets, enableAlpha, parsedSafeColor, normalizedOpaqueSafe])
    const presetEntries = useMemo(() => {
        if (!parsedPresets) return EMPTY_PRESET_ENTRIES
        if (!activePresetMask) {
            return parsedPresets.map((entry) => ({
                preset: entry.preset,
                isActive: false,
            }))
        }
        const activeSet = new Set(activePresetMask.split(',').map(Number))
        return parsedPresets.map((entry, index) => ({
            preset: entry.preset,
            isActive: activeSet.has(index),
        }))
    }, [parsedPresets, activePresetMask])
    const selectedRgb = useMemo(() => hsvToRgb(hsvColor), [hsvColor])
    const selectedHex = useMemo(() => rgbToHex(selectedRgb), [selectedRgb])
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
    const activeParsedColor = draftValue ? parsedDraftColor : parsedSafeColor
    const alpha = enableAlpha ? (activeParsedColor?.alpha ?? 1) : 1
    const alphaColor = `rgba(${selectedRgb.red}, ${selectedRgb.green}, ${selectedRgb.blue}, ${alpha})`
    const previewColor = useMemo(() => {
        if (error) {
            if (enableAlpha) {
                return parsedSafeColor
                    ? rgbaToHex(parsedSafeColor)
                    : defaultPickerColor
            }
            return normalizedOpaqueSafe ?? defaultPickerColor
        }
        if (!draftValue) {
            return enableAlpha ? `${selectedHex}ff` : selectedHex
        }
        if (enableAlpha) {
            return parsedDraftColor
                ? rgbaToHex(parsedDraftColor)
                : defaultPickerColor
        }
        return normalizeColor(draftValue, false) ?? defaultPickerColor
    }, [
        error,
        enableAlpha,
        parsedSafeColor,
        normalizedOpaqueSafe,
        draftValue,
        selectedHex,
        parsedDraftColor,
    ])

    if ((disabled || readOnly) && isOpen) {
        setIsOpen(false)
    }
    if (draftState && draftState.baseValue !== safeValue) {
        setDraftState(null)
    }

    const setDraftValue = useCallback(
        (next: string | ((prev: string) => string)) => {
            setDraftState((previous) => {
                const current =
                    previous && previous.baseValue === safeValue
                        ? previous.value
                        : safeValue
                const resolved =
                    typeof next === 'function' ? next(current) : next
                return resolved === safeValue
                    ? null
                    : { baseValue: safeValue, value: resolved }
            })
        },
        [safeValue],
    )

    const setHsvColor = useCallback(
        (next: HsvColor | ((prev: HsvColor) => HsvColor)) => {
            setHsvOverride((previous) => {
                const current =
                    previous && isSameColorValue(previous.forValue, safeValue)
                        ? previous.hsv
                        : currentHsvRef.current
                const resolved =
                    typeof next === 'function' ? next(current) : next
                return { forValue: safeValue, hsv: resolved }
            })
        },
        [safeValue],
    )

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
            if (!currentState) return

            if (currentState.disabled || currentState.readOnly) {
                if (currentInput.validity.valid) {
                    setIsTouched(false)
                }
                return
            }

            const submitter = getFormSubmitter(currentForm, event.submitter)
            const skipNativeValidation =
                currentForm.noValidate || Boolean(submitter?.formNoValidate)
            const nextInternalError = getColorError(
                currentState.draftValue,
                currentState.required,
                currentState.messages,
                currentState.enableAlpha,
            )

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
                setDraftState(null)
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

    const commitRgba = useCallback(
        (rgba: RgbaColor, nextHsvColor: HsvColor) => {
            if (disabled || readOnly) return

            const nextValue = formatRgbaValue(rgba, format)
            const effectiveRgba: RgbaColor =
                format === 'hex8'
                    ? {
                          red: rgba.red,
                          green: rgba.green,
                          blue: rgba.blue,
                          alpha:
                              clamp(Math.round(rgba.alpha * 255), 0, 255) / 255,
                      }
                    : format === 'hex' || format === 'rgb'
                      ? {
                            red: rgba.red,
                            green: rgba.green,
                            blue: rgba.blue,
                            alpha: 1,
                        }
                      : rgba
            const valueChanged =
                requestedValueRef.current !== nextValue &&
                !isSameRgba(requestedRgbaRef.current, effectiveRgba)
            currentHsvRef.current = nextHsvColor
            if (!valueChanged) {
                setHsvOverride({ forValue: safeValue, hsv: nextHsvColor })
                setDraftState(
                    nextValue === safeValue
                        ? null
                        : { baseValue: safeValue, value: nextValue },
                )
                return
            }
            requestedValueRef.current = nextValue
            requestedRgbaRef.current = effectiveRgba
            setHsvOverride({ forValue: nextValue, hsv: nextHsvColor })
            setDraftState(null)
            onValueChange(nextValue)
        },
        [disabled, format, onValueChange, readOnly, safeValue],
    )

    const commitHex = useCallback(
        (nextHex: string, nextHsvColor = getHsvFromValue(nextHex)) => {
            if (disabled || readOnly) return

            const parsed = parseColor(nextHex)
            if (parsed) {
                commitRgba(parsed, nextHsvColor)
                return
            }
            const nextValue = formatColor(nextHex, format)
            const valueChanged = !isSameColorValue(
                requestedValueRef.current,
                nextValue,
            )
            currentHsvRef.current = nextHsvColor
            if (!valueChanged) {
                setHsvOverride({ forValue: safeValue, hsv: nextHsvColor })
                setDraftState(
                    nextValue === safeValue
                        ? null
                        : { baseValue: safeValue, value: nextValue },
                )
                return
            }
            requestedValueRef.current = nextValue
            requestedRgbaRef.current = null
            setHsvOverride({ forValue: nextValue, hsv: nextHsvColor })
            setDraftState(null)
            onValueChange(nextValue)
        },
        [commitRgba, disabled, format, onValueChange, readOnly, safeValue],
    )

    function commitHsvColor(nextHsvColor: HsvColor) {
        const current = currentHsvRef.current
        if (
            current.hue === nextHsvColor.hue &&
            current.saturation === nextHsvColor.saturation &&
            current.value === nextHsvColor.value
        )
            return
        const rgb = hsvToRgb(nextHsvColor)
        commitRgba(
            {
                red: rgb.red,
                green: rgb.green,
                blue: rgb.blue,
                alpha: enableAlpha ? (requestedRgbaRef.current?.alpha ?? 1) : 1,
            },
            nextHsvColor,
        )
    }

    const commitColor = useCallback(
        (nextValue: string) => {
            if (disabled || readOnly) return

            const nextInternalError = getColorError(
                nextValue,
                required,
                messages,
                enableAlpha,
            )

            if (nextInternalError) {
                setDraftState(
                    nextValue === safeValue
                        ? null
                        : { baseValue: safeValue, value: nextValue },
                )
                setIsTouched(true)
                return
            }

            if (!nextValue.trim()) {
                setDraftState(
                    safeValue === ''
                        ? null
                        : { baseValue: safeValue, value: '' },
                )
                setHsvOverride(null)

                if (safeValue === '') {
                    return
                }

                requestedValueRef.current = ''
                requestedRgbaRef.current = null
                setDraftState(null)
                onValueChange('')
                return
            }

            const parsed = parseColor(nextValue)
            if (parsed) {
                const formattedValue = formatRgbaValue(parsed, format)
                const effectiveRgba: RgbaColor =
                    format === 'hex8'
                        ? {
                              red: parsed.red,
                              green: parsed.green,
                              blue: parsed.blue,
                              alpha:
                                  clamp(
                                      Math.round(parsed.alpha * 255),
                                      0,
                                      255,
                                  ) / 255,
                          }
                        : format === 'hex' || format === 'rgb'
                          ? {
                                red: parsed.red,
                                green: parsed.green,
                                blue: parsed.blue,
                                alpha: 1,
                            }
                          : parsed
                if (
                    safeValue === formattedValue ||
                    isSameRgba(parsedSafeColor, effectiveRgba)
                ) {
                    setDraftState(null)
                    setHsvOverride(null)
                    return
                }
                commitRgba(parsed, getHsvFromValue(formattedValue))
                return
            }

            const formattedValue = formatColor(nextValue, format)

            if (isSameColorValue(safeValue, formattedValue)) {
                setDraftState(null)
                setHsvOverride(null)
                return
            }

            commitHex(formattedValue)
        },
        [
            commitHex,
            commitRgba,
            disabled,
            format,
            enableAlpha,
            messages,
            onValueChange,
            parsedSafeColor,
            readOnly,
            required,
            safeValue,
        ],
    )

    useLayoutEffect(() => {
        currentStateRef.current = {
            draftValue,
            safeValue,
            required,
            format,
            enableAlpha,
            messages,
            externalError,
            disabled,
            readOnly,
            error,
            commitColor,
        }
        const node = validationInputRef.current
        if (!node) return
        if (node.value !== draftValue) {
            node.value = draftValue
        }
        const nextValidity = disabled ? '' : error || ''
        if (lastCustomValidityRef.current !== nextValidity) {
            lastCustomValidityRef.current = nextValidity
            node.setCustomValidity(nextValidity)
        }
    }, [
        commitColor,
        disabled,
        draftValue,
        enableAlpha,
        error,
        externalError,
        format,
        messages,
        readOnly,
        required,
        safeValue,
    ])

    const setValidationInputRef = useCallback(
        (node: HTMLInputElement | null) => {
            validationInputRef.current = node

            if (!node) {
                lastCustomValidityRef.current = null
                return
            }

            const current = currentStateRef.current
            if (!current) return
            node.value = current.draftValue
            const nextValidity = current.disabled ? '' : current.error || ''
            lastCustomValidityRef.current = nextValidity
            node.setCustomValidity(nextValidity)
        },
        [],
    )

    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly) return

        const nextValue = event.target.value
        if (currentStateRef.current) {
            currentStateRef.current.draftValue = nextValue
        }
        const validationInput = validationInputRef.current
        const nextError =
            externalError !== undefined
                ? externalError
                : getColorError(nextValue, required, messages, enableAlpha)

        setDraftState(
            nextValue === safeValue
                ? null
                : { baseValue: safeValue, value: nextValue },
        )

        if (validationInput) {
            validationInput.value = nextValue
            const nextValidity = disabled ? '' : nextError || ''
            lastCustomValidityRef.current = nextValidity
            validationInput.setCustomValidity(nextValidity)
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

    function handleAlphaChange(event: ChangeEvent<HTMLInputElement>) {
        if (disabled || readOnly || !enableAlpha) return
        const rgb = hsvToRgb(currentHsvRef.current)
        const nextAlpha = clamp(Number(event.target.value), 0, 100) / 100
        commitRgba(
            {
                red: rgb.red,
                green: rgb.green,
                blue: rgb.blue,
                alpha: nextAlpha,
            },
            currentHsvRef.current,
        )
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

    const handlePresetClick = useCallback((nextValue: string) => {
        const current = currentStateRef.current
        if (!current || current.disabled || current.readOnly) return
        current.commitColor(nextValue)
        setIsOpen(false)
    }, [])

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
        triggerRef.current?.focus()
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

        setHsvOverride({
            forValue: safeValue,
            hsv: getHsvFromValue(draftValue || safeValue),
        })
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

        const popupRoot = overlay.refs.popupRef.current?.getRootNode()
        if (
            nextTarget instanceof Element &&
            popupRoot instanceof ShadowRoot &&
            popupRoot.host === nextTarget
        ) {
            const currentTarget = event.currentTarget
            queueMicrotask(() => {
                let active = nextTarget.ownerDocument.activeElement
                while (active?.shadowRoot?.activeElement)
                    active = active.shadowRoot.activeElement
                if (
                    active &&
                    (overlay.refs.rootRef.current?.contains(active) ||
                        overlay.refs.popupRef.current?.contains(active))
                )
                    return
                onBlur?.({
                    ...event,
                    currentTarget,
                    relatedTarget: active,
                    preventDefault: event.preventDefault.bind(event),
                    stopPropagation: event.stopPropagation.bind(event),
                    persist: event.persist.bind(event),
                    isDefaultPrevented: event.isDefaultPrevented.bind(event),
                    isPropagationStopped:
                        event.isPropagationStopped.bind(event),
                })
            })
            return
        }
        onBlur?.(event)
    }

    return {
        refs: {
            colorAreaRef,
            popupRef: overlay.refs.popupRef,
            setPopupRef: overlay.refs.setPopupRef,
            rootRef: overlay.refs.rootRef,
            setTriggerRef,
            triggerRef,
            setValidationInputRef,
        },
        handler: {
            handleFieldBlur,
            handleTriggerMouseDown,
            handleClosePicker,
            handleBrightnessChange,
            handleColorAreaKeyDown,
            handleColorAreaPointer,
            handleColorAreaPointerMove,
            handleEyeDropperClick: eyeDropper.handler.select,
            handleAlphaChange,
            handleHueChange,
            handleInvalid,
            handlePresetClick,
            handleSaturationChange,
            handleTextBlur,
            handleTextChange,
            togglePicker,
        },
        state: {
            classNames,
            sizeClassName,
            portalContainer:
                portalContainer === undefined
                    ? defaults.portalContainer
                    : portalContainer,
            portalClassName: portalClassName ?? defaults.portalClassName,
            portalZIndex: portalZIndex ?? defaults.portalZIndex,
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
            alpha,
            alphaColor,
            enableAlpha,
            hueColor,
            hsvColor,
            isEyeDropperSupported,
            isEyeDropperPending: eyeDropper.state.isPending,
            isOpen,
            isValid,
            pickerPosition: overlay.state.pickerPosition,
            isPositioned: overlay.state.isPositioned,
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
