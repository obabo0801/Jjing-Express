import { on } from './dom.js';

const stack = [];
const binds = new Map();

let skip = 0;
let ready = false;

export function push(key) {
    if (stack.includes(key)) {
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

    if (count <= 0) {
        return;
    }

    skip += count;
    history.go(-count);
}

export function bind(key, close) {
    binds.set(key, close);
    listen();
}

function listen() {
    if (ready) {
        return;
    }

    ready = true;

    on(window, 'popstate', () => {
        if (skip > 0) {
            skip -= 1;
            return;
        }

        const key = stack.pop();

        if (!key) {
            return;
        }

        binds.get(key)?.();
    });
}