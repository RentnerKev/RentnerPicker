import { AlertCircle, Palette, Pipette, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import useCustomColorPickerLogic from '../Hooks/useCustomColorPickerLogic.js'
import type { CustomColorPickerProps } from '../Types/picker.types.js'

export function CustomColorPicker(props: CustomColorPickerProps) {
    const { state, handler, refs } = useCustomColorPickerLogic(props)
    const {
        colorAreaRef,
        popupRef,
        rootRef,
        setTriggerRef,
        setValidationInputRef,
    } = refs
    const {
        name,
        required = false,
        disabled = false,
        readOnly = false,
        label,
        description,
        error,
        placeholder = '#13ecd6',
        showInput = true,
        showPresets = true,
        icon,
        className = 'w-full',
    } = props
    const {
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
    } = state
    const pickerPopup =
        state.isOpen && !disabled && !readOnly ? (
            <div
                ref={popupRef}
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Preserve the existing nonmodal portal and hook-owned focus lifecycle; native dialog changes platform behavior.
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
                            Math.round(state.hsvColor.saturation),
                            Math.round(state.hsvColor.value),
                        ) ?? messages.colorArea
                    }
                    // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-description is global in WAI-ARIA 1.3; preserve the existing accessible color-area instructions.
                    aria-description={messages.colorAreaInstructions}
                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown PageUp PageDown Home End"
                    disabled={disabled || readOnly}
                >
                    <span
                        aria-hidden="true"
                        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
                        style={{
                            left: `${Math.round(state.hsvColor.saturation)}%`,
                            top: `${100 - Math.round(state.hsvColor.value)}%`,
                        }}
                    />
                </button>

                <div className="mt-3 grid gap-2">
                    <label className={`grid gap-1 text-xs ${design.text}`}>
                        <span>{messages.saturation}</span>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step="any"
                            value={state.hsvColor.saturation}
                            onChange={handler.handleSaturationChange}
                            disabled={disabled || readOnly}
                            aria-valuetext={`${Math.round(state.hsvColor.saturation)}%`}
                            className="h-2 w-full cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                    </label>
                    <label className={`grid gap-1 text-xs ${design.text}`}>
                        <span>{messages.brightness}</span>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step="any"
                            value={state.hsvColor.value}
                            onChange={handler.handleBrightnessChange}
                            disabled={disabled || readOnly}
                            aria-valuetext={`${Math.round(state.hsvColor.value)}%`}
                            className="h-2 w-full cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                    </label>
                </div>

                <div className="mt-3 flex items-center gap-3">
                    <div
                        className={`h-7 w-7 shrink-0 rounded-lg border ${design.previewBorder}`}
                        style={{ backgroundColor: state.selectedHex }}
                    />
                    <input
                        type="range"
                        min={0}
                        max={360}
                        step="any"
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
            onBlurCapture={handler.handleFieldBlur}
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
                ref={setValidationInputRef}
                type="text"
                value={state.draftValue}
                onChange={() => undefined}
                onInvalid={handler.handleInvalid}
                required={required && error === undefined}
                disabled={disabled}
                readOnly={readOnly}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 h-px w-px -translate-y-1/2 opacity-0"
            />
            <input
                type="hidden"
                name={name}
                value={state.safeValue}
                onChange={() => undefined}
                disabled={disabled}
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
                        disabled ||
                        readOnly ||
                        ariaProps['aria-disabled'] ||
                        undefined
                    }
                    aria-readonly={undefined}
                    aria-label={resolvedAriaLabel}
                    aria-labelledby={resolvedLabelledBy}
                    aria-describedby={resolvedDescribedBy}
                    // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- WAI-ARIA 1.2 retains global aria-invalid (deprecated, not prohibited); preserve the existing field validation contract.
                    aria-invalid={
                        state.hasError || ariaProps['aria-invalid'] || undefined
                    }
                    // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- WAI-ARIA 1.2 retains global aria-errormessage; the field exposes this existing error together with aria-invalid.
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

            {showPresets && presetEntries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {presetEntries.map(({ preset, isActive }) => {
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
