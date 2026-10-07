import {
    PickerContext,
    usePickerProviderLogic,
} from '../Hooks/usePickerContext.js'
import type { PickerProviderProps } from '../Types/picker.types.js'
export type { PickerProviderProps } from '../Types/picker.types.js'
export {
    usePickerDefaults,
    usePickerMessages,
} from '../Hooks/usePickerContext.js'

export function PickerProvider({ children, ...props }: PickerProviderProps) {
    const { state } = usePickerProviderLogic(props)
    return (
        <PickerContext.Provider value={state.contextValue}>
            {children}
        </PickerContext.Provider>
    )
}
