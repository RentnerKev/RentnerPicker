import React from 'react'
import ReactDOM from 'react-dom/client'
import { CustomColorPicker } from '../../src/shared/Picker/Components/CustomColorPicker'
import { App } from './App'
// oxlint-disable-next-line import/no-unassigned-import -- The Vite entry deliberately loads the playground stylesheet.
import './index.css'
import { usePlaygroundRootLogic } from './Hooks/usePlaygroundRootLogic'

function ReadOnlyPickerFixture() {
    return (
        <main className="min-h-screen p-6">
            <h1 className="mb-6 text-xl font-bold">Read-only picker</h1>
            <CustomColorPicker
                id="read-only-color"
                label="Read-only color"
                value="#13ecd6"
                onValueChange={() => undefined}
                readOnly
                showInput={false}
            />
        </main>
    )
}

function PlaygroundRoot() {
    const {
        state: { readOnly },
    } = usePlaygroundRootLogic()
    return readOnly ? <ReadOnlyPickerFixture /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <PlaygroundRoot />
    </React.StrictMode>,
)
