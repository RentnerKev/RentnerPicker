export interface FieldAdapter<T> {
    name: string
    state: {
        value: T
        meta?: { errors?: readonly unknown[]; isTouched?: boolean }
    }
    handleChange: (value: T) => void
    handleBlur: () => void
}
export interface FieldAdapterOptions {
    showErrors?: 'touched' | 'always' | 'never'
    mapError?: (error: unknown) => string | null | undefined
}
export function mapFieldError(error: unknown): string | null {
    if (typeof error === 'string') return error || null
    if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
    )
        return error.message || null
    return null
}
export function getFieldError<T>(
    field: FieldAdapter<T>,
    options?: FieldAdapterOptions,
): string | null {
    const showErrors = options?.showErrors
    if (
        showErrors === 'never' ||
        (showErrors !== 'always' && !field.state.meta?.isTouched)
    )
        return null
    const errors = field.state.meta?.errors
    if (!errors?.length) return null
    const mapper = options?.mapError ?? mapFieldError
    for (let index = 0; index < errors.length; index++) {
        const message = mapper(errors[index])
        if (message) return message
    }
    return null
}
export interface PickerFieldAdapterOptions extends FieldAdapterOptions {
    onValidityChange?: (isValid: boolean) => void
}
/** Draft validity stays separate: invalid text does not replace the committed field value. */
export function getPickerFieldProps(
    field: FieldAdapter<string>,
    options?: PickerFieldAdapterOptions,
) {
    const error = getFieldError(field, options)
    return {
        name: field.name,
        value: field.state.value,
        onValueChange: (value: string) => field.handleChange(value),
        onBlur: () => field.handleBlur(),
        error: error ?? undefined,
        onValidityChange: options?.onValidityChange,
    }
}
