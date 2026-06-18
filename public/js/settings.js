import { $, on } from './dom.js';

let layer = null;

const SCREEN_SCALE_KEY = 'jjing-screen-scale';
const DEFAULT_SCREEN_SCALE = '1';

export function initSettings() {
    const button = $('.settings-button');

    applyScreenScale(
        getScreenScale()
    );

    on(button, 'click', openSettings);

    on(document, 'keydown', event => {
        if (event.key === 'Escape') {
            closeSettings();
        }
    });
}

async function openSettings() {
    if (!layer) {
        await loadSettings();
    }

    layer.hidden = false;

    await changeSettings('general');

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

    layer.querySelectorAll(
        '[data-settings-type]'
    ).forEach(tab => {
        on(tab, 'click', () => {
            changeSettings(
                tab.dataset.settingsType
            );
        });
    });
}

async function changeSettings(type) {
    const content = $('[data-settings-content]');
    const title = $('[data-settings-title]');
    const icon = $('[data-settings-title-icon]');

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
    if (!layer) {
        return;
    }

    layer.hidden = true;
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

        dropdown.classList.toggle('is-open');
    });

    on(document, 'click', event => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('is-open');
        }
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