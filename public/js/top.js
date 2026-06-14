import { $, on } from './dom.js';

export function initTop() {
    const top = $('.top');

    on(top, 'contextmenu', blockImageMenu);
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