import { $, on } from './dom.js';
import {
    OPTION,
    DEFAULT_OPTION,
    getOption
} from './options.js';

let layer = null;

let lastFocus = null;

export function initSettings() {
    const btn = $(
        '.settings-button'
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
        trapFocus(event);
    });
}

async function open() {
    lastFocus = document.activeElement;

    if (!layer) {
        await load();
    }

    layer.hidden = false;
    layer.classList.remove('is-close');
    layer.classList.add('is-open');

    document.body.classList.add(
        'is-settings-open'
    );

    await change(
        getType()
    );

    $('.settings-panel')?.focus();
}

async function load() {
    const html = await getHtml(
        '/components/settings/popup.html'
    );

    document.body.insertAdjacentHTML(
        'beforeend',
        html
    );

    layer = $('.settings');

    bind();
}

function bind() {
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
        layer.classList.remove('is-page');
    });

    layer.querySelectorAll(
        '[data-settings-type]'
    ).forEach(tab => {
        on(tab, 'click', () => {
            change(
                tab.dataset.settingsType
            );

            layer.classList.add('is-page');
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
    const icon = $(
        '[data-settings-title-icon]'
    );

    saveType(type);

    const name = type === 'notification'
        ? '알림'
        : '일반';

    const iconName = type === 'notification'
        ? 'icon icon-bell'
        : 'icon icon-setting';

    body.innerHTML = await getHtml(
        `/components/settings/${type}.html`
    );

    if (type === 'general') {
        bindGeneral();
    }

    if (type === 'notification') {
        bindNotify();
    }

    title.textContent = name;
    icon.className = iconName;

    document.querySelectorAll(
        '.settings-tab'
    ).forEach(tab => {
        tab.classList.toggle(
            'is-active',
            tab.dataset.settingsType === type
        );
    });
}

function close() {
    if (!layer || layer.hidden) {
        return;
    }

    const popup = $('.settings-panel');

    layer.classList.remove('is-open');
    layer.classList.add('is-close');

    const done = () => {
        layer.hidden = true;
        layer.classList.remove(
            'is-close',
            'is-page'
        );

        document.body.classList.remove(
            'is-settings-open'
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

function trapFocus(event) {
    if (
        event.key !== 'Tab'
        || !layer
        || layer.hidden
    ) {
        return;
    }

    const focusList = [
        ...layer.querySelectorAll(
            'button, a, input, textarea, select, '
            + '[tabindex]:not([tabindex="-1"])'
        )
    ].filter(item => {
        return !item.disabled
            && item.offsetParent !== null;
    });

    if (!focusList.length) {
        return;
    }

    const first = focusList[0];
    const last = focusList[
        focusList.length - 1
    ];

    if (
        event.shiftKey
        && document.activeElement === first
    ) {
        event.preventDefault();
        last.focus();
        return;
    }

    if (
        !event.shiftKey
        && document.activeElement === last
    ) {
        event.preventDefault();
        first.focus();
    }
}

async function getHtml(url) {
    const response = await fetch(url);

    if (!response.ok) {
        return '';
    }

    return response.text();
}

function bindGeneral() {
    bindScreen();
    bindFont();
    bindReset();
}

function bindScreen() {
    const drop = $(
        '[data-screen-scale-dropdown]'
    );
    const btn = $(
        '[data-screen-scale-trigger]'
    );
    const text = $(
        '[data-screen-scale-text]'
    );
    const list = document.querySelectorAll(
        '[data-screen-scale]'
    );

    if (!drop || !btn || !text) {
        return;
    }

    const current = getScreen();

    text.textContent = scaleText(current);

    list.forEach(button => {
        const active = button.dataset.screenScale
            === current;

        button.classList.toggle(
            'is-active',
            active
        );

        on(button, 'click', () => {
            const value = button.dataset.screenScale;

            saveScreen(value);
            applyScreen(value);

            text.textContent = scaleText(value);
            drop.classList.remove('is-open');

            list.forEach(item => {
                item.classList.toggle(
                    'is-active',
                    item === button
                );
            });
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

function saveScreen(value) {
    localStorage.setItem(
        OPTION.screenScale,
        value
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

function bindFont() {
    const drop = $(
        '[data-font-scale-dropdown]'
    );
    const btn = $(
        '[data-font-scale-trigger]'
    );
    const text = $(
        '[data-font-scale-text]'
    );
    const list = document.querySelectorAll(
        '[data-font-scale]'
    );

    if (!drop || !btn || !text) {
        return;
    }

    const current = getFont();

    text.textContent = scaleText(current);

    list.forEach(button => {
        const active = button.dataset.fontScale
            === current;

        button.classList.toggle(
            'is-active',
            active
        );

        on(button, 'click', () => {
            const value = button.dataset.fontScale;

            saveFont(value);
            applyFont(value);

            text.textContent = scaleText(value);
            drop.classList.remove('is-open');

            list.forEach(item => {
                item.classList.toggle(
                    'is-active',
                    item === button
                );
            });
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

function getFont() {
    return getOption(
        OPTION.fontScale,
        DEFAULT_OPTION.fontScale
    );
}

function saveFont(value) {
    localStorage.setItem(
        OPTION.fontScale,
        value
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
    const open = dropdown.classList.contains('is-open');

    closeDropdowns();

    dropdown.classList.toggle(
        'is-open',
        !open
    );
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
        '.settings-size-dropdown.is-open'
    ).forEach(dropdown => {
        dropdown.classList.remove('is-open');
    });
}

function closeDropTab(event, dropdown) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !dropdown.classList.contains('is-open')
    ) {
        return;
    }

    const buttons = [
        ...dropdown.querySelectorAll(
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

    dropdown.classList.remove('is-open');
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

    document.querySelectorAll(
        '.settings-size-dropdown'
    ).forEach(dropdown => {
        dropdown.classList.remove('is-open');
    });
}

function updateScale(type, value) {
    const text = document.querySelector(
        `[data-${type}-scale-text]`
    );

    const buttons = document.querySelectorAll(
        `[data-${type}-scale]`
    );

    if (text) {
        text.textContent = scaleText(value);
    }

    buttons.forEach(button => {
        button.classList.toggle(
            'is-active',
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

function bindToggle(type, key, defaultValue) {
    const btn = document.querySelector(
        `[data-notify-toggle="${type}"]`
    );

    if (!btn) {
        return;
    }

    let value = getOption(
        key,
        defaultValue
    );

    updateToggle(btn, value);

    on(btn, 'click', () => {
        value = value === '1'
            ? '0'
            : '1';

        localStorage.setItem(
            key,
            value
        );

        updateToggle(btn, value);
    });
}

function updateToggle(button, value) {
    const off = value !== '1';

    button.classList.toggle(
        'is-off',
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