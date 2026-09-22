import {
    CustomColorPicker,
    hexToRgb,
    isValidColor,
    normalizeColor,
} from '../src/index.js'
import type {
    ColorValidityChangeHandler,
    CustomColorPickerProps,
    RgbColor,
} from '../src/index.js'

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
