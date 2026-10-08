import {
    PickerContext,
    usePickerProviderLogic,
} from '../Hooks/usePickerContext.ts'
import type { PickerProviderProps } from '../Types/picker.types.ts'

export function PickerProvider({ children, ...props }: PickerProviderProps) {
    const { state } = usePickerProviderLogic(props)
    return (
        <PickerContext.Provider value={state.contextValue}>
            {children}
        </PickerContext.Provider>
    )
}
