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
    const theme = mode === 'system'
        ? sys()
        : mode;

    root.dataset.themeMode = mode;
    root.dataset.theme = theme;

    window.setFaviconTheme?.(theme);

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
        if (root.dataset.themeMode === 'system') {
            set('system', false);
            return;
        }

        window.setFaviconTheme?.(sys());
    });
}