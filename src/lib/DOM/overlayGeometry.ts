export function isComposedAncestor(
    target: EventTarget | undefined | null,
    element: Element | null,
) {
    let current: Node | null = element
    while (current) {
        if (current === target) return true
        current =
            current instanceof ShadowRoot ? current.host : current.parentNode
    }
    return false
}

export function getAncestorShadowRoots(element: Element | null) {
    const roots: ShadowRoot[] = []
    let current = element?.getRootNode()
    while (current instanceof ShadowRoot) {
        roots.push(current)
        current = current.host.getRootNode()
    }
    return roots
}
