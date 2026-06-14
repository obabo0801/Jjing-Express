import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'contextmenu', blockImageMenu);
    on(top, 'dragstart', blockDrag);
}

function blockImageMenu(event) {
    const image = event.target.closest(
        'img, .logo-icon'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}

function blockDrag(event) {
    const image = event.target.closest(
        '.logo, .logo-icon, img'
    );

    if (!image) {
        return;
    }

    event.preventDefault();
}