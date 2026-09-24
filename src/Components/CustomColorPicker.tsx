import { AlertCircle, Palette, Pipette, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useId, type FocusEvent } from 'react'
import useCustomColorPickerLogic from '../Hooks/useCustomColorPickerLogic.js'
import { usePickerDefaults, usePickerMessages } from '../PickerProvider.js'
import type { CustomColorPickerProps } from '../types.js'
import { mergeAriaIds } from '../field.js'
import { toPickerHex } from '../color.js'

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

export function CustomColorPicker({
    id,
    name,
    value,
    onValueChange,
    onValidityChange,
    required = false,
    disabled = false,
    readOnly = false,
    onBlur,
    label,
    description,
    error,
    triggerRef,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    placeholder = '#13ecd6',
    format = 'hex',
    presets = defaultPresets,
    showInput = true,
    showPresets = true,
    icon,
    className = 'w-full',
    customDesign,
    locale: providedLocale,
    messages: providedMessages,
    ...ariaProps
}: CustomColorPickerProps) {
    const defaults = usePickerDefaults()
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
    const messages = usePickerMessages(providedLocale, providedMessages)
    const {
        ref: {
            colorAreaRef,
            popupRef,
            rootRef,
            setTriggerRef,
            validationInputRef,
        },
        handler,
        state,
    } = useCustomColorPickerLogic({
        value,
        onValueChange,
        onValidityChange,
        required,
        format,
        messages,
        error,
        disabled,
        readOnly,
        triggerRef,
    })

    const resolvedLabelledBy = mergeAriaIds(ariaLabelledBy, labelId)
    const resolvedDescribedBy = mergeAriaIds(
        ariaDescribedBy,
        descriptionId,
        state.hasError ? errorId : undefined,
    )
    const resolvedAriaLabel =
        ariaLabel ?? (resolvedLabelledBy ? undefined : messages.selectColor)

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

    function handleFieldBlur(event: FocusEvent<HTMLElement>) {
        const nextTarget = event.relatedTarget

        if (
            nextTarget instanceof Node &&
            (rootRef.current?.contains(nextTarget) ||
                popupRef.current?.contains(nextTarget))
        ) {
            return
        }

        onBlur?.(event)
    }

    const activeColor = toPickerHex(state.safeValue).toLowerCase()
    const pickerPopup =
        state.isOpen && !disabled && !readOnly ? (
            <div
                ref={popupRef}
                role="dialog"
                aria-modal="false"
                aria-label={messages.selectColor}
                className={`fixed z-[9999] overflow-y-auto overscroll-contain rounded-xl border p-3 shadow-2xl motion-reduce:animate-none ${design.bg} ${design.border}`}
                style={{
                    left: `${state.pickerPosition.left}px`,
                    top: `${state.pickerPosition.top}px`,
                    width: `${state.pickerPosition.width}px`,
                    maxHeight: `${state.pickerPosition.maxHeight}px`,
                }}
            >
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`h-9 w-9 shrink-0 rounded-lg border ${design.previewBorder}`}
                            style={{ backgroundColor: state.selectedHex }}
                        />
                        <span
                            className={`min-w-0 truncate text-sm font-semibold ${design.text}`}
                        >
                            {state.draftValue || state.selectedHex}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {state.isEyeDropperSupported && (
                            <button
                                type="button"
                                onClick={handler.handleEyeDropperClick}
                                disabled={disabled || readOnly}
                                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border ${design.border} ${design.iconColor} ${design.hoverText} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                                aria-label={messages.eyeDropper}
                            >
                                <Pipette className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handler.handleClosePicker}
                            disabled={disabled || readOnly}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border ${design.border} ${design.iconColor} ${design.hoverText} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                            aria-label={messages.closePicker}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <button
                    ref={colorAreaRef}
                    type="button"
                    onPointerDown={handler.handleColorAreaPointer}
                    onPointerMove={handler.handleColorAreaPointerMove}
                    onKeyDown={handler.handleColorAreaKeyDown}
                    className={`relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${design.previewBorder}`}
                    style={{
                        backgroundColor: state.hueColor,
                        backgroundImage:
                            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
                    }}
                    aria-label={
                        messages.colorAreaValue?.(
                            state.hsvColor.saturation,
                            state.hsvColor.value,
                        ) ?? messages.colorArea
                    }
                    aria-description={messages.colorAreaInstructions}
                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown PageUp PageDown Home End"
                    disabled={disabled || readOnly}
                >
                    <span
                        aria-hidden="true"
                        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
                        style={{
                            left: `${state.hsvColor.saturation}%`,
                            top: `${100 - state.hsvColor.value}%`,
                        }}
                    />
                </button>

                <div className="mt-3 flex items-center gap-3">
                    <div
                        className={`h-7 w-7 shrink-0 rounded-lg border ${design.previewBorder}`}
                        style={{ backgroundColor: state.selectedHex }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={359}
                        step={1}
                        value={state.hsvColor.hue}
                        onChange={handler.handleHueChange}
                        disabled={disabled || readOnly}
                        className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#f8fafc,#22c55e,#13ecd6,#3f40ad,#ec4899,#ef4444)] accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label={messages.hue}
                    />
                </div>
            </div>
        ) : null

    return (
        <div
            ref={rootRef}
            onBlurCapture={handleFieldBlur}
            className={`group relative ${className}`}
        >
            {hasLabel && (
                <label
                    id={labelId}
                    htmlFor={fieldId}
                    className={`mb-1.5 block text-sm font-medium ${design.labelText}`}
                >
                    {label}
                </label>
            )}

            <input
                ref={validationInputRef}
                name={name}
                value={state.safeValue}
                onChange={() => undefined}
                onInvalid={handler.handleInvalid}
                required={required && error === undefined}
                disabled={disabled}
                readOnly={readOnly}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 h-px w-px -translate-y-1/2 opacity-0"
            />

            <div
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                    state.hasError
                        ? `${design.errorBorder} focus-within:ring-2 ${design.errorRing}`
                        : `${design.border} focus-within:ring-2 ${design.focusRing} ${design.focusBorder}`
                } ${design.bg} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                    {state.hasError ? (
                        <AlertCircle
                            className={`h-5 w-5 ${design.errorText}`}
                        />
                    ) : (
                        <span
                            className={`flex items-center ${design.iconColor} ${design.iconFocus} transition-colors [&>svg]:h-5 [&>svg]:w-5`}
                        >
                            {icon || <Palette className="h-5 w-5" />}
                        </span>
                    )}
                </div>

                <button
                    id={fieldId}
                    ref={setTriggerRef}
                    type="button"
                    onClick={handler.togglePicker}
                    disabled={disabled}
                    {...ariaProps}
                    aria-disabled={
                        disabled || ariaProps['aria-disabled'] || undefined
                    }
                    aria-readonly={
                        readOnly || ariaProps['aria-readonly'] || undefined
                    }
                    aria-label={resolvedAriaLabel}
                    aria-labelledby={resolvedLabelledBy}
                    aria-describedby={resolvedDescribedBy}
                    aria-invalid={
                        state.hasError || ariaProps['aria-invalid'] || undefined
                    }
                    aria-errormessage={
                        state.hasError
                            ? errorId
                            : ariaProps['aria-errormessage']
                    }
                    aria-expanded={state.isOpen}
                    aria-haspopup={ariaProps['aria-haspopup'] ?? 'dialog'}
                    className={`h-8 w-11 shrink-0 cursor-pointer rounded-lg border transition-transform motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed ${design.previewBorder}`}
                    style={{ backgroundColor: state.previewColor }}
                />

                {showInput && (
                    <input
                        value={state.draftValue}
                        onChange={handler.handleTextChange}
                        onBlur={handler.handleTextBlur}
                        autoComplete="off"
                        inputMode="text"
                        disabled={disabled}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        aria-invalid={state.hasError}
                        aria-errormessage={state.hasError ? errorId : undefined}
                        aria-required={
                            required && !disabled && error === undefined
                                ? true
                                : undefined
                        }
                        aria-label={resolvedAriaLabel}
                        aria-labelledby={resolvedLabelledBy}
                        aria-describedby={resolvedDescribedBy}
                        className={`min-w-0 flex-1 bg-transparent text-sm font-semibold focus-visible:outline-none ${design.text} ${design.placeholder} disabled:cursor-not-allowed`}
                    />
                )}

                {!showInput && (
                    <span
                        className={`min-w-0 flex-1 truncate text-sm font-semibold ${design.text}`}
                    >
                        {state.safeValue || placeholder}
                    </span>
                )}
            </div>

            {hasDescription && (
                <p
                    id={descriptionId}
                    className={`mt-1 text-xs ${design.descriptionText}`}
                >
                    {description}
                </p>
            )}

            {state.hasError && state.error && (
                <p
                    id={errorId}
                    role="alert"
                    className={`mt-1 text-xs font-semibold ${design.errorText}`}
                >
                    {state.error}
                </p>
            )}

            {typeof document !== 'undefined' && pickerPopup
                ? createPortal(pickerPopup, document.body)
                : null}

            {showPresets && presets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {presets.map((preset) => {
                        const presetColor = preset.toLowerCase()
                        const isActive = activeColor === presetColor

                        return (
                            <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                    handler.handlePresetClick(preset)
                                }
                                disabled={disabled || readOnly}
                                aria-label={messages.presetColor(preset)}
                                aria-pressed={isActive}
                                className={`h-7 w-7 cursor-pointer rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed ${
                                    isActive
                                        ? `ring-2 ring-offset-2 ring-offset-background-dark ${design.presetActiveBorder}`
                                        : design.presetBorder
                                }`}
                                style={{ backgroundColor: preset }}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
