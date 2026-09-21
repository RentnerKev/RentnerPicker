import { AlertCircle, Palette, Pipette, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import useCustomColorPickerLogic from '../Hooks/useCustomColorPickerLogic.js'
import { resolvePickerMessages } from '../i18n.js'
import type { CustomColorPickerProps } from '../types.js'

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
    required = false,
    disabled = false,
    placeholder = '#13ecd6',
    format = 'hex',
    presets = defaultPresets,
    showInput = true,
    showPresets = true,
    icon,
    className = 'w-full',
    customDesign,
    locale = 'de',
    messages: providedMessages,
}: CustomColorPickerProps) {
    const messages = resolvePickerMessages(locale, providedMessages)
    const {
        ref: { popupRef, rootRef, validationInputRef },
        handler,
        state,
    } = useCustomColorPickerLogic({
        value,
        onValueChange,
        required,
        format,
        messages,
    })

    const design = {
        bg: 'bg-input-dark',
        border: 'border-border-dark',
        text: 'text-white',
        placeholder: 'placeholder-gray-600',
        focusRing: 'focus-within:ring-primary/50',
        focusBorder: 'focus-within:border-primary',
        errorBorder: 'border-red-500',
        errorRing: 'focus-within:ring-red-500/50',
        errorText: 'text-red-500',
        iconColor: 'text-gray-500',
        iconFocus: 'group-focus-within:text-primary',
        previewBorder: 'border-border-dark',
        presetBorder: 'border-border-dark',
        presetActiveBorder: 'ring-primary border-primary',
        ...customDesign,
    }

    const activeColor = state.selectedHex.toLowerCase()
    const pickerPopup =
        state.isOpen && !disabled ? (
            <div
                ref={popupRef}
                role="dialog"
                aria-modal="false"
                className={`fixed z-[9999] rounded-xl border p-3 shadow-2xl ${design.bg} ${design.border}`}
                style={{
                    left: `${state.pickerPosition.left}px`,
                    top: `${state.pickerPosition.top}px`,
                    width: `${state.pickerPosition.width}px`,
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
                                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border ${design.border} ${design.iconColor} transition-colors hover:${design.text}`}
                                aria-label={messages.eyeDropper}
                            >
                                <Pipette className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handler.togglePicker}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border ${design.border} ${design.iconColor} transition-colors hover:${design.text}`}
                            aria-label={messages.closePicker}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onPointerDown={handler.handleColorAreaPointer}
                    onPointerMove={(event) => {
                        if (event.buttons === 1) {
                            handler.handleColorAreaPointer(event)
                        }
                    }}
                    className={`relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border ${design.previewBorder}`}
                    style={{
                        backgroundColor: state.hueColor,
                        backgroundImage:
                            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
                    }}
                    aria-label={messages.colorArea}
                >
                    <span
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
                        value={state.hsvColor.hue}
                        onChange={handler.handleHueChange}
                        className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#f8fafc,#22c55e,#13ecd6,#3f40ad,#ec4899,#ef4444)] accent-primary"
                        aria-label={messages.hue}
                    />
                </div>
            </div>
        ) : null

    return (
        <div ref={rootRef} className={`group relative ${className}`}>
            <input
                ref={validationInputRef}
                name={name}
                value={state.safeValue}
                onChange={() => undefined}
                onInvalid={handler.handleInvalid}
                required={required}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 h-px w-px -translate-y-1/2 opacity-0"
            />

            <div
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 transition-all ${
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
                    id={id}
                    type="button"
                    onClick={handler.togglePicker}
                    disabled={disabled}
                    aria-label={messages.selectColor}
                    aria-expanded={state.isOpen}
                    className={`h-8 w-11 shrink-0 cursor-pointer rounded-lg border transition-transform active:scale-95 disabled:cursor-not-allowed ${design.previewBorder}`}
                    style={{ backgroundColor: state.previewColor }}
                />

                {showInput && (
                    <input
                        value={state.draftValue}
                        onChange={handler.handleTextChange}
                        onBlur={handler.handleTextBlur}
                        disabled={disabled}
                        placeholder={placeholder}
                        aria-invalid={state.hasError}
                        className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${design.text} ${design.placeholder} disabled:cursor-not-allowed`}
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

            {state.hasError && state.error && (
                <p className={`mt-1 text-xs font-semibold ${design.errorText}`}>
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
                                disabled={disabled}
                                aria-label={messages.presetColor(preset)}
                                className={`h-7 w-7 cursor-pointer rounded-lg border transition-all disabled:cursor-not-allowed ${
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
