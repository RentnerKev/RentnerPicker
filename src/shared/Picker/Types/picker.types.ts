import type {
    AriaAttributes,
    FocusEventHandler,
    ReactNode,
    Ref,
    RefObject,
    RefCallback,
    ChangeEvent,
    KeyboardEvent,
    PointerEvent,
    InvalidEvent,
    Dispatch,
    SetStateAction,
} from 'react'
import type { HsvColor } from '../../../lib/Color/Types/color.types.js'
import type {
    PickerLocale,
    PickerMessages,
} from '../../../lib/Messages/Types/i18n.types.js'

export type ColorFormat = 'hex' | 'rgb'

export interface RgbColor {
    red: number
    green: number
    blue: number
}

export type ColorValidityChangeHandler = (isValid: boolean) => void

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
    labelText?: string
    descriptionText?: string
    iconColor?: string
    iconFocus?: string
    hoverText?: string
    previewBorder?: string
    presetBorder?: string
    presetActiveBorder?: string
}

export interface CustomColorPickerProps extends AriaAttributes {
    id?: string
    name?: string
    value: string
    onValueChange: (value: string) => void
    onValidityChange?: ColorValidityChangeHandler
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    onBlur?: FocusEventHandler<HTMLElement>
    label?: ReactNode
    description?: ReactNode
    error?: string | null
    triggerRef?: Ref<HTMLButtonElement>
    placeholder?: string
    format?: ColorFormat
    presets?: string[]
    showInput?: boolean
    showPresets?: boolean
    icon?: ReactNode
    className?: string
    customDesign?: CustomColorPickerDesign
    locale?: PickerLocale
    messages?: Partial<PickerMessages>
}

export type {
    PickerLocale,
    PickerMessages,
} from '../../../lib/Messages/i18n.js'

export interface PickerProviderProps {
    children: ReactNode
    locale?: PickerLocale
    messages?: Partial<PickerMessages>
    customDesign?: CustomColorPickerDesign
}

export type PickerDefaults = Omit<PickerProviderProps, 'children'>

export interface PickerPosition {
    top: number
    left: number
    width: number
    maxHeight: number
}

export interface UsePickerOverlayOptions {
    initialFocusRef: RefObject<HTMLElement | null>
    isOpen: boolean
    onClose: (restoreFocus?: boolean) => void
    onGeometryChange?: () => void
}

export interface PickerOverlayResult {
    refs: {
        popupRef: RefObject<HTMLDivElement | null>
        rootRef: RefObject<HTMLDivElement | null>
    }
    state: { pickerPosition: PickerPosition }
    handler: { updatePickerPosition: () => void }
    setter: { setPickerPosition: Dispatch<SetStateAction<PickerPosition>> }
}

export interface CustomColorPickerLogicResult {
    refs: PickerOverlayResult['refs'] & {
        colorAreaRef: RefObject<HTMLButtonElement | null>
        triggerRef: RefObject<HTMLButtonElement | null>
        setTriggerRef: RefCallback<HTMLButtonElement>
        setValidationInputRef: (node: HTMLInputElement | null) => void
    }
    state: {
        fieldId: string
        hasLabel: boolean
        hasDescription: boolean
        labelId: string | undefined
        descriptionId: string | undefined
        errorId: string
        messages: PickerMessages
        resolvedLabelledBy: string | undefined
        resolvedDescribedBy: string | undefined
        resolvedAriaLabel: string | undefined
        design: CustomColorPickerDesign
        presetEntries: Array<{ preset: string; isActive: boolean }>
        ariaProps: AriaAttributes
        draftValue: string
        error: string | null
        hasError: boolean
        hueColor: string
        hsvColor: HsvColor
        isEyeDropperSupported: boolean
        isOpen: boolean
        isValid: boolean
        pickerPosition: PickerPosition
        previewColor: string
        safeValue: string
        selectedHex: string
    }
    handler: {
        handleFieldBlur: FocusEventHandler<HTMLElement>
        handleClosePicker: () => void
        handleBrightnessChange: (event: ChangeEvent<HTMLInputElement>) => void
        handleColorAreaKeyDown: (
            event: KeyboardEvent<HTMLButtonElement>,
        ) => void
        handleColorAreaPointer: (event: PointerEvent<HTMLButtonElement>) => void
        handleColorAreaPointerMove: (
            event: PointerEvent<HTMLButtonElement>,
        ) => void
        handleEyeDropperClick: () => Promise<void>
        handleHueChange: (event: ChangeEvent<HTMLInputElement>) => void
        handleInvalid: (event: InvalidEvent<HTMLInputElement>) => void
        handlePresetClick: (value: string) => void
        handleSaturationChange: (event: ChangeEvent<HTMLInputElement>) => void
        handleTextBlur: () => void
        handleTextChange: (event: ChangeEvent<HTMLInputElement>) => void
        togglePicker: () => void
    }
    setter: {
        setDraftValue: Dispatch<SetStateAction<string>>
        setHsvColor: Dispatch<SetStateAction<HsvColor>>
        setIsOpen: Dispatch<SetStateAction<boolean>>
        setIsTouched: Dispatch<SetStateAction<boolean>>
    }
}

export interface PickerProviderLogicResult {
    state: { contextValue: PickerDefaults }
}
