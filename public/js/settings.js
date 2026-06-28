import {
    $, $$, on, esc, lastTab
} from './dom.js';

import {
    OPTION, DEFAULT_OPTION,
    opt
} from './options.js';

const cache = new Map();
const GAP = 32;

let layer = null;
let focus = null;

export function initSetting() {
    const btn = $(
        '.settings > .tool'
    );

    layer = $('.settings-layer');

    setScreen(
        screen()
    );

    setFont(
        font()
    );

    bind();

    on(btn, 'click', open);
}

async function open() {
    focus = document.activeElement;

    const type = typeNow();
    const body = $(
        '[data-settings-content]',
        layer
    );
    const title = $(
        '[data-settings-title]',
        layer
    );

    if (!cache.has(type)) {
        title.textContent = '설정';

        body.innerHTML = (
            '<div class="settings-loading">'
            + '<img class="settings-throbber" '
            + 'src="/assets/icons/throbber.svg" '
            + 'draggable="false">'
            + '</div>'
        );

        layer.hidden = false;
        layer.classList.remove('close');
        layer.classList.add('open');

        document.body.classList.add(
            'settings-open'
        );

        $('.settings-box', layer)?.focus();

        await change(type);

        return;
    }

    await change(type);

    layer.hidden = false;
    layer.classList.remove('close');
    layer.classList.add('open');

    document.body.classList.add(
        'settings-open'
    );

    $('.settings-box', layer)?.focus();
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

    const prev = $(
        '[data-settings-mobile-back]',
        layer
    );

    on(prev, 'click', () => {
        pageClose();
    });

    $$(
        '[data-settings-type]',
        layer
    ).forEach(tab => {
        on(tab, 'click', () => {
            const type = tab.dataset.settingsType;

            if (type !== typeNow()) {
                change(type);
            }

            pageOpen();
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

    const bindPage = type === 'general'
        ? bindBase
        : bindAlarm;

    bindPage();

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

function pageOpen() {
    if (!layer || layer.classList.contains('page')) {
        return;
    }

    layer.classList.add('page');
}

function pageClose() {
    if (!layer?.classList.contains('page')) {
        return;
    }

    dropClose();

    layer.classList.remove('page');
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

function close(keep = true) {
    if (
        !layer || layer.hidden
        || layer.classList.contains('close')
    ) {
        return;
    }

    const popup = $('.settings-box', layer);

    if (layer.contains(
        document.activeElement
    )) {
        document.activeElement.blur();
    }

    dropClose();

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

        if (keep) {
            focus?.focus?.({
                preventScroll: true
            });
        } else {
            focus?.blur?.();
        }

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
    dropClose();

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
    document.documentElement
        .style.setProperty(
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
    document.documentElement
        .style.setProperty(
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

        body.style.removeProperty(
            '--settings-drop-space'
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

        if (move <= 0) {
            return;
        }

        body.style.setProperty(
            '--settings-drop-space',
            `${menu.offsetHeight + GAP}px`
        );

        body.scrollTop += move;
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

    const opened = $$(
        '.settings-size-dropdown.open',
        layer
    );

    if (!opened.length) {
        return;
    }

    opened.forEach(dropdown => {
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

    event.preventDefault();
    dropClose();
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

    dropClose();
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

function mobile() {
    return matchMedia(
        '(max-width: 640px)'
    ).matches;
}