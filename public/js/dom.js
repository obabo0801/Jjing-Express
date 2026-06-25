export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
    return [
        ...parent.querySelectorAll(selector)
    ];
}

export function on(element, event, handler) {
    element?.addEventListener(event, handler);
}

export function focusList(
    parent,
    selector = 'button, a, input, textarea, select'
) {
    if (!parent) {
        return [];
    }

    return $$(selector, parent).filter(item => {
        return !item.hidden
            && !item.disabled
            && item.offsetParent !== null;
    });
}

export function isLastTab(event, parent, selector) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !parent
        || parent.hidden
    ) {
        return false;
    }

    const list = focusList(parent, selector);
    const last = list[
        list.length - 1
    ];

    return document.activeElement === last;
}