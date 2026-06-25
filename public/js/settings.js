import {
    $, $$, on, esc, lastTab
} from './dom.js';

import {
    OPTION, DEFAULT_OPTION,
    opt
} from './options.js';

const pageCache = new Map();

let layer = null;

let lastFocus = null;

export function initSetting() {
    const btn = $(
        '.settings > .tool'
    );

    setScreen(
        screen()
    );

    setFont(
        font()
    );

    on(btn, 'click', open);

    on(document, 'keydown', event => {
        escClose(event);
        tabClose(event);
    });
}

async function open() {
    lastFocus = document.activeElement;

    if (!layer) {
        await load();
    }

    layer.hidden = false;
    layer.classList.remove('close');
    layer.classList.add('open');

    document.body.classList.add(
        'settings-open'
    );

    await change(
        typeNow()
    );

    $('.settings-box')?.focus();
}

async function load() {
    const html = await loadHtml(
        '/components/settings/popup.html'
    );

    document.body.insertAdjacentHTML(
        'beforeend',
        html
    );

    layer = $('.settings-layer');

    bind();
}

function bind() {
    on(layer, 'click', event => {
        if (event.target !== layer) {
            return;
        }

        close();
    });

    layer.querySelectorAll(
        '[data-settings-close]'
    ).forEach(btn => {
        on(btn, 'click', close);
    });

    on(document, 'click', event => {
        dropClose(event);
    });

    const back = layer.querySelector(
        '[data-settings-mobile-back]'
    );

    on(back, 'click', () => {
        layer.classList.remove('page');
    });

    layer.querySelectorAll(
        '[data-settings-type]'
    ).forEach(tab => {
        on(tab, 'click', () => {

            change(
                tab.dataset.settingsType
            );

            layer.classList.add('page');
        });
    });
}

async function change(type) {
    const body = $(
        '[data-settings-content]'
    );
    const title = $(
        '[data-settings-title]'
    );

    saveType(type);

    const name = type === 'notification'
        ? '알림'
        : '일반';

    title.textContent = name;

    body.replaceChildren();

    body.innerHTML = await loadPage(type);

    if (type === 'general') {
        bindBase();
    }

    if (type === 'notification') {
        bindAlarm();
    }

    layer.querySelectorAll(
        '.settings-tab'
    ).forEach(tab => {
        tab.classList.toggle(
            'active',
            tab.dataset.settingsType === type
        );
    });
}

async function loadPage(type) {
    if (pageCache.has(type)) {
        return pageCache.get(type);
    }

    const html = await loadHtml(
        `/components/settings/${type}.html`
    );

    pageCache.set(type, html);

    return html;
}

function close() {
    if (!layer || layer.hidden) {
        return;
    }

    const popup = $('.settings-box');

    layer.classList.remove('open');
    layer.classList.add('close');

    const done = () => {
        layer.hidden = true;
        layer.classList.remove(
            'close',
            'page'
        );

        document.body.classList.remove(
            'settings-open'
        );

        lastFocus?.focus?.({
            preventScroll: true
        });

        lastFocus = null;
    };

    if (!popup) {
        done();
        return;
    }

    popup.addEventListener(
        'animationend',
        done,
        { once: true }
    );
}

function escClose(event) {
    if (!esc(event)) {
        return;
    }

    close();
}

function tabClose(event) {
    if (!lastTab(event, layer)) {
        return;
    }

    event.preventDefault();

    close();
}

async function loadHtml(url) {
    const response = await fetch(url);

    if (!response.ok) {
        return '';
    }

    return response.text();
}

function bindBase() {
    bindScale(
        'screen',
        OPTION.screenScale,
        DEFAULT_OPTION.screenScale,
        setScreen
    );

    bindScale(
        'font',
        OPTION.fontScale,
        DEFAULT_OPTION.fontScale,
        setFont
    );

    bindReset();
}

function bindScale(
    type, key, value, apply
) {
    const drop = $(
        `[data-${type}-scale-dropdown]`
    );
    const btn = $(
        `[data-${type}-scale-trigger]`
    );
    const text = $(
        `[data-${type}-scale-text]`
    );
    const list = layer.querySelectorAll(
        `[data-${type}-scale]`
    );

    if (!drop || !btn || !text) {
        return;
    }

    const current = opt(
        key,
        value
    );

    text.textContent = scaleLabel(current);
    setScale(type, current);

    list.forEach(button => {
        on(button, 'click', () => {
            const data = button.dataset[
                `${type}Scale`
            ];

            localStorage.setItem(
                key,
                data
            );

            apply(data);

            text.textContent = scaleLabel(data);
            drop.classList.remove('open');

            setScale(type, data);

            parentMove(
                button.closest('.settings-item')
            );
        });
    });

    on(btn, 'click', event => {
        event.stopPropagation();

        dropToggle(drop);
    });

    on(drop, 'keydown', event => {
        dropTabClose(event, drop);
    });
}

