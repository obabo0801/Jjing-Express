import { $, on } from './dom.js';

const root = document.documentElement;
const key = 'theme';
const sysQuery = '(prefers-color-scheme: light)';

const modes = [
    'light',
    'dark',
    'system'
];

const icons = {
    light: 'icon-light',
    dark: 'icon-dark',
    system: 'icon-setting'
};

export function initTheme() {
    const dropdown = $('.theme-dropdown');
    const button = $('.theme-button');
    const menu = $('.theme-menu');
    const close = $('.theme-close');
    const items = document.querySelectorAll(
        '[data-theme-value]'
    );

    set(get(), false);
    watch();

    on(button, 'click', () => {
        if (menu.hidden) {
            openMenu(menu, close);
            return;
        }

        closeMenu(menu, button);
    });

    on(close, 'click', () => {
        closeMenu(menu, button);
    });

    items.forEach(item => {
        on(item, 'click', () => {
            const mode = item.dataset.themeValue;

            if (isMobile()) {
                closeMenu(menu, button, () => {
                    set(mode);
                });

                return;
            }

            set(mode);
            closeMenu(menu, button);
        });
    });

    document.addEventListener('click', event => {
        if (!dropdown?.contains(event.target)) {
            closeMenu(menu);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu(menu, button);
        }
    });

    on(menu, 'keydown', event => {
        tabEnd(event, menu, button);
    });
}

function openMenu(menu, focus) {
    if (!menu) {
        return;
    }

    menu.hidden = false;
    menu.classList.remove('is-close');
    menu.classList.add('is-open');

    if (!isMobile()) {
        return;
    }

    document.body.classList.add(
        'is-theme-open'
    );

    requestAnimationFrame(() => {
        focus?.focus?.({
            preventScroll: true
        });
    });
}

function closeMenu(menu, focus, done) {
    if (
        !menu
        || menu.hidden
        || menu.classList.contains('is-close')
    ) {
        return;
    }

    menu.classList.remove('is-open');

    if (!isMobile()) {
        menu.hidden = true;
        done?.();

        focus?.focus?.({
            preventScroll: true
        });

        return;
    }

    menu.classList.add('is-close');

    menu.addEventListener('animationend', () => {
        menu.hidden = true;
        menu.classList.remove('is-close');

        document.body.classList.remove(
            'is-theme-open'
        );

        done?.();

        focus?.focus?.({
            preventScroll: true
        });
    }, { once: true });
}

function tabEnd(event, menu, focus) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !menu
        || menu.hidden
    ) {
        return;
    }

    const focusList = [
        ...menu.querySelectorAll('button')
    ].filter(item => {
        return !item.hidden
            && !item.disabled
            && item.offsetParent !== null;
    });

    const last = focusList[
        focusList.length - 1
    ];

    if (document.activeElement !== last) {
        return;
    }

    event.preventDefault();

    closeMenu(menu, focus);
}

function set(mode, save = true) {
    root.setAttribute('theme', mode);
    active(mode);
    icon(mode);

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

function icon(mode) {
    const item = $('.theme-icon');

    if (!item) {
        return;
    }

    item.className = `icon theme-icon ${icons[mode]}`;
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

function isMobile() {
    return matchMedia(
        '(max-width: 640px)'
    ).matches;
}