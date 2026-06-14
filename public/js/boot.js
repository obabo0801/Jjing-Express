import { $, on } from './dom.js';

const root = document.documentElement;
const key = 'theme';
const darkQuery = '(prefers-color-scheme: dark)';

export function initTheme() {
    const button = $('.theme-button');

    setTheme(getTheme(), false);
    watchTheme();

    on(button, 'click', toggleTheme);
}

function toggleTheme() {
    const theme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(theme);
}

function setTheme(theme, save = true) {
    root.dataset.theme = theme;

    if (save) {
        localStorage.setItem(key, theme);
    }
}

function getTheme() {
    return localStorage.getItem(key)
        || systemTheme();
}

function systemTheme() {
    return matchMedia(darkQuery).matches
        ? 'dark'
        : 'light';
}

function watchTheme() {
    const query = matchMedia(darkQuery);

    on(query, 'change', () => {
        if (localStorage.getItem(key)) {
            return;
        }

        setTheme(systemTheme(), false);
    });
}