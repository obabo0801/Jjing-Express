import { initTheme } from './theme.js';
import { initTop } from './top.js';
import { initNotification } from './notification.js';
import { initSettings } from './settings.js';

init();

function init() {
    initReady();
    initTheme();
    initTop();
    initNotification();
    initSettings();
}

function initReady() {
    requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
    });
}