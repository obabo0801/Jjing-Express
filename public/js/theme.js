import { $, on } from './dom.js';

const root = document.documentElement;
const darkQuery = '(prefers-color-scheme: dark)';

export function initTheme() {
    const button = $('.theme-button');

    setTheme(systemTheme());
    watchTheme();

    on(button, 'click', toggleTheme);
}

function toggleTheme() {
    const theme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(theme);
}

function setTheme(theme) {
    root.dataset.theme = theme;
}

function systemTheme() {
    return matchMedia(darkQuery).matches
        ? 'dark'
        : 'light';
}

function watchTheme() {
    const query = matchMedia(darkQuery);

    on(query, 'change', () => {
        setTheme(systemTheme());
    });
}