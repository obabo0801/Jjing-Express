import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'click', pop);
    on(top, 'contextmenu', menuStop);
    on(top, 'dragstart', dragStop);
}

function pop(event) {
    const button = event.target.closest(
        '.tool'
    );

    if (!button) {
        return;
    }

    button.blur();

    const effect = button.closest('.notify')
        ? 'shake'
        : 'pop';

    button.classList.remove(effect);

    requestAnimationFrame(() => {
        button.classList.add(effect);
    });

    button.addEventListener(
        'animationend',
        () => {
            button.classList.remove(effect);
        },
        { once: true }
    );
}

function menuStop(event) {
    const target = event.target.closest(
        'img, .logo-icon, .tool'
    );

    if (!target) {
        return;
    }

    event.preventDefault();
}

function dragStop(event) {
    const target = event.target.closest(
        'img, .logo'
    );

    if (!target) {
        return;
    }

    event.preventDefault();
}