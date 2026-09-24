import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
    resolvePickerMessages,
    type PickerLocale,
    type PickerMessages,
} from './i18n.js'
import type { CustomColorPickerDesign } from './types.js'

export interface PickerProviderProps {
    children: ReactNode
    locale?: PickerLocale
    messages?: Partial<PickerMessages>
    customDesign?: CustomColorPickerDesign
}

type PickerDefaults = Omit<PickerProviderProps, 'children'>

const PickerContext = createContext<PickerDefaults>({})

export function PickerProvider({
    children,
    locale,
    messages,
    customDesign,
}: PickerProviderProps) {
    const parent = useContext(PickerContext)
    const value = useMemo<PickerDefaults>(
        () => ({
            locale: locale ?? parent.locale,
            messages: { ...parent.messages, ...messages },
            customDesign: { ...parent.customDesign, ...customDesign },
        }),
        [parent, locale, messages, customDesign],
    )

    return (
        <PickerContext.Provider value={value}>
            {children}
        </PickerContext.Provider>
    )
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
