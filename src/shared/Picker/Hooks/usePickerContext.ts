import { createContext, useContext, useMemo } from 'react'
import { resolvePickerMessages } from '../../../lib/Messages/i18n.ts'
import type {
    PickerLocale,
    PickerMessages,
} from '../../../lib/Messages/Types/i18n.types.ts'
import type {
    PickerDefaults,
    PickerProviderProps,
    PickerProviderLogicResult,
} from '../Types/picker.types.ts'
export const PickerContext = createContext<PickerDefaults>({})

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
    const value = useMemo<PickerDefaults>(
        () => ({
            controlSize: controlSize ?? parent.controlSize,
            classNames: { ...parent.classNames, ...classNames },
            portalContainer:
                portalContainer === undefined
                    ? parent.portalContainer
                    : portalContainer,
            portalClassName: portalClassName ?? parent.portalClassName,
            portalZIndex: portalZIndex ?? parent.portalZIndex,
            locale: locale ?? parent.locale,
            messages: { ...parent.messages, ...messages },
            customDesign: { ...parent.customDesign, ...customDesign },
        }),
        [
            parent,
            locale,
            messages,
            customDesign,
            controlSize,
            classNames,
            portalContainer,
            portalClassName,
            portalZIndex,
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

    return resolvePickerMessages(locale ?? defaults.locale, {
        ...defaults.messages,
        ...messages,
    })
}
