import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'click', pop);
    on(top, 'contextmenu', noMenu);
    on(top, 'dragstart', noDrag);
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

function noMenu(event) {
    const image = event.target.closest(
        'img, .logo-icon, .tool'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}

function noDrag(event) {
    const image = event.target.closest(
        'img, .logo'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}