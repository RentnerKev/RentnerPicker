import { useState } from 'react'
import type { FormEvent } from 'react'

export function usePlaygroundLogic() {
    const [brandColor, setBrandColor] = useState('#13ecd6')
    const [brandBlurred, setBrandBlurred] = useState(false)
    const [accentColor, setAccentColor] = useState('#3f40ad')
    const [rgbColor, setRgbColor] = useState('rgb(34, 197, 94)')
    const [compactColor, setCompactColor] = useState('#ec4899')

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const data = { brandColor, accentColor, rgbColor, compactColor }
        alert(
            'Farben erfolgreich gespeichert:\n' + JSON.stringify(data, null, 2),
        )
    }

    function handleBrandBlur() {
        setBrandBlurred(true)
    }

    return {
        state: {
            brandColor,
            brandBlurred,
            accentColor,
            rgbColor,
            compactColor,
        },
        setter: {
            setBrandColor,
            setBrandBlurred,
            setAccentColor,
            setRgbColor,
            setCompactColor,
        },
        handler: { handleSubmit, handleBrandBlur },
    }
}
