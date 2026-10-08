import type { Dispatch, SetStateAction, FormEvent } from 'react'

export interface PlaygroundLogicResult {
    state: {
        brandColor: string
        brandBlurred: boolean
        accentColor: string
        rgbColor: string
        compactColor: string
    }
    setter: {
        setBrandColor: Dispatch<SetStateAction<string>>
        setAccentColor: Dispatch<SetStateAction<string>>
        setRgbColor: Dispatch<SetStateAction<string>>
        setCompactColor: Dispatch<SetStateAction<string>>
    }
    handler: {
        handleSubmit: (event: FormEvent) => void
        handleBrandBlur: () => void
    }
}
export interface PlaygroundRootLogicResult {
    state: { readOnly: boolean }
}
