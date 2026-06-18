import { $, on } from './dom.js';

let layer = null;

export function initSettings() {
    const button = $('.settings-button');

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