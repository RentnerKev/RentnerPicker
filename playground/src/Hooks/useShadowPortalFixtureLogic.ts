import { useCallback, useState, type FocusEvent } from 'react'
export function useShadowPortalFixtureLogic() {
    const [portalContainer, setPortalContainer] = useState<ShadowRoot | null>(
        null,
    )
    const [blurs, setBlurs] = useState(0)
    const setShadowHost = useCallback((node: HTMLDivElement | null) => {
        if (node)
            setPortalContainer(
                node.shadowRoot ?? node.attachShadow({ mode: 'open' }),
            )
    }, [])
    function handleBlur(event: FocusEvent<HTMLElement>) {
        event.preventDefault()
        event.stopPropagation()
        setBlurs((value) => value + 1)
    }
    return {
        state: { portalContainer, blurs },
        handler: { handleBlur },
        refs: { setShadowHost },
    }
}
