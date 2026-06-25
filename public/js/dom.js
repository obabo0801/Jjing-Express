const FOCUSABLE = (
    'button, a, input, textarea, select'
);

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

export function esc(event) {
    return event.key === 'Escape';
}

function tabItems(
    parent, selector = FOCUSABLE
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

    const list = tabItems(parent, selector);
    const last = list[
        list.length - 1
    ];

    return document.activeElement === last;
}