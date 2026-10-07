import { createContext, useContext, useMemo } from 'react'
import { resolvePickerMessages } from '../../../lib/Messages/i18n.js'
import type {
    PickerLocale,
    PickerMessages,
} from '../../../lib/Messages/Types/i18n.types.js'
import type {
    PickerDefaults,
    PickerProviderProps,
    PickerProviderLogicResult,
} from '../Types/picker.types.js'
export const PickerContext = createContext<PickerDefaults>({})

export function usePickerProviderLogic({
    locale,
    messages,
    customDesign,
}: Omit<PickerProviderProps, 'children'>): PickerProviderLogicResult {
    const parent = useContext(PickerContext)
    const value = useMemo<PickerDefaults>(
        () => ({
            locale: locale ?? parent.locale,
            messages: { ...parent.messages, ...messages },
            customDesign: { ...parent.customDesign, ...customDesign },
        }),
        [parent, locale, messages, customDesign],
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
