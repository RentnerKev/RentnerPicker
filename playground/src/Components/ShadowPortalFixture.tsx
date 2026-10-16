import { CustomColorPicker } from '../../../src/shared/Picker/Components/CustomColorPicker.tsx'
import { useShadowPortalFixtureLogic } from '../Hooks/useShadowPortalFixtureLogic.ts'
export function ShadowPortalFixture() {
    const { state, handler, refs } = useShadowPortalFixtureLogic()
    const { setShadowHost } = refs
    return (
        <main>
            <div data-testid="shadow-host" ref={setShadowHost} />
            <CustomColorPicker
                label="Shadow color"
                value="#abcdef"
                onValueChange={() => undefined}
                onBlur={handler.handleBlur}
                portalContainer={state.portalContainer}
            />
            <button type="button">Outside shadow field</button>
            <output data-testid="shadow-blurs">{state.blurs}</output>
        </main>
    )
}
