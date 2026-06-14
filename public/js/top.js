import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'contextmenu', blockMenu);
    on(top, 'dragstart', blockDrag);
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