function screen() {
    return opt(
        OPTION.screenScale,
        DEFAULT_OPTION.screenScale
    );
}

function setScreen(value) {
    document.documentElement.style.setProperty(
        '--screen-scale',
        value
    );
}

function scaleLabel(value) {
    return `${Math.round(Number(value) * 100)}%`;
}

function font() {
    return opt(
        OPTION.fontScale,
        DEFAULT_OPTION.fontScale
    );
}

function setFont(value) {
    document.documentElement.style.setProperty(
        '--font-scale',
        value
    );
}

function bindReset() {
    const btn = $(
        '[data-settings-reset]'
    );

    on(btn, 'click', resetBase);
}

function dropToggle(dropdown) {
    const open = dropdown.classList.contains('open');

    dropClose();

    const next = !open;

    dropdown.classList.toggle(
        'open',
        next
    );

    if (next) {
        dropMove(dropdown);
    }
}

function dropMove(dropdown) {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const body = dropdown.closest(
                '.settings-body'
            );

            const parent = dropdown.closest(
                '.settings-item'
            );

            const menu = dropdown.querySelector(
                '.settings-size-menu'
            );

            if (!body || !parent || !menu) {
                return;
            }

            const gap = 32;

            body.style.setProperty(
                '--settings-drop-space',
                `${menu.offsetHeight + gap}px`
            );

            const bodyRect = body.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();

            const bottom = Math.max(
                parentRect.bottom,
                menuRect.bottom
            );

            const move = bottom - bodyRect.bottom + gap;

            if (move > 0) {
                body.scrollTop += move;
            }
        });
    });
}

function parentMove(parent) {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const body = parent?.closest(
                '.settings-body'
            );

            if (!body || !parent) {
                return;
            }

            const bodyRect = body.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();

            const gap = 32;
            const move = parentRect.bottom - bodyRect.bottom + gap;

            if (move > 0) {
                body.scrollTop += move;
            }
        });
    });
}

function dropClose(event) {
    if (!layer || layer.hidden) {
        return;
    }

    if (
        event
        && event.target.closest(
            '.settings-size-dropdown'
        )
    ) {
        return;
    }

    layer.querySelectorAll(
        '.settings-size-dropdown.open'
    ).forEach(dropdown => {
        dropdown.classList.remove('open');
    });

    layer.querySelectorAll(
        '.settings-body'
    ).forEach(body => {
        body.style.removeProperty(
            '--settings-drop-space'
        );
    });
}

function dropTabClose(event, drop) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !drop.classList.contains('open')
    ) {
        return;
    }

    const buttons = [
        ...drop.querySelectorAll(
            '.settings-size-menu button'
        )
    ].filter(button => {
        return !button.disabled
            && button.offsetParent !== null;
    });

    const last = buttons[
        buttons.length - 1
    ];

    if (document.activeElement !== last) {
        return;
    }

    drop.classList.remove('open');
}

function resetBase() {
    localStorage.removeItem(OPTION.screenScale);
    localStorage.removeItem(OPTION.fontScale);

    setScreen(DEFAULT_OPTION.screenScale);
    setFont(DEFAULT_OPTION.fontScale);

    setScale(
        'screen',
        DEFAULT_OPTION.screenScale
    );

    setScale(
        'font',
        DEFAULT_OPTION.fontScale
    );

    layer.querySelectorAll(
        '.settings-size-dropdown'
    ).forEach(dropdown => {
        dropdown.classList.remove('open');
    });
}

function setScale(type, value) {
    if (!layer) {
        return;
    }

    const text = layer.querySelector(
        `[data-${type}-scale-text]`
    );

    const buttons = layer.querySelectorAll(
        `[data-${type}-scale]`
    );

    if (text) {
        text.textContent = scaleLabel(value);
    }

    buttons.forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset[`${type}Scale`] === value
        );
    });
}

function bindAlarm() {
    bindToggle(
        'enable',
        OPTION.notifyEnable,
        DEFAULT_OPTION.notifyEnable
    );

    bindToggle(
        'sound',
        OPTION.notifySound,
        DEFAULT_OPTION.notifySound
    );
}

function bindToggle(type, key, value) {
    const btn = layer.querySelector(
        `[data-notify-toggle="${type}"]`
    );

    if (!btn) {
        return;
    }

    let data = opt(
        key,
        value
    );

    setToggle(btn, data);

    on(btn, 'click', () => {
        data = data === '1'
            ? '0'
            : '1';

        localStorage.setItem(
            key,
            data
        );

        setToggle(btn, data);
    });
}

function setToggle(button, data) {
    const off = data !== '1';

    button.classList.toggle(
        'off',
        off
    );

    button.textContent = off
        ? '꺼짐'
        : '켜짐';
}

function typeNow() {
    return opt(
        OPTION.settingsType,
        DEFAULT_OPTION.settingsType
    );
}

function saveType(type) {
    localStorage.setItem(
        OPTION.settingsType,
        type
    );
}