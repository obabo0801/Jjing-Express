import { $, on } from './dom.js';

const root = document.documentElement;
const key = 'theme';
const darkQuery = '(prefers-color-scheme: dark)';

export function initTheme() {
    const button = $('.theme-button');

    set(get(), false);
    watch();

    on(button, 'click', toggle);
}

function toggle() {
    const theme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    set(theme);
}

function set(theme, save = true) {
    root.dataset.theme = theme;
    window.setFaviconTheme?.(theme);

    if (save) {
        localStorage.setItem(key, theme);
    }
}

function get() {
    return localStorage.getItem(key)
        || system();
}

function system() {
    return matchMedia(darkQuery).matches
        ? 'dark'
        : 'light';
}

function watch() {
    const query = matchMedia(darkQuery);

    on(query, 'change', () => {
        set(system());
    });
}