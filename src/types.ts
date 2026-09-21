import type { AriaAttributes, ReactNode, Ref } from 'react'
import type { PickerLocale, PickerMessages } from './i18n.js'

export type ColorFormat = 'hex' | 'rgb'

export interface CustomColorPickerDesign {
    bg?: string
    border?: string
    text?: string
    placeholder?: string
    focusRing?: string
    focusBorder?: string
    errorBorder?: string
    errorRing?: string
    errorText?: string
    labelText?: string
    descriptionText?: string
    iconColor?: string
    iconFocus?: string
    previewBorder?: string
    presetBorder?: string
    presetActiveBorder?: string
}

export interface CustomColorPickerProps extends AriaAttributes {
    id?: string
    name?: string
    value: string
    onValueChange: (value: string) => void
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    label?: ReactNode
    description?: ReactNode
    error?: string | null
    triggerRef?: Ref<HTMLButtonElement>
    placeholder?: string
    format?: ColorFormat
    presets?: string[]
    showInput?: boolean
    showPresets?: boolean
    icon?: ReactNode
    className?: string
    customDesign?: CustomColorPickerDesign
    locale?: PickerLocale
    messages?: Partial<PickerMessages>
}

export type { PickerLocale, PickerMessages } from './i18n.js'
