import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'click', pop);
    on(top, 'contextmenu', noMenu);
    on(top, 'dragstart', noDrag);
}

function pop(event) {
    const button = event.target.closest(
        '.icon-button'
    );

    if (!button) {
        return;
    }

    const effect = button.classList.contains(
        'notify-button'
    )
        ? 'is-shake'
        : 'is-pop';

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
        'img, .logo-icon, .icon-button'
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