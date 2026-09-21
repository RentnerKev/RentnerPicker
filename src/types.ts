import type { ReactNode } from 'react'

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
    iconColor?: string
    iconFocus?: string
    previewBorder?: string
    presetBorder?: string
    presetActiveBorder?: string
}

export interface CustomColorPickerProps {
    id?: string
    name?: string
    value: string
    onValueChange: (value: string) => void
    required?: boolean
    disabled?: boolean
    placeholder?: string
    format?: ColorFormat
    presets?: string[]
    showInput?: boolean
    showPresets?: boolean
    icon?: ReactNode
    className?: string
    customDesign?: CustomColorPickerDesign
}
