import { $, on } from './dom.js';

const root = document.documentElement;
const key = 'theme';
const sysQuery = '(prefers-color-scheme: light)';

const modes = [
    'light',
    'dark',
    'system'
];

export function initTheme() {
    const wrap = $('.theme');
    const button = $('.theme > .tool');
    const box = $('.theme-box');
    const close = $('.theme-close');
    const items = document.querySelectorAll(
        '[data-theme-value]'
    );

    set(get(), false);
    watch();

    on(button, 'click', () => {
        if (box.hidden) {
            openBox(box, close);
            return;
        }

        closeBox(box, button);
    });

    on(close, 'click', () => {
        closeBox(box, button);
    });

    items.forEach(item => {
        on(item, 'click', () => {
            const mode = item.dataset.themeValue;

            if (isMobile()) {
                closeBox(box, button, () => {
                    set(mode);
                });

                return;
            }

            set(mode);
            closeBox(box, button);
        });
    });

    document.addEventListener('click', event => {
        if (!wrap?.contains(event.target)) {
            closeBox(box);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeBox(box, button);
        }
    });

    on(box, 'keydown', event => {
        tabEnd(event, box, button);
    });
}

function openBox(box, focus) {
    if (!box) {
        return;
    }

    box.hidden = false;
    box.classList.remove('close');
    box.classList.add('open');

    document.body.classList.add(
        'theme-open'
    );

    if (!isMobile()) {
        return;
    }

    requestAnimationFrame(() => {
        focus?.focus?.({
            preventScroll: true
        });
    });
}

function closeBox(box, focus, done) {
    if (
        !box
        || box.hidden
        || box.classList.contains('close')
    ) {
        return;
    }

    box.classList.remove('open');

    if (!isMobile()) {
        box.hidden = true;

        document.body.classList.remove(
            'theme-open'
        );

        done?.();

        focus?.focus?.({
            preventScroll: true
        });

        return;
    }

    box.classList.add('close');

    box.addEventListener('animationend', () => {
        box.hidden = true;
        box.classList.remove('close');

        document.body.classList.remove(
            'theme-open'
        );

        done?.();

        focus?.focus?.({
            preventScroll: true
        });
    }, { once: true });
}

function tabEnd(event, box, focus) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !box
        || box.hidden
    ) {
        return;
    }

    const focusList = [
        ...box.querySelectorAll('button')
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

    closeBox(box, focus);
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
                'active',
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

function isMobile() {
    return matchMedia(
        '(max-width: 640px)'
    ).matches;
}