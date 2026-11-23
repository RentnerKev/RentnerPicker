import { createContext, useContext, useMemo } from 'react'
import {
    pickerMessageCatalog,
    resolvePickerMessages,
} from '../../../lib/Messages/i18n.ts'
import type {
    PickerLocale,
    PickerMessages,
} from '../../../lib/Messages/Types/i18n.types.ts'
import type {
    PickerDefaults,
    PickerProviderProps,
    PickerProviderLogicResult,
} from '../Types/picker.types.ts'

const EMPTY_PICKER_DEFAULTS: PickerDefaults = Object.freeze({})

export const PickerContext = createContext<PickerDefaults>(
    EMPTY_PICKER_DEFAULTS,
)

function mergeOptionalRecord<T extends object>(
    parent: T | undefined,
    local: T | undefined,
): T | undefined {
    if (!parent && !local) return undefined
    if (!local) return parent
    if (!parent) return { ...local }
    return { ...parent, ...local }
}

export function usePickerProviderLogic({
    locale,
    messages,
    customDesign,
    controlSize,
    classNames,
    portalContainer,
    portalClassName,
    portalZIndex,
}: Omit<PickerProviderProps, 'children'>): PickerProviderLogicResult {
    const parent = useContext(PickerContext)
    const cnRoot = classNames?.root
    const cnLabel = classNames?.label
    const cnControl = classNames?.control
    const cnLeading = classNames?.leading
    const cnInput = classNames?.input
    const cnTrailing = classNames?.trailing
    const cnDescription = classNames?.description
    const cnError = classNames?.error
    const cnPopup = classNames?.popup
    const cnPresets = classNames?.presets
    const cnPreset = classNames?.preset
    const hasClassNames = classNames !== undefined
    const mergedClassNames = useMemo(
        () => mergeOptionalRecord(parent.classNames, classNames),
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- stabilize on field values
        [
            parent.classNames,
            hasClassNames,
            cnRoot,
            cnLabel,
            cnControl,
            cnLeading,
            cnInput,
            cnTrailing,
            cnDescription,
            cnError,
            cnPopup,
            cnPresets,
            cnPreset,
        ],
    )
    const msgRequired = messages?.required
    const msgInvalidColor = messages?.invalidColor
    const msgEyeDropper = messages?.eyeDropper
    const msgClosePicker = messages?.closePicker
    const msgColorArea = messages?.colorArea
    const msgColorAreaInstructions = messages?.colorAreaInstructions
    const msgColorAreaValue = messages?.colorAreaValue
    const msgOpacity = messages?.opacity
    const msgHue = messages?.hue
    const msgSaturation = messages?.saturation
    const msgBrightness = messages?.brightness
    const msgSelectColor = messages?.selectColor
    const msgPresetColor = messages?.presetColor
    const hasMessages = messages !== undefined
    const mergedMessages = useMemo(
        () => mergeOptionalRecord(parent.messages, messages),
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- stabilize on field values
        [
            parent.messages,
            hasMessages,
            msgRequired,
            msgInvalidColor,
            msgEyeDropper,
            msgClosePicker,
            msgColorArea,
            msgColorAreaInstructions,
            msgColorAreaValue,
            msgOpacity,
            msgHue,
            msgSaturation,
            msgBrightness,
            msgSelectColor,
            msgPresetColor,
        ],
    )
    const dBg = customDesign?.bg
    const dBorder = customDesign?.border
    const dText = customDesign?.text
    const dPlaceholder = customDesign?.placeholder
    const dFocusRing = customDesign?.focusRing
    const dFocusBorder = customDesign?.focusBorder
    const dErrorBorder = customDesign?.errorBorder
    const dErrorRing = customDesign?.errorRing
    const dErrorText = customDesign?.errorText
    const dLabelText = customDesign?.labelText
    const dDescriptionText = customDesign?.descriptionText
    const dIconColor = customDesign?.iconColor
    const dIconFocus = customDesign?.iconFocus
    const dHoverText = customDesign?.hoverText
    const dPreviewBorder = customDesign?.previewBorder
    const dPresetBorder = customDesign?.presetBorder
    const dPresetActiveBorder = customDesign?.presetActiveBorder
    const hasDesign = customDesign !== undefined
    const mergedDesign = useMemo(
        () => mergeOptionalRecord(parent.customDesign, customDesign),
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- stabilize on field values
        [
            parent.customDesign,
            hasDesign,
            dBg,
            dBorder,
            dText,
            dPlaceholder,
            dFocusRing,
            dFocusBorder,
            dErrorBorder,
            dErrorRing,
            dErrorText,
            dLabelText,
            dDescriptionText,
            dIconColor,
            dIconFocus,
            dHoverText,
            dPreviewBorder,
            dPresetBorder,
            dPresetActiveBorder,
        ],
    )
    const resolvedControlSize = controlSize ?? parent.controlSize
    const resolvedPortalContainer =
        portalContainer === undefined ? parent.portalContainer : portalContainer
    const resolvedPortalClassName = portalClassName ?? parent.portalClassName
    const resolvedPortalZIndex = portalZIndex ?? parent.portalZIndex
    const resolvedLocale = locale ?? parent.locale

    const value = useMemo<PickerDefaults>(
        () => ({
            controlSize: resolvedControlSize,
            classNames: mergedClassNames,
            portalContainer: resolvedPortalContainer,
            portalClassName: resolvedPortalClassName,
            portalZIndex: resolvedPortalZIndex,
            locale: resolvedLocale,
            messages: mergedMessages,
            customDesign: mergedDesign,
        }),
        [
            resolvedControlSize,
            mergedClassNames,
            resolvedPortalContainer,
            resolvedPortalClassName,
            resolvedPortalZIndex,
            resolvedLocale,
            mergedMessages,
            mergedDesign,
        ],
    )

    return { state: { contextValue: value } }
}

export function usePickerDefaults(): PickerDefaults {
    return useContext(PickerContext)
}

export function usePickerMessages(
    locale?: PickerLocale,
    messages?: Partial<PickerMessages>,
): PickerMessages {
    const defaults = usePickerDefaults()
    const resolvedLocale = locale ?? defaults.locale ?? 'de'
    const inheritedMessages = defaults.messages

    return useMemo(() => {
        if (!inheritedMessages && !messages) {
            return pickerMessageCatalog[resolvedLocale]
        }
        if (!messages) {
            return resolvePickerMessages(resolvedLocale, inheritedMessages)
        }
        if (!inheritedMessages) {
            return resolvePickerMessages(resolvedLocale, messages)
        }
        return resolvePickerMessages(resolvedLocale, {
            ...inheritedMessages,
            ...messages,
        })
    }, [resolvedLocale, inheritedMessages, messages])
}
