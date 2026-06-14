import { initTheme } from './theme.js';
import { initTop } from './top.js';

init();

function init() {
    initReady();
    initTheme();
    initTop();
}

function initReady() {
    requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
    });
}