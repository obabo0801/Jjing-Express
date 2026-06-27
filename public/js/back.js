import { on } from './dom.js';

const stack = [];
let skip = 0;

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
    skip += 1;

    history.back();
}

export function bind(key, close) {
    on(window, 'popstate', () => {
        if (skip > 0) {
            skip -= 1;
            return;
        }

        if (stack.at(-1) !== key) {
            return;
        }

        stack.pop();
        close?.();
    });
}

export function clear(...keys) {
    let count = 0;

    keys.forEach(key => {
        const index = stack.lastIndexOf(key);

        if (index < 0) {
            return;
        }

        stack.splice(index, 1);
        count += 1;
    });

    if (count > 0) {
        history.go(-count);
    }
}