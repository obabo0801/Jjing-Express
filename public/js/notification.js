import { $, on } from './dom.js';

export function initNotification() {
    const button = $('.notify-button');
    const panel = $('#notify-panel');

    on(button, 'click', () => {
        toggleNotification(button, panel);
    });

    on(document, 'click', event => {
        closeOutside(event, button, panel);
    });

    on(document, 'keydown', event => {
        closeEscape(event, button, panel);
    });
}

function toggleNotification(button, panel) {
    if (!button || !panel) {
        return;
    }

    const open = panel.hidden;

    panel.hidden = !open;

    button.setAttribute(
        'aria-expanded',
        String(open)
    );
}

function closeNotification(button, panel) {
    if (!button || !panel) {
        return;
    }

    panel.hidden = true;

    button.setAttribute(
        'aria-expanded',
        'false'
    );
}

function closeOutside(event, button, panel) {
    if (!button || !panel || panel.hidden) {
        return;
    }

    const target = event.target;

    if (
        target.closest('.notify-panel')
        || target.closest('.notify-button')
    ) {
        return;
    }

    closeNotification(button, panel);
}

function closeEscape(event, button, panel) {
    if (event.key !== 'Escape') {
        return;
    }

    closeNotification(button, panel);
}