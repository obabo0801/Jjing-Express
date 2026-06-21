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
    const dropdown = $('.theme-dropdown');
    const button = $('.theme-button');
    const menu = $('.theme-menu');
    const items = document.querySelectorAll(
        '[data-theme-value]'
    );

    set(get(), false);
    watch();

    on(button, 'click', event => {
        menu.hidden = !menu.hidden;
    });

    items.forEach(item => {
        on(item, 'click', () => {
            set(item.dataset.themeValue);
            menu.hidden = true;
        });
    });

    document.addEventListener('click', event => {
        if (!dropdown?.contains(event.target)) {
            menu.hidden = true;
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            menu.hidden = true;
        }
    });
}

function set(mode, save = true) {
    root.setAttribute('theme', mode);
    active(mode);

    window.setFaviconTheme?.(
        mode === 'system'
            ? sys()
            : mode
    );

    if (save) {
        localStorage.setItem(key, mode);
    }
}

function active(mode) {
    document
        .querySelectorAll('[data-theme-value]')
        .forEach(button => {
            button.classList.toggle(
                'is-active',
                button.dataset.themeValue === mode
            );
        });
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
        if (root.getAttribute('theme') !== 'system') {
            return;
        }

        window.setFaviconTheme?.(sys());
    });
}