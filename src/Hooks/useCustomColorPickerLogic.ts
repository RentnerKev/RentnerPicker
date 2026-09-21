import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, InvalidEvent, PointerEvent } from 'react'
import type { ColorFormat, CustomColorPickerProps } from '../types.js'

const hexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const rgbRegex =
    /^rgb\(\s*(25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(25[0-5]|2[0-4]\d|1?\d?\d)\s*,\s*(25[0-5]|2[0-4]\d|1?\d?\d)\s*\)$/i

interface RgbColor {
    red: number
    green: number
    blue: number
}

interface HsvColor {
    hue: number
    saturation: number
    value: number
}

interface PickerPosition {
    top: number
    left: number
    width: number
}

interface EyeDropperConstructor {
    new (): {
        open: () => Promise<{ sRGBHex: string }>
    }
}

interface EyeDropperWindow extends Window {
    EyeDropper?: EyeDropperConstructor
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function expandShortHex(value: string) {
    if (!/^#[0-9a-f]{3}$/i.test(value)) {
        return value
    }

    return `#${value
        .slice(1)
        .split('')
        .map((char) => `${char}${char}`)
        .join('')}`
}

function normalizeHex(value: string) {
    const trimmedValue = value.trim()
    const nextValue = trimmedValue.startsWith('#')
        ? trimmedValue
        : `#${trimmedValue}`

    return expandShortHex(nextValue).toLowerCase()
}

function rgbToHexValue({ red, green, blue }: RgbColor) {
    return `#${[red, green, blue]
        .map((part) =>
            clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0'),
        )
        .join('')}`
}

function hexToRgb(value: string): RgbColor | null {
    const normalizedHex = normalizeHex(value)

    if (!hexRegex.test(normalizedHex)) {
        return null
    }

    return {
        red: parseInt(normalizedHex.slice(1, 3), 16),
        green: parseInt(normalizedHex.slice(3, 5), 16),
        blue: parseInt(normalizedHex.slice(5, 7), 16),
    }
}

function parseRgb(value: string): RgbColor | null {
    const match = value.match(rgbRegex)

    if (!match) {
        return null
    }

    return {
        red: Number(match[1]),
        green: Number(match[2]),
        blue: Number(match[3]),
    }
}

function rgbStringToHex(value: string) {
    const rgb = parseRgb(value)

    return rgb ? rgbToHexValue(rgb) : value
}

function rgbToHsv({ red, green, blue }: RgbColor): HsvColor {
    const normalizedRed = red / 255
    const normalizedGreen = green / 255
    const normalizedBlue = blue / 255
    const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue)
    const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue)
    const delta = max - min

    let hue = 0

    if (delta !== 0) {
        if (max === normalizedRed) {
            hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6)
        } else if (max === normalizedGreen) {
            hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2)
        } else {
            hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4)
        }
    }

    return {
        hue: Math.round(hue < 0 ? hue + 360 : hue),
        saturation: max === 0 ? 0 : Math.round((delta / max) * 100),
        value: Math.round(max * 100),
    }
}

function hsvToRgb({ hue, saturation, value }: HsvColor): RgbColor {
    const normalizedSaturation = saturation / 100
    const normalizedValue = value / 100
    const chroma = normalizedValue * normalizedSaturation
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
    const match = normalizedValue - chroma

    let red = 0
    let green = 0
    let blue = 0

    if (hue < 60) {
        red = chroma
        green = x
    } else if (hue < 120) {
        red = x
        green = chroma
    } else if (hue < 180) {
        green = chroma
        blue = x
    } else if (hue < 240) {
        green = x
        blue = chroma
    } else if (hue < 300) {
        red = x
        blue = chroma
    } else {
        red = chroma
        blue = x
    }

    return {
        red: Math.round((red + match) * 255),
        green: Math.round((green + match) * 255),
        blue: Math.round((blue + match) * 255),
    }
}

function toPickerHex(value: string) {
    if (hexRegex.test(value.trim())) {
        return normalizeHex(value)
    }

    if (rgbRegex.test(value.trim())) {
        return rgbStringToHex(value)
    }

    return '#13ecd6'
}

