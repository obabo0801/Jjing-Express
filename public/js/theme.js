import {
    $, $$, on, esc, lastTab
} from './dom.js';

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
    const items = $$(
        '[data-theme-value]'
    );

    set(get(), false);
    watch();

    on(button, 'click', () => {
        if (box.hidden) {
            boxOpen(box, close);
            return;
        }

        boxClose(box, button);
    });

    on(close, 'click', () => {
        boxClose(box, button);
    });

    items.forEach(item => {
        on(item, 'click', () => {
            const mode = item.dataset.themeValue;

            set(mode);
            boxClose(box, button);
        });
    });

    document.addEventListener('click', event => {
        if (!wrap?.contains(event.target)) {
            boxClose(box);
        }
    });

    document.addEventListener('keydown', event => {
        if (!esc(event)) {
            return;
        }

        boxClose(box, button);
    });

    on(box, 'keydown', event => {
        tabClose(event, box, button);
    });
}

function boxOpen(box, focus) {
    if (!box) {
        return;
    }

    box.hidden = false;
    box.classList.remove('close');
    box.classList.add('open');

    document.body.classList.add(
        'theme-open'
    );

    if (!mobile()) {
        return;
    }

    requestAnimationFrame(() => {
        focus?.focus?.({
            preventScroll: true
        });
    });
}

function boxClose(box, focus, done) {
    if (
        !box
        || box.hidden
        || box.classList.contains('close')
    ) {
        return;
    }

    box.classList.remove('open');

    if (!mobile()) {
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

function tabClose(event, box, focus) {
    if (!lastTab(event, box, 'button')) {
        return;
    }

    event.preventDefault();

    boxClose(box, focus);
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
    $$('[data-theme-value]')
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

function mobile() {
    return matchMedia(
        '(max-width: 640px)'
    ).matches;
}