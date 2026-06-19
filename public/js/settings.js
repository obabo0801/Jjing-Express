import { $, on } from './dom.js';
import {
    OPTION,
    DEFAULT_OPTION,
    getOption
} from './options.js';

let layer = null;

let lastFocus = null;

export function initSettings() {
    const button = $('.settings-button');

    applyScreenScale(
        getScreenScale()
    );

    applyFontScale(
        getFontScale()
    );

    on(button, 'click', openSettings);

    on(document, 'keydown', event => {
        closeSettingsEscape(event);
        trapSettingsFocus(event);
    });
}

async function openSettings() {
    lastFocus = document.activeElement;

    if (!layer) {
        await loadSettings();
    }

    layer.hidden = false;
    layer.classList.remove('is-close');
    layer.classList.add('is-open');

    document.body.classList.add(
        'is-settings-open'
    );

    await changeSettings(
        getSettingsType()
    );

    $('.settings-popup')?.focus();
}

async function loadSettings() {
    const html = await getHtml(
        '/components/settings/popup.html'
    );

    document.body.insertAdjacentHTML(
        'beforeend',
        html
    );

    layer = $('.settings-layer');

    bindSettings();
}

function bindSettings() {
    layer.querySelectorAll(
        '[data-settings-close]'
    ).forEach(button => {
        on(button, 'click', closeSettings);
    });

    on(document, 'click', event => {
        closeSettingsDropdowns(event);
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
            changeSettings(
                tab.dataset.settingsType
            );

            layer.classList.add('is-page');
        });
    });
}

