export type PickerLocale = 'de' | 'en'

export interface PickerMessages {
    required: string
    invalidColor: string
    eyeDropper: string
    closePicker: string
    colorArea: string
    colorAreaInstructions?: string
    colorAreaValue?: (saturation: number, value: number) => string
    hue: string
    saturation?: string
    brightness?: string
    selectColor: string
    presetColor: (color: string) => string
}
