import type { PickerLocale, PickerMessages } from './Types/i18n.types.js'
export type { PickerLocale, PickerMessages } from './Types/i18n.types.js'
const germanMessages: PickerMessages = {
    required: 'Dieses Feld ist erforderlich',
    invalidColor: 'Bitte eine gültige HEX- oder RGB-Farbe angeben',
    eyeDropper: 'Farbe mit Pipette auswählen',
    closePicker: 'Picker schließen',
    colorArea: 'Farbfläche',
    colorAreaInstructions:
        'Die Schieberegler ändern Sättigung und Helligkeit. In der Farbfläche ändern Pfeiltasten beide Werte; mit Umschalt oder Bildtasten sind größere Schritte möglich.',
    colorAreaValue: (saturation, value) =>
        `Farbfläche, Sättigung ${saturation} Prozent, Helligkeit ${value} Prozent`,
    hue: 'Farbton',
    saturation: 'Sättigung',
    brightness: 'Helligkeit',
    selectColor: 'Farbe auswählen',
    presetColor: (color) => `Farbe ${color} auswählen`,
}

const englishMessages: PickerMessages = {
    required: 'This field is required',
    invalidColor: 'Please enter a valid HEX or RGB color',
    eyeDropper: 'Select color with eyedropper',
    closePicker: 'Close picker',
    colorArea: 'Color area',
    colorAreaInstructions:
        'Use the sliders to change saturation and brightness. Arrow keys also change both values in the color area; use Shift or Page keys for larger steps.',
    colorAreaValue: (saturation, value) =>
        `Color area, saturation ${saturation} percent, brightness ${value} percent`,
    hue: 'Hue',
    saturation: 'Saturation',
    brightness: 'Brightness',
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
