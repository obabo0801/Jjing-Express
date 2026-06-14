import { $, on } from './dom.js';

const root = document.documentElement;
const darkQuery = '(prefers-color-scheme: dark)';

export function initTheme() {
    setSystemTheme();
    watchSystemTheme();
}

function setSystemTheme() {
    const theme = matchMedia(darkQuery).matches
        ? 'dark'
        : 'light';

    root.dataset.theme = theme;
}

function watchSystemTheme() {
    on(
        matchMedia(darkQuery),
        'change',
        setSystemTheme
    );
}