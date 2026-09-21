export type PickerLocale = 'de' | 'en'

export interface PickerMessages {
    required: string
    invalidColor: string
    eyeDropper: string
    closePicker: string
    colorArea: string
    hue: string
    selectColor: string
    presetColor: (color: string) => string
}

const germanMessages: PickerMessages = {
    required: 'Dieses Feld ist erforderlich',
    invalidColor: 'Bitte eine gültige HEX- oder RGB-Farbe angeben',
    eyeDropper: 'Farbe mit Pipette auswählen',
    closePicker: 'Picker schließen',
    colorArea: 'Farbfläche',
    hue: 'Farbton',
    selectColor: 'Farbe auswählen',
    presetColor: (color) => `Farbe ${color} auswählen`,
}

const englishMessages: PickerMessages = {
    required: 'This field is required',
    invalidColor: 'Please enter a valid HEX or RGB color',
    eyeDropper: 'Select color with eyedropper',
    closePicker: 'Close picker',
    colorArea: 'Color area',
    hue: 'Hue',
    selectColor: 'Select color',
    presetColor: (color) => `Select color ${color}`,
}

export const pickerMessageCatalog: Record<PickerLocale, PickerMessages> = {
    de: germanMessages,
    en: englishMessages,
}

export function resolvePickerMessages(
    locale: PickerLocale = 'de',
    messages?: Partial<PickerMessages>,
): PickerMessages {
    return {
        ...pickerMessageCatalog[locale],
        ...messages,
    }
}
