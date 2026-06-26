import { on } from './dom.js';

const stack = [];

export function mob() {
    return matchMedia(
        '(max-width: 640px)'
    ).matches;
}

export function push(key) {
    if (!mob() || stack.includes(key)) {
        return;
    }

    stack.push(key);

    history.pushState({
        back: key
    }, '');
}

export function drop(key) {
    const index = stack.lastIndexOf(key);

    if (index < 0) {
        return;
    }

    stack.splice(index, 1);
    history.back();
}

export function bind(key, close) {
    on(window, 'popstate', () => {
        if (stack.at(-1) !== key) {
            return;
        }

        stack.pop();
        close?.();
    });
}