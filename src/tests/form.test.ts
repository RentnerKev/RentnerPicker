import { expect, test } from 'bun:test'
import { getPickerFieldProps, getFieldError, mapFieldError } from '../form.ts'
test('connects a structural field without stringifying unknown validation data', () => {
    const changes: string[] = []
    let blurs = 0
    const field = {
        name: 'example',
        state: {
            value: '',
            meta: {
                isTouched: false,
                errors: [{ code: 4 }, { message: 'Ungültiger Wert' }],
            },
        },
        handleChange: (value: string) => changes.push(value),
        handleBlur: () => {
            blurs += 1
        },
    }
    expect(getFieldError(field)).toBeNull()
    expect(getFieldError(field, { showErrors: 'always' })).toBe(
        'Ungültiger Wert',
    )
    expect(getFieldError(field, { showErrors: 'never' })).toBeNull()
    expect(mapFieldError({ code: 'hidden' })).toBeNull()
    expect(
        getFieldError(field, {
            showErrors: 'always',
            mapError: () => 'Überschrieben',
        }),
    ).toBe('Überschrieben')
    const props = getPickerFieldProps(field)
    expect(props.name).toBe('example')
    expect(props.value).toBe('')
    props.onValueChange('next')
    props.onBlur()
    expect(changes).toEqual(['next'])
    expect(blurs).toBe(1)
})