function hexToDisplayValue(value: string, format: ColorFormat) {
    const rgb = hexToRgb(value)

    if (!rgb) {
        return value
    }

    if (format === 'rgb') {
        return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`
    }

    return normalizeHex(value)
}

function getColorError(value: string, required?: boolean) {
    const trimmedValue = value.trim()

    if (required && !trimmedValue) {
        return 'Dieses Feld ist erforderlich'
    }

    if (!trimmedValue) {
        return null
    }

    if (!hexRegex.test(trimmedValue) && !rgbRegex.test(trimmedValue)) {
        return 'Bitte eine gültige HEX- oder RGB-Farbe angeben'
    }

    return null
}

function getHsvFromValue(value: string): HsvColor {
    const rgb = hexToRgb(toPickerHex(value))

    if (!rgb) {
        return { hue: 176, saturation: 92, value: 93 }
    }

    return rgbToHsv(rgb)
}

export default function useCustomColorPickerLogic({
    value,
    onValueChange,
    required,
    format = 'hex',
}: Pick<
    CustomColorPickerProps,
    'value' | 'onValueChange' | 'required' | 'format'
>) {
    const safeValue = value !== undefined && value !== null ? String(value) : ''
    const [draftValue, setDraftValue] = useState(safeValue)
    const [isTouched, setIsTouched] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false)
    const [pickerPosition, setPickerPosition] = useState<PickerPosition>({
        top: 0,
        left: 0,
        width: 288,
    })
    const [hsvColor, setHsvColor] = useState<HsvColor>(() =>
        getHsvFromValue(safeValue),
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const error = getColorError(draftValue, required)
    const hasError = isTouched && error !== null

    const selectedHex = useMemo(
        () => rgbToHexValue(hsvToRgb(hsvColor)),
        [hsvColor],
    )
    const hueColor = useMemo(
        () =>
            rgbToHexValue(
                hsvToRgb({ hue: hsvColor.hue, saturation: 100, value: 100 }),
            ),
        [hsvColor.hue],
    )
    const previewColor = error
        ? toPickerHex(safeValue)
        : toPickerHex(draftValue || selectedHex)

    useEffect(() => {
        const nextHsvColor = getHsvFromValue(safeValue)

        setDraftValue(safeValue)
        setHsvColor(nextHsvColor)
    }, [safeValue])

    useEffect(() => {
        setIsEyeDropperSupported('EyeDropper' in window)
    }, [])

    useEffect(() => {
        validationInputRef.current?.setCustomValidity(error || '')
    }, [error])

    useEffect(() => {
        const input = validationInputRef.current
        const form = input?.form

        if (!input || !form) {
            return
        }

        const currentInput = input

        function handleFormSubmit() {
            if (currentInput.validity.valid) {
                setIsTouched(false)
            }
        }

        form.addEventListener('submit', handleFormSubmit)

        return () => {
            form.removeEventListener('submit', handleFormSubmit)
        }
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function updatePickerPosition() {
            const root = rootRef.current

            if (!root) {
                return
            }

            const rect = root.getBoundingClientRect()
            const width = Math.max(rect.width, 288)
            const left = clamp(rect.left, 8, window.innerWidth - width - 8)
            const top = rect.bottom + 8

            setPickerPosition({ top, left, width })
        }

        function handlePointerDown(event: globalThis.PointerEvent) {
            const target = event.target as Node

            if (
                !rootRef.current?.contains(target) &&
                !popupRef.current?.contains(target)
            ) {
                setIsOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        updatePickerPosition()
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('resize', updatePickerPosition)
        window.addEventListener('scroll', updatePickerPosition, true)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('resize', updatePickerPosition)
            window.removeEventListener('scroll', updatePickerPosition, true)
        }
    }, [isOpen])

    function commitHex(
        nextHex: string,
        nextHsvColor = getHsvFromValue(nextHex),
    ) {
        const nextValue = hexToDisplayValue(nextHex, format)
        setHsvColor(nextHsvColor)
        setDraftValue(nextValue)
        onValueChange(nextValue)
    }

    function commitColor(nextValue: string) {
        const nextError = getColorError(nextValue, required)
        setDraftValue(nextValue)

        if (nextError) {
            setIsTouched(true)
            return
        }

        if (!nextValue.trim()) {
            onValueChange('')
            return
        }

        commitHex(toPickerHex(nextValue))
    }

    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        setDraftValue(event.target.value)
    }

    function handleTextBlur() {
        setIsTouched(true)
        commitColor(draftValue)
    }

    function handleColorAreaPointer(event: PointerEvent<HTMLButtonElement>) {
        const rect = event.currentTarget.getBoundingClientRect()
        const nextSaturation = clamp(
            ((event.clientX - rect.left) / rect.width) * 100,
            0,
            100,
        )
        const nextValue = clamp(
            100 - ((event.clientY - rect.top) / rect.height) * 100,
            0,
            100,
        )
        const nextHsvColor = {
            ...hsvColor,
            saturation: Math.round(nextSaturation),
            value: Math.round(nextValue),
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        commitHex(rgbToHexValue(hsvToRgb(nextHsvColor)), nextHsvColor)
    }

    function handleHueChange(event: ChangeEvent<HTMLInputElement>) {
        const nextHsvColor = {
            ...hsvColor,
            hue: Number(event.target.value),
        }

        commitHex(rgbToHexValue(hsvToRgb(nextHsvColor)), nextHsvColor)
    }

    function handlePresetClick(nextValue: string) {
        commitColor(nextValue)
        setIsOpen(false)
    }

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
    }

    async function handleEyeDropperClick() {
        const EyeDropper = (window as EyeDropperWindow).EyeDropper

        if (!EyeDropper) {
            return
        }

        try {
            const result = await new EyeDropper().open()
            commitHex(result.sRGBHex)
            setIsOpen(false)
        } catch {
            return
        }
    }

    function togglePicker() {
        if (!isOpen) {
            setHsvColor(getHsvFromValue(draftValue || safeValue))
        }

        setIsOpen((current) => !current)
    }

    return {
        ref: {
            popupRef,
            rootRef,
            validationInputRef,
        },
        handler: {
            handleColorAreaPointer,
            handleEyeDropperClick,
            handleHueChange,
            handleInvalid,
            handlePresetClick,
            handleTextBlur,
            handleTextChange,
            togglePicker,
        },
        state: {
            draftValue,
            error,
            hasError,
            hueColor,
            hsvColor,
            isEyeDropperSupported,
            isOpen,
            pickerPosition,
            previewColor,
            safeValue,
            selectedHex,
        },
    }
}
