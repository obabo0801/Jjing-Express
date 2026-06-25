import {
    $, $$, on, esc, lastTab
} from './dom.js';

import {
    OPTION, DEFAULT_OPTION,
    opt
} from './options.js';

let layer = null;
let focus = null;
const root = document.documentElement;
const cache = new Map();
const GAP = 32;

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
    focus = document.activeElement;

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

    $('.settings-box', layer)?.focus();
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

    $$(
        '[data-settings-close]',
        layer
    ).forEach(btn => {
        on(btn, 'click', close);
    });

    on(document, 'click', event => {
        dropClose(event);
    });

    const back = $(
        '[data-settings-mobile-back]',
        layer
    );

    on(back, 'click', () => {
        layer.classList.remove('page');
    });

    $$(
        '[data-settings-type]',
        layer
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
        '[data-settings-content]',
        layer
    );
    const title = $(
        '[data-settings-title]',
        layer
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

    $$(
        '.settings-tab',
        layer
    ).forEach(tab => {
        tab.classList.toggle(
            'active',
            tab.dataset.settingsType === type
        );
    });
}

async function loadPage(type) {
    if (cache.has(type)) {
        return cache.get(type);
    }

    const html = await loadHtml(
        `/components/settings/${type}.html`
    );

    cache.set(type, html);

    return html;
}

function close() {
    if (!layer || layer.hidden) {
        return;
    }

    const popup = $('.settings-box', layer);

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

        focus?.focus?.({
            preventScroll: true
        });

        focus = null;
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
        `[data-${type}-scale-dropdown]`,
        layer
    );
    const btn = $(
        `[data-${type}-scale-trigger]`,
        layer
    );
    const text = $(
        `[data-${type}-scale-text]`,
        layer
    );
    const list = $$(
        `[data-${type}-scale]`,
        layer
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
            scalePick(
                type, key, button, text, drop, apply
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

function scalePick(
    type, key, button, text, drop, apply
) {
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
}

function screen() {
    return opt(
        OPTION.screenScale,
        DEFAULT_OPTION.screenScale
    );
}

function setScreen(value) {
    root.style.setProperty(
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
    root.style.setProperty(
        '--font-scale',
        value
    );
}

function bindReset() {
    const btn = $(
        '[data-settings-reset]',
        layer
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
    afterFrame(() => {
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

        body.style.setProperty(
            '--settings-drop-space',
            `${menu.offsetHeight + GAP}px`
        );

        const bodyRect = body.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const bottom = Math.max(
            parentRect.bottom,
            menuRect.bottom
        );

        const move = (
            bottom
            - bodyRect.bottom
            + GAP
        );

        if (move > 0) {
            body.scrollTop += move;
        }
    });
}

function parentMove(parent) {
    afterFrame(() => {
        const body = parent?.closest(
            '.settings-body'
        );

        if (!body || !parent) {
            return;
        }

        const bodyRect = body.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const move = (
            parentRect.bottom
            - bodyRect.bottom
            + GAP
        );

        if (move > 0) {
            body.scrollTop += move;
        }
    });
}

function afterFrame(callback) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
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

    $$(
        '.settings-size-dropdown.open',
        layer
    ).forEach(dropdown => {
        dropdown.classList.remove('open');
    });

    $$(
        '.settings-body',
        layer
    ).forEach(body => {
        body.style.removeProperty(
            '--settings-drop-space'
        );
    });
}

function dropTabClose(event, drop) {
    if (
        !drop?.classList.contains('open')
        || !lastTab(
            event,
            drop,
            '.settings-size-menu button'
        )
    ) {
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

    $$(
        '.settings-size-dropdown',
        layer
    ).forEach(dropdown => {
        dropdown.classList.remove('open');
    });
}

function setScale(type, value) {
    if (!layer) {
        return;
    }

    const text = $(
        `[data-${type}-scale-text]`,
        layer
    );

    const buttons = $$(
        `[data-${type}-scale]`,
        layer
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
    const btn = $(
        `[data-notify-toggle="${type}"]`,
        layer
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
        data = togglePick(
            key, btn, data
        );
    });
}

function togglePick(key, button, data) {
    const next = data === '1'
        ? '0'
        : '1';

    localStorage.setItem(
        key,
        next
    );

    setToggle(button, next);

    return next;
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