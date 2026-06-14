export function $(selector) {
    return document.querySelector(selector);
}

export function on(element, event, handler) {
    element?.addEventListener(event, handler);
}