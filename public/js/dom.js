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

function targets(
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

export function lastTab(event, parent, selector) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !parent
        || parent.hidden
    ) {
        return false;
    }

    const list = targets(parent, selector);
    const last = list[
        list.length - 1
    ];

    return document.activeElement === last;
}

export function esc(event) {
    return event.key === 'Escape';
}