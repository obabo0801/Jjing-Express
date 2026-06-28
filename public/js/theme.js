import {
    $, $$, on, esc, lastTab
} from './dom.js';

const modes = [
    'light',
    'dark',
    'system'
];

export function initTheme() {
    const wrap = $('.theme');
    const button = $('.theme > .tool');
    const box = $('.theme-box');
    const cls = $('.theme-close');
    const items = $$(
        '[data-theme-value]'
    );

    set(get(), false);
    watch();

    on(button, 'click', () => {
        if (box.hidden) {
            open(box, cls);
            return;
        }

        close(box, button);
    });

    on(cls, 'click', () => {
        close(box, button);
    });

    items.forEach(item => {
        on(item, 'click', () => {
            const mode = item.dataset.themeValue;

            set(mode);
            close(box, button);
        });
    });

    on(document, 'click', event => {
        if (!wrap?.contains(event.target)) {
            close(box);
        }
    });

    on(document, 'keydown', event => {
        if (!esc(event)) {
            return;
        }

        close(
            box, button, false
        );
    });

    on(box, 'keydown', event => {
        tabClose(event, box, button);
    });
}

function open(box, focus) {
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

function close(
    box, focus, keep = true
) {
    if (
        !box || box.hidden
        || box.classList.contains('close')
    ) {
        return;
    }

    if (box.contains(
        document.activeElement
    )) {
        document.activeElement.blur();
    }

    box.classList.remove('open');

    const finish = () => {
        box.hidden = true;
        box.classList.remove('close');

        document.body.classList.remove(
            'theme-open'
        );

        focusEnd(focus, keep);
    };

    if (!mobile()) {
        finish();
        return;
    }

    box.classList.add('close');

    box.addEventListener(
        'animationend',
        finish,
        { once: true }
    );
}

function focusEnd(focus, keep) {
    if (keep) {
        focus?.focus?.({
            preventScroll: true
        });
        return;
    }

    focus?.blur?.();
}

function tabClose(event, box, focus) {
    if (!lastTab(event, box, 'button')) {
        return;
    }

    event.preventDefault();

    close(box, focus);
}

function set(mode, save = true) {
    document.documentElement
        .setAttribute('theme', mode);
    active(mode);

    window.setFaviconTheme?.(
        mode === 'system'
            ? sys()
            : mode
    );

    if (save) {
        localStorage.setItem('theme', mode);
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
    const mode = localStorage.getItem('theme');

    return modes.includes(mode)
        ? mode
        : 'light';
}

function sys() {
    return matchMedia(
        '(prefers-color-scheme: light)'
    ).matches
        ? 'light'
        : 'dark';
}

function watch() {
    const query = matchMedia(
        '(prefers-color-scheme: light)'
    );

    on(query, 'change', () => {
        if (
            document.documentElement
                .getAttribute(
                    'theme'
                ) !== 'system'
        ) {
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