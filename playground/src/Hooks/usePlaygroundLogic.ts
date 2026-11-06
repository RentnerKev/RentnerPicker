import { useState } from 'react'
import type { FormEvent } from 'react'

import type { PlaygroundLogicResult } from '../Types/playground.types.ts'

export function usePlaygroundLogic(): PlaygroundLogicResult {
    const [alphaColor, setAlphaColor] = useState('rgba(19, 236, 214, 0.5)')
    const [brandColor, setBrandColor] = useState('#13ecd6')
    const [brandBlurred, setBrandBlurred] = useState(false)
    const [accentColor, setAccentColor] = useState('#3f40ad')
    const [rgbColor, setRgbColor] = useState('rgb(34, 197, 94)')
    const [compactColor, setCompactColor] = useState('#ec4899')

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const data = {
            brandColor,
            accentColor,
            rgbColor,
            compactColor,
            alphaColor,
        }
        alert(
            'Farben erfolgreich gespeichert:\n' + JSON.stringify(data, null, 2),
        )
    }

    function handleBrandBlur() {
        setBrandBlurred(true)
    }

    return {
        state: {
            alphaColor,
            brandColor,
            brandBlurred,
            accentColor,
            rgbColor,
            compactColor,
        },
        setter: {
            setAlphaColor,
            setBrandColor,
            setAccentColor,
            setRgbColor,
            setCompactColor,
        },
        handler: { handleSubmit, handleBrandBlur },
    }
}
