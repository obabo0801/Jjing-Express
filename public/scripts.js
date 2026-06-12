const themeButton = document.querySelector('.theme-button');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';

setTheme(savedTheme);

requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
});

themeButton?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(nextTheme);
});

function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
}

const notification = document.querySelector('.notification');
const notificationButton = document.querySelector('.notification-button');

notificationButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    notification?.classList.toggle('is-open');
});

document.addEventListener('click', (event) => {
    if (!notification?.contains(event.target)) {
        notification?.classList.remove('is-open');
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        notification?.classList.remove('is-open');
        closeSettingsPopup();
    }
});

const settingsButton = document.querySelector('.settings-button');

const SETTINGS_PAGES = {
    general: '/components/settings/general.html',
    notification: '/components/settings/notification.html'
};

const SETTINGS_TITLES = {
    general: '일반',
    notification: '알림'
};

const SETTINGS_ICONS = {
    general: 'icon-setting',
    notification: 'icon-bell'
};

const settingsCache = new Map();

settingsButton?.addEventListener('click', (event) => {
    event.stopPropagation();

    notification?.classList.remove('is-open');

    const type = settingsButton.dataset.settingsOpen;

    openSettingsType(type || 'general');
});

function normalizeSettingsHash() {
    if (location.hash === '#settings') {
        location.hash = 'settings?type=general';
        return true;
    }

    return false;
}

window.addEventListener('hashchange', async () => {
    if (normalizeSettingsHash()) {
        return;
    }

    const type = getSettingsType();

    if (!type) {
        closeSettingsPopup(false);
        return;
    }

    await openSettingsPopup();
    await loadSettingsContent(type);
});

function openSettingsType(type) {
    location.hash = `settings?type=${type}`;
}

function getSettingsType() {
    if (!location.hash.startsWith('#settings')) {
        return null;
    }

    const query = location.hash.split('?')[1] || '';
    const type = new URLSearchParams(query).get('type') || 'general';

    return SETTINGS_PAGES[type] ? type : 'general';
}

async function openSettingsPopup() {
    if (document.querySelector('.settings-layer')) {
        return;
    }

    try {
        const response = await fetch('/components/settings.html');

        if (!response.ok) {
            throw new Error('설정 팝업을 불러오지 못했습니다.');
        }

        const html = await response.text();

        document.body.insertAdjacentHTML('beforeend', html);
        document.body.style.overflow = 'hidden';

        const layer = document.querySelector('.settings-layer');

        layer?.addEventListener('click', (event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            if (target.closest('[data-settings-close]')) {
                closeSettingsPopup();
                return;
            }

            const tab = target.closest('[data-settings-type]');

            if (!tab) {
                return;
            }

            const type = tab.dataset.settingsType;

            if (!SETTINGS_PAGES[type]) {
                return;
            }

            if (getSettingsType() === type) {
                loadSettingsContent(type);
                return;
            }

            openSettingsType(type);
        });
    } catch (error) {
        console.error(error);
    }
}

async function loadSettingsContent(type) {
    const layer = document.querySelector('.settings-layer');
    const content = layer?.querySelector('[data-settings-content]');

    if (!layer || !content) {
        return;
    }

    layer.querySelectorAll('.settings-tab').forEach((tab) => {
        tab.classList.toggle(
            'is-active',
            tab.dataset.settingsType === type
        );
    });
    const icon = layer.querySelector('[data-settings-title-icon]');

    if (icon) {
        icon.className = `icon ${SETTINGS_ICONS[type] || 'icon-setting'}`;
    }

    const title = layer.querySelector('[data-settings-title]');

    if (title) {
        title.textContent = SETTINGS_TITLES[type] || '설정';
    }

    content.innerHTML = `
        <div class="settings-loading">
            <span class="settings-spinner icon icon-setting"></span>
        </div>
    `;

    try {
        let html = settingsCache.get(type);

        if (!html) {
            const response = await fetch(SETTINGS_PAGES[type]);

            if (!response.ok) {
                throw new Error('설정 내용을 불러오지 못했습니다.');
            }

            html = await response.text();
            settingsCache.set(type, html);
        }

        content.innerHTML = html;
    } catch (error) {
        console.error(error);
        content.innerHTML = '<p class="settings-empty">설정을 불러오지 못했습니다.</p>';
    }
}

function closeSettingsPopup(updateHash = true) {
    document.querySelector('.settings-layer')?.remove();
    document.body.style.overflow = '';

    if (updateHash && location.hash.startsWith('#settings')) {
        history.replaceState(null, '',
            location.pathname + location.search
        );
    }
}

if (!normalizeSettingsHash()) {
    const initialSettingsType = getSettingsType();

    if (initialSettingsType) {
        openSettingsPopup().then(() => {
            loadSettingsContent(initialSettingsType);
        });
    }
}