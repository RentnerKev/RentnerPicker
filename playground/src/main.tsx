import React from 'react'
import ReactDOM from 'react-dom/client'
import { CustomColorPicker } from '../../src'
import { App } from './App'
import './index.css'

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

const fixture = new URLSearchParams(window.location.search).get('fixture')

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {fixture === 'read-only' ? <ReadOnlyPickerFixture /> : <App />}
    </React.StrictMode>,
)
