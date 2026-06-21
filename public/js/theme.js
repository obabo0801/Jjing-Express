import { $, on } from './dom.js';

const root = document.documentElement;
const key = 'theme';
const sysQuery = '(prefers-color-scheme: light)';

const modes = [
    'light',
    'dark',
    'night',
    'system'
];

export function initTheme() {
    const button = $('.theme-button');

    set(get(), false);
    watch();

    on(button, 'click', toggle);
}

function toggle() {
    const now = root.dataset.themeMode || get();
    const index = modes.indexOf(now);

    const next = modes[
        (index + 1) % modes.length
    ];

    set(next);
}

function set(mode, save = true) {
    root.dataset.theme = mode;

    window.setFaviconTheme?.(
        mode === 'system'
            ? sys()
            : mode
    );

    if (save) {
        localStorage.setItem(key, mode);
    }
}

function get() {
    const mode = localStorage.getItem(key);

    return modes.includes(mode)
        ? mode
        : 'light';
}

function sys() {
    return matchMedia(sysQuery).matches
        ? 'light'
        : 'dark';
}

function watch() {
    const query = matchMedia(sysQuery);

    on(query, 'change', () => {
        window.setFaviconTheme?.(sys());
    });
}