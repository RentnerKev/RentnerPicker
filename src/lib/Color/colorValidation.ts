import { isValidColor } from './color.ts'
import type { PickerMessages } from '../Messages/Types/i18n.types.ts'

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
