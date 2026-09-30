import { useState } from 'react'
import { CustomColorPicker } from '@rentnerkev/picker'

export function App() {
    const [acceptColorChanges, setAcceptColorChanges] = useState(false)
    const [color, setColor] = useState('#abcdef')

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={acceptColorChanges}
                    onChange={(event) =>
                        setAcceptColorChanges(event.target.checked)
                    }
                />
                Accept parent color changes
            </label>

            <form aria-label="Accepted color form">
                <CustomColorPicker
                    name="brandColor"
                    aria-label="Brand color"
                    locale="en"
                    value={color}
                    onValueChange={(nextColor) => {
                        if (acceptColorChanges) {
                            setColor(nextColor)
                        }
                    }}
                />
            </form>

            <form aria-label="Optional color form">
                <CustomColorPicker
                    name="optionalColor"
                    aria-label="Optional color"
                    locale="en"
                    value="#abcdef"
                    onValueChange={() => undefined}
                />
            </form>

            <CustomColorPicker
                aria-label="Equivalent preset"
                locale="en"
                value="#aabbcc"
                presets={['#abc']}
                onValueChange={() => undefined}
                showInput={false}
            />
        </div>
    )
}
