import { initTheme } from './theme.js';
import { initTop } from './top.js';
import { initNotification }
    from './notification.js';

init();

function init() {
    initReady();
    initTheme();
    initTop();
    initNotification();
}

function initReady() {
    requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
    });
}