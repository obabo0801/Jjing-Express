import { initTheme } from './theme.js';

init();

function init() {
    initReady();
    initTheme();
}

function initReady() {
    requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
    });
}