import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'click', popIcon);
    on(top, 'contextmenu', blockMenu);
    on(top, 'dragstart', blockDrag);
}

function popIcon(event) {
    const button = event.target.closest(
        '.icon-button'
    );

    if (!button) {
        return;
    }

    button.classList.remove('is-pop');

    requestAnimationFrame(() => {
        button.classList.add('is-pop');
    });
}

function blockMenu(event) {
    const image = event.target.closest(
        'img, .logo-icon, .icon-button'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}

function blockDrag(event) {
    const image = event.target.closest(
        'img, .logo'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}