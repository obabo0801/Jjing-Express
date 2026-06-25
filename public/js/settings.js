import { $, on } from './dom.js';
import {
    OPTION,
    DEFAULT_OPTION,
    getOption
} from './options.js';

const pageCache = new Map();

let layer = null;

let lastFocus = null;

export function initSettings() {
    const btn = $(
        '.settings > .tool'
    );

    applyScreen(
        getScreen()
    );

    applyFont(
        getFont()
    );

    on(btn, 'click', open);

    on(document, 'keydown', event => {
        closeEsc(event);
        closeTabEnd(event);
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
        getType()
    );

    $('.settings-box')?.focus();
}

async function load() {
    const html = await getHtml(
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
        closeDropdowns(event);
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

    body.innerHTML = await getPage(type);

    if (type === 'general') {
        bindGeneral();
    }

    if (type === 'notification') {
        bindNotify();
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

async function getPage(type) {
    if (pageCache.has(type)) {
        return pageCache.get(type);
    }

    const html = await getHtml(
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

function closeEsc(event) {
    if (event.key !== 'Escape') {
        return;
    }

    close();
}

function closeTabEnd(event) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !layer
        || layer.hidden
    ) {
        return;
    }

    const focusList = [
        ...layer.querySelectorAll(
            'button, a, input, textarea, select'
        )
    ].filter(item => {
        return !item.disabled
            && item.offsetParent !== null;
    });

    const last = focusList[
        focusList.length - 1
    ];

    if (document.activeElement !== last) {
        return;
    }

    event.preventDefault();

    close();
}

async function getHtml(url) {
    const response = await fetch(url);

    if (!response.ok) {
        return '';
    }

    return response.text();
}

function bindGeneral() {
    bindScale(
        'screen',
        OPTION.screenScale,
        DEFAULT_OPTION.screenScale,
        applyScreen
    );

    bindScale(
        'font',
        OPTION.fontScale,
        DEFAULT_OPTION.fontScale,
        applyFont
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

    const current = getOption(
        key,
        value
    );

    text.textContent = scaleText(current);
    updateScale(type, current);

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

            text.textContent = scaleText(data);
            drop.classList.remove('open');

            updateScale(type, data);

            moveParent(
                button.closest('.settings-item')
            );
        });
    });

    on(btn, 'click', event => {
        event.stopPropagation();

        toggleDrop(drop);
    });

    on(drop, 'keydown', event => {
        closeDropTab(event, drop);
    });
}

function getScreen() {
    return getOption(
        OPTION.screenScale,
        DEFAULT_OPTION.screenScale
    );
}

function applyScreen(value) {
    document.documentElement.style.setProperty(
        '--screen-scale',
        value
    );
}

function scaleText(value) {
    return `${Math.round(Number(value) * 100)}%`;
}

function getFont() {
    return getOption(
        OPTION.fontScale,
        DEFAULT_OPTION.fontScale
    );
}

function applyFont(value) {
    document.documentElement.style.setProperty(
        '--font-scale',
        value
    );
}

function bindReset() {
    const btn = $(
        '[data-settings-reset]'
    );

    on(btn, 'click', resetGeneral);
}

function toggleDrop(dropdown) {
    const open = dropdown.classList.contains('open');

    closeDropdowns();

    const next = !open;

    dropdown.classList.toggle(
        'open',
        next
    );

    if (next) {
        moveDrop(dropdown);
    }
}

function moveDrop(dropdown) {
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

            if (!body || !parent) {
                return;
            }

            const bodyRect = body.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const menuRect = menu?.getBoundingClientRect();

            const bottom = Math.max(
                parentRect.bottom,
                menuRect?.bottom ?? parentRect.bottom
            );

            const gap = 16;
            const move = bottom - bodyRect.bottom + gap;

            if (move > 0) {
                body.scrollTop += move;
            }
        });
    });
}

function moveParent(parent) {
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

            const gap = 16;
            const move = parentRect.bottom - bodyRect.bottom + gap;

            if (move > 0) {
                body.scrollTop += move;
            }
        });
    });
}

function closeDropdowns(event) {
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
}

function closeDropTab(event, drop) {
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

function resetGeneral() {
    localStorage.removeItem(OPTION.screenScale);
    localStorage.removeItem(OPTION.fontScale);

    applyScreen(DEFAULT_OPTION.screenScale);
    applyFont(DEFAULT_OPTION.fontScale);

    updateScale(
        'screen',
        DEFAULT_OPTION.screenScale
    );

    updateScale(
        'font',
        DEFAULT_OPTION.fontScale
    );

    layer.querySelectorAll(
        '.settings-size-dropdown'
    ).forEach(dropdown => {
        dropdown.classList.remove('open');
    });
}

function updateScale(type, value) {
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
        text.textContent = scaleText(value);
    }

    buttons.forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset[`${type}Scale`] === value
        );
    });
}

function bindNotify() {
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

    let data = getOption(
        key,
        value
    );

    updateToggle(btn, data);

    on(btn, 'click', () => {
        data = data === '1'
            ? '0'
            : '1';

        localStorage.setItem(
            key,
            data
        );

        updateToggle(btn, data);
    });
}

function updateToggle(button, data) {
    const off = data !== '1';

    button.classList.toggle(
        'off',
        off
    );

    button.textContent = off
        ? '꺼짐'
        : '켜짐';
}

function getType() {
    return getOption(
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