async function changeSettings(type) {
    const content = $('[data-settings-content]');
    const title = $('[data-settings-title]');
    const icon = $('[data-settings-title-icon]');

    saveSettingsType(type);

    const name = type === 'notification'
        ? '알림'
        : '일반';

    const iconName = type === 'notification'
        ? 'icon icon-bell'
        : 'icon icon-setting';

    content.innerHTML = await getHtml(
        `/components/settings/${type}.html`
    );

    if (type === 'general') {
        bindGeneralSettings();
    }

    if (type === 'notification') {
        bindNotificationSettings();
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

function closeSettings() {
    if (!layer || layer.hidden) {
        return;
    }

    const popup = $('.settings-popup');

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

function closeSettingsEscape(event) {
    if (event.key !== 'Escape') {
        return;
    }

    closeSettings();
}

function trapSettingsFocus(event) {
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

function bindGeneralSettings() {
    bindScreenScale();
    bindFontScale();
    bindResetSettings();
}

function bindScreenScale() {
    const dropdown = $('[data-screen-scale-dropdown]');
    const trigger = $('[data-screen-scale-trigger]');
    const text = $('[data-screen-scale-text]');
    const buttons = document.querySelectorAll(
        '[data-screen-scale]'
    );

    if (!dropdown || !trigger || !text) {
        return;
    }

    const current = getScreenScale();

    text.textContent = getScaleText(current);

    buttons.forEach(button => {
        const active = button.dataset.screenScale
            === current;

        button.classList.toggle(
            'is-active',
            active
        );

        on(button, 'click', () => {
            const value = button.dataset.screenScale;

            saveScreenScale(value);
            applyScreenScale(value);

            text.textContent = getScaleText(value);
            dropdown.classList.remove('is-open');

            buttons.forEach(item => {
                item.classList.toggle(
                    'is-active',
                    item === button
                );
            });
        });
    });

    on(trigger, 'click', event => {
        event.stopPropagation();

        toggleSettingsDropdown(dropdown);
    });
}

function getScreenScale() {
    return localStorage.getItem(SCREEN_SCALE_KEY)
        || DEFAULT_SCREEN_SCALE;
}

function saveScreenScale(value) {
    localStorage.setItem(
        SCREEN_SCALE_KEY,
        value
    );
}

function applyScreenScale(value) {
    document.documentElement.style.setProperty(
        '--screen-scale',
        value
    );
}

function getScaleText(value) {
    return `${Math.round(Number(value) * 100)}%`;
}

function bindFontScale() {
    const dropdown = $('[data-font-scale-dropdown]');
    const trigger = $('[data-font-scale-trigger]');
    const text = $('[data-font-scale-text]');
    const buttons = document.querySelectorAll(
        '[data-font-scale]'
    );

    if (!dropdown || !trigger || !text) {
        return;
    }

    const current = getFontScale();

    text.textContent = getScaleText(current);

    buttons.forEach(button => {
        const active = button.dataset.fontScale
            === current;

        button.classList.toggle(
            'is-active',
            active
        );

        on(button, 'click', () => {
            const value = button.dataset.fontScale;

            saveFontScale(value);
            applyFontScale(value);

            text.textContent = getScaleText(value);
            dropdown.classList.remove('is-open');

            buttons.forEach(item => {
                item.classList.toggle(
                    'is-active',
                    item === button
                );
            });
        });
    });

    on(trigger, 'click', event => {
        event.stopPropagation();

        toggleSettingsDropdown(dropdown);
    });
}

function getFontScale() {
    return localStorage.getItem(FONT_SCALE_KEY)
        || DEFAULT_FONT_SCALE;
}

function saveFontScale(value) {
    localStorage.setItem(
        FONT_SCALE_KEY,
        value
    );
}

function applyFontScale(value) {
    document.documentElement.style.setProperty(
        '--font-scale',
        value
    );
}

function bindResetSettings() {
    const button = $('[data-settings-reset]');

    on(button, 'click', resetGeneralSettings);
}

function toggleSettingsDropdown(dropdown) {
    const open = dropdown.classList.contains('is-open');

    closeSettingsDropdowns();

    dropdown.classList.toggle(
        'is-open',
        !open
    );
}

function closeSettingsDropdowns(event) {
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

function resetGeneralSettings() {
    localStorage.removeItem(SCREEN_SCALE_KEY);
    localStorage.removeItem(FONT_SCALE_KEY);

    applyScreenScale(DEFAULT_SCREEN_SCALE);
    applyFontScale(DEFAULT_FONT_SCALE);

    updateScaleView(
        'screen',
        DEFAULT_SCREEN_SCALE
    );

    updateScaleView(
        'font',
        DEFAULT_FONT_SCALE
    );

    document.querySelectorAll(
        '.settings-size-dropdown'
    ).forEach(dropdown => {
        dropdown.classList.remove('is-open');
    });
}

function updateScaleView(type, value) {
    const text = document.querySelector(
        `[data-${type}-scale-text]`
    );

    const buttons = document.querySelectorAll(
        `[data-${type}-scale]`
    );

    if (text) {
        text.textContent = getScaleText(value);
    }

    buttons.forEach(button => {
        button.classList.toggle(
            'is-active',
            button.dataset[`${type}Scale`] === value
        );
    });
}

function bindNotificationSettings() {
    bindNotifyToggle(
        'enable',
        NOTIFY_ENABLE_KEY,
        DEFAULT_NOTIFY_ENABLE
    );

    bindNotifyToggle(
        'sound',
        NOTIFY_SOUND_KEY,
        DEFAULT_NOTIFY_SOUND
    );
}

function bindNotifyToggle(type, key, defaultValue) {
    const button = document.querySelector(
        `[data-notify-toggle="${type}"]`
    );

    if (!button) {
        return;
    }

    let value = localStorage.getItem(key)
        || defaultValue;

    updateNotifyToggle(button, value);

    on(button, 'click', () => {
        value = value === '1'
            ? '0'
            : '1';

        localStorage.setItem(
            key,
            value
        );

        updateNotifyToggle(button, value);
    });
}

function updateNotifyToggle(button, value) {
    const off = value !== '1';

    button.classList.toggle(
        'is-off',
        off
    );

    button.textContent = off
        ? '꺼짐'
        : '켜짐';
}

function getSettingsType() {
    return localStorage.getItem(
        SETTINGS_TYPE_KEY
    ) || DEFAULT_SETTINGS_TYPE;
}

function saveSettingsType(type) {
    localStorage.setItem(
        SETTINGS_TYPE_KEY,
        type
    );
}