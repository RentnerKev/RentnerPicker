import { isValidColor } from './color.js'
import type { PickerMessages } from './i18n.js'

export function getColorError(
    value: string,
    required: boolean | undefined,
    messages: PickerMessages,
) {
    const trimmedValue = value.trim()

    if (required && !trimmedValue) {
        return messages.required
    }

    if (!trimmedValue) {
        return null
    }

    return isValidColor(trimmedValue) ? null : messages.invalidColor
}
