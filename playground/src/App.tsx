import React, { useState } from 'react'
import { Brush, Copy, PaintBucket, Palette, Send } from 'lucide-react'
import { CustomColorPicker } from '../../src'

export function App() {
    const [brandColor, setBrandColor] = useState('#13ecd6')
    const [accentColor, setAccentColor] = useState('#3f40ad')
    const [rgbColor, setRgbColor] = useState('rgb(34, 197, 94)')
    const [compactColor, setCompactColor] = useState('#ec4899')

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        const data = { brandColor, accentColor, rgbColor, compactColor }
        alert(
            'Farben erfolgreich gespeichert:\n' + JSON.stringify(data, null, 2),
        )
    }

    return (
        <main className="relative min-h-screen p-6 md:p-10">
            <div className="glow-effect left-[20%] top-[20%]" />
            <div className="glow-effect glow-effect-small left-[70%] top-[60%]" />

            <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-6">
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                    RentnerPicker Playground
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 w-full max-w-md space-y-6"
                >
                    <CustomColorPicker
                        id="brand-color"
                        name="brandColor"
                        value={brandColor}
                        onValueChange={setBrandColor}
                        required
                        icon={<Brush className="h-5 w-5" />}
                    />

                    <CustomColorPicker
                        id="accent-color"
                        name="accentColor"
                        value={accentColor}
                        onValueChange={setAccentColor}
                        placeholder="#3f40ad"
                        icon={<PaintBucket className="h-5 w-5" />}
                        presets={[
                            '#3f40ad',
                            '#13ecd6',
                            '#f59e0b',
                            '#ef4444',
                            '#ec4899',
                        ]}
                        customDesign={{
                            focusRing: 'focus-within:ring-indigo-500/50',
                            focusBorder: 'focus-within:border-indigo-500',
                            iconFocus: 'group-focus-within:text-indigo-400',
                            presetActiveBorder:
                                'ring-indigo-400 border-indigo-400',
                        }}
                    />

                    <CustomColorPicker
                        id="rgb-color"
                        name="rgbColor"
                        value={rgbColor}
                        onValueChange={setRgbColor}
                        format="rgb"
                        icon={<Copy className="h-5 w-5" />}
                        placeholder="rgb(34, 197, 94)"
                    />

                    <CustomColorPicker
                        id="compact-color"
                        name="compactColor"
                        value={compactColor}
                        onValueChange={setCompactColor}
                        showInput={false}
                        icon={<Palette className="h-5 w-5" />}
                        presets={[
                            '#ec4899',
                            '#13ecd6',
                            '#3f40ad',
                            '#22c55e',
                            '#f59e0b',
                        ]}
                    />

                    <div className="rounded-xl border border-border-dark bg-surface-dark p-4">
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                brandColor,
                                accentColor,
                                rgbColor,
                                compactColor,
                            ].map((color) => (
                                <div
                                    key={color}
                                    className="h-16 rounded-lg border border-border-dark"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-background-dark transition-colors hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <Send className="h-5 w-5" />
                        Farben speichern
                    </button>
                </form>
            </div>
        </main>
    )
}
