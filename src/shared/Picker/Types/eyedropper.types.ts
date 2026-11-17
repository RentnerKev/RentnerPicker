export interface EyeDropperConstructor {
    new (): {
        open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>
    }
}

export interface EyeDropperWindow extends Window {
    EyeDropper?: EyeDropperConstructor
}

export interface UseEyeDropperOptions {
    enabled: boolean
    onSelect: (value: string) => void
    onSuccess: () => void
}

export interface EyeDropperResult {
    state: { isPending: boolean }
    handler: {
        select: () => Promise<void>
        cancel: () => void
    }
}
