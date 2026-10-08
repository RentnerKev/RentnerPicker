export interface EyeDropperConstructor {
    new (): {
        open: () => Promise<{ sRGBHex: string }>
    }
}

export interface EyeDropperWindow extends Window {
    EyeDropper?: EyeDropperConstructor
}
