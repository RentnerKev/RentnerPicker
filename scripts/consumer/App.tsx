import { CustomColorPicker } from '@rentnerkev/picker'

import { useConsumerAppLogic } from './Hooks/useConsumerAppLogic.ts'

import type { AppLogicResult } from './Types/app.types.ts'

export function App() {
    const {
        state: {
            acceptColorChanges,
            color,
            brandSubmissions,
            optionalSubmission,
            optionalSubmitCount,
            requiredColor,
            requiredSubmission,
            requiredSubmitCount,
            firstColor,
            secondColor,
            multiSubmission,
            multiSubmitCount,
            showRemovingPicker,
            removingSubmission,
            removingSubmitCount,
            repeatedColor,
            repeatedChanges,
            repeatedSubmissions,
            repeatedSubmitter,
            showRefPicker,
            refEventsText,
            objectRefStatus,
        },
        handler: {
            handleBrandSubmit,
            handleColorChange,
            handleOptionalSubmit,
            handleRequiredSubmit,
            handleMultipleSubmit,
            handleRemovingSubmit,
            handleRepeatedSubmit,
            handleRepeatedColorChange,
        },
        setter: {
            setAcceptColorChanges,
            setRequiredColor,
            setFirstColor,
            setSecondColor,
            setShowRemovingPicker,
            setRefMode,
            setShowRefPicker,
        },
        refs: { triggerRef },
    }: AppLogicResult = useConsumerAppLogic()
    return (
        <div className="bg-background-dark text-white">
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

            <form aria-label="Accepted color form" onSubmit={handleBrandSubmit}>
                <CustomColorPicker
                    name="brandColor"
                    aria-label="Brand color"
                    locale="en"
                    value={color}
                    onValueChange={handleColorChange}
                />
                <button type="submit">Submit brand color</button>
            </form>
            <output
                aria-label="Brand submission count"
                data-testid="brand-submit-count"
            >
                {brandSubmissions.length}
            </output>
            <output
                aria-label="Last brand submission"
                data-testid="brand-submission"
            >
                {brandSubmissions.at(-1) ?? ''}
            </output>

            <form
                aria-label="Optional color form"
                onSubmit={handleOptionalSubmit}
            >
                <CustomColorPicker
                    name="optionalColor"
                    aria-label="Optional color"
                    locale="en"
                    value="#abcdef"
                    onValueChange={() => undefined}
                />
                <button type="submit">Submit optional color</button>
            </form>
            <output
                aria-label="Optional submission count"
                data-testid="optional-submit-count"
            >
                {optionalSubmitCount}
            </output>
            <output
                aria-label="Optional submission"
                data-testid="optional-submission"
            >
                {optionalSubmission}
            </output>

            <form
                aria-label="Required color form"
                onSubmit={handleRequiredSubmit}
            >
                <CustomColorPicker
                    name="requiredColor"
                    aria-label="Required color"
                    locale="en"
                    required
                    value={requiredColor}
                    onValueChange={setRequiredColor}
                />
                <button type="submit">Submit required color</button>
            </form>
            <output
                aria-label="Required submission count"
                data-testid="required-submit-count"
            >
                {requiredSubmitCount}
            </output>
            <output
                aria-label="Required submission"
                data-testid="required-submission"
            >
                {requiredSubmission}
            </output>

            <form
                aria-label="Multiple color form"
                onSubmit={handleMultipleSubmit}
            >
                <CustomColorPicker
                    name="firstColor"
                    aria-label="First color"
                    locale="en"
                    value={firstColor}
                    onValueChange={setFirstColor}
                />
                <CustomColorPicker
                    name="secondColor"
                    aria-label="Second color"
                    locale="en"
                    value={secondColor}
                    onValueChange={setSecondColor}
                />
                <button type="submit">Submit multiple colors</button>
            </form>
            <output
                aria-label="Multiple color submission count"
                data-testid="multi-submit-count"
            >
                {multiSubmitCount}
            </output>
            <output
                aria-label="Multiple color submission"
                data-testid="multi-submission"
            >
                {multiSubmission}
            </output>

            <form
                aria-label="Removing color form"
                onSubmit={handleRemovingSubmit}
            >
                {showRemovingPicker && (
                    <CustomColorPicker
                        name="removingColor"
                        aria-label="Removing color"
                        locale="en"
                        value="#445566"
                        onValueChange={() => setShowRemovingPicker(false)}
                    />
                )}
                <input type="hidden" name="remaining" value="retained" />
                <button type="submit">Submit removing color</button>
            </form>
            <output
                aria-label="Removing color submission count"
                data-testid="removing-submit-count"
            >
                {removingSubmitCount}
            </output>
            <output
                aria-label="Remaining form value"
                data-testid="removing-submission"
            >
                {removingSubmission}
            </output>

            <form
                aria-label="Repeated color form"
                onSubmit={handleRepeatedSubmit}
            >
                <CustomColorPicker
                    name="repeatedColor"
                    aria-label="Repeated color"
                    locale="en"
                    value={repeatedColor}
                    onValueChange={handleRepeatedColorChange}
                />
                <button type="submit">Submit repeated color</button>
            </form>
            <output
                aria-label="Repeated color change count"
                data-testid="repeated-change-count"
            >
                {repeatedChanges}
            </output>
            <output
                aria-label="Repeated color submissions"
                data-testid="repeated-submissions"
            >
                {JSON.stringify(repeatedSubmissions)}
            </output>
            <output
                aria-label="Repeated submitter"
                data-testid="repeated-submitter"
            >
                {repeatedSubmitter}
            </output>

            <CustomColorPicker
                aria-label="Equivalent preset"
                locale="en"
                value="#aabbcc"
                presets={['#abc']}
                onValueChange={() => undefined}
                showInput={false}
            />

            <section aria-label="Trigger ref lifecycle">
                <div>
                    <button type="button" onClick={() => setRefMode('legacy')}>
                        Use legacy trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('object')}>
                        Use object trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('cleanup')}>
                        Use cleanup trigger ref
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRefPicker(false)}
                    >
                        Remove ref target
                    </button>
                </div>
                {showRefPicker && (
                    <CustomColorPicker
                        aria-label="Reference color"
                        locale="en"
                        value="#abcdef"
                        onValueChange={() => undefined}
                        showInput={false}
                        triggerRef={triggerRef}
                    />
                )}
                <output data-testid="trigger-ref-events">
                    {refEventsText}
                </output>
                <output data-testid="trigger-object-ref-status">
                    {objectRefStatus}
                </output>
            </section>
        </div>
    )
}
