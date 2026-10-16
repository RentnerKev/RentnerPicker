import {
    CustomColorPicker,
    hexToRgb,
    isValidColor,
    normalizeColor,
} from '../../index.ts'
import type {
    ColorValidityChangeHandler,
    CustomColorPickerProps,
    RgbColor,
} from '../../index.ts'

const rgb: RgbColor | null = hexToRgb('#13ecd6')
const normalizedColor: string | null = normalizeColor('13ecd6')
const isValid: boolean = isValidColor('#13ecd6')
const handleValidityChange: ColorValidityChangeHandler = (nextIsValid) => {
    const typedValidity: boolean = nextIsValid
    void typedValidity
}

const props: CustomColorPickerProps = {
    value: normalizedColor ?? '',
    onValueChange: () => undefined,
    onValidityChange: handleValidityChange,
}

export function TypedPickerApi() {
    return <CustomColorPicker {...props} />
}

void rgb
void isValid

// @ts-expect-error Validity callbacks receive a boolean.
const invalidHandler: ColorValidityChangeHandler = (value: string) => value
void invalidHandler

import { getPickerFieldProps } from '../../form.ts'
const colorField = {
    name: 'color',
    state: {
        value: '#abcdef',
        meta: { errors: [] as unknown[], isTouched: true },
    },
    handleChange: (_value: string) => undefined,
    handleBlur: () => undefined,
}
const pickerAdapterProps = getPickerFieldProps(colorField, {
    onValidityChange: (_valid: boolean) => undefined,
})
const pickerAdapterUsage = (
    <CustomColorPicker
        {...pickerAdapterProps}
        controlSize="lg"
        classNames={{
            root: 'w-full',
            label: 'text-sm',
            control: 'border',
            leading: 'pl-2',
            trailing: 'pr-2',
            popup: 'p-2',
        }}
        portalContainer={null}
        portalZIndex={10000}
    />
)
void pickerAdapterUsage
