const themeButton = document.querySelector('.theme-button');
const root = document.documentElement;

registerServiceWorker();

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.register('/service-worker.js');
    } catch {
        return null;
    }
}

const savedTheme = localStorage.getItem('theme');

setTheme(savedTheme || getSystemTheme(), false);

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

systemTheme.addEventListener('change', () => {
    setTheme(getSystemTheme(), false);
});

requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
});

themeButton?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(nextTheme);
});

function setTheme(theme, save = true) {
    root.dataset.theme = theme;

    if (save) {
        localStorage.setItem('theme', theme);
    }
}

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

const settingsMobileQuery = window.matchMedia('(max-width: 768px)');

function syncSettingsMobileView() {
    const layer = document.querySelector('.settings-layer');

    if (!layer) {
        return;
    }

    if (!settingsMobileQuery.matches) {
        layer.classList.remove('is-detail');
        return;
    }

    const type = getSettingsType();

    if (type) {
        layer.classList.add('is-detail');
    }
}

settingsMobileQuery.addEventListener('change', syncSettingsMobileView);

settingsMobileQuery.addEventListener('change', () => {
    const layer = document.querySelector('.settings-layer');

    if (!layer) {
        return;
    }

    if (settingsMobileQuery.matches) {
        layer.classList.add('is-detail');
        return;
    }

    layer.classList.remove('is-detail');
});

const savedScreenScale = localStorage.getItem('screenScale');

setScreenScale(savedScreenScale || '1', false);

function setScreenScale(scale, save = true) {
    root.style.setProperty('--screen-scale', scale);

    if (save) {
        localStorage.setItem('screenScale', scale);
    }

    document.querySelectorAll('[data-screen-scale-dropdown]').forEach((dropdown) => {
        const text = dropdown.querySelector('[data-screen-scale-text]');

        if (text) {
            text.textContent = `${Math.round(Number(scale) * 100)}%`;
        }

        dropdown.querySelectorAll('[data-screen-scale]').forEach((button) => {
            button.classList.toggle(
                'is-active',
                button.dataset.screenScale === scale
            );
        });
    });
}

const notification = document.querySelector('.notification');
const notificationButton = document.querySelector('.notification-button');
const notificationBadge = document.querySelector('[data-notification-count]');
const notificationList = document.querySelector('.notification-list');

const notifications = [];

let notificationIndex = 0;

notificationButton?.addEventListener('click', (event) => {
    event.stopPropagation();

    notification?.classList.toggle('is-open');
});

notificationList?.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const moreButton = target.closest('[data-notification-more]');

    if (moreButton) {
        event.preventDefault();
        event.stopPropagation();

        const more = moreButton.closest('.notification-more');

        document.querySelectorAll('.notification-more.is-open').forEach((item) => {
            if (item !== more) {
                item.classList.remove('is-open');
            }
        });

        more?.classList.toggle('is-open');
        return;
    }

    const readButton = target.closest('[data-notification-read]');

    if (readButton) {
        event.preventDefault();
        event.stopPropagation();

        readNotification(readButton.dataset.notificationRead);
        closeNotificationDropdowns();
        return;
    }

    const removeButton = target.closest('[data-notification-remove]');

    if (removeButton) {
        event.preventDefault();
        event.stopPropagation();

        removeNotification(removeButton.dataset.notificationRemove);
        closeNotificationDropdowns();
    }
});

function playNotificationBadgePop() {
    if (!notificationBadge) {
        return;
    }

    notificationBadge.classList.remove('is-pop');

    void notificationBadge.offsetWidth;

    notificationBadge.classList.add('is-pop');

    notificationBadge.addEventListener('animationend', () => {
        notificationBadge.classList.remove('is-pop');
    }, {
        once: true
    });
}

function updateNotificationCount() {
    const unreadCount = notifications
        .filter((item) => !item.read).length;

    if (!notificationBadge) {
        return;
    }

    if (unreadCount <= 0) {
        notificationBadge.textContent = '0';
        notificationBadge.style.display = 'none';
        return;
    }

    notificationBadge.textContent = unreadCount > 99
        ? '99+'
        : String(unreadCount);

    notificationBadge.style.display = 'grid';

    playNotificationBadgePop();
}

function addNotification({
    title,
    message,
    href = '#',
    profile = {},
    info = {},
    thumbnail = null,
    createdAt = Date.now()
} = {}) {
    const item = {
        id: ++notificationIndex,
        read: false,
        href,
        isNew: true,

        profile: {
            href: profile.href || '',
            image: profile.image || '/favicon.ico'
        },
        info: {
            title: info.title || title || '알림',
            message: info.message || message || ''
        },
        thumbnail: thumbnail?.image ? {
            image: thumbnail.image
        } : null,
        createdAt
    };

    notifications.unshift(item);

    renderNotifications();
    updateNotificationCount();

//    showServiceNotification({
//        title: item.info.title,
//        message: item.info.message
//    });
}

function getTimeAgo(createdAt) {
    const diff = Math.max(0, Date.now() - createdAt);
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (day > 0) {
        return `${day}일 전`;
    }

    if (hour > 0) {
        return `${hour}시간 전`;
    }

    if (min > 0) {
        return `${min}분 전`;
    }

    return `${sec}초 전`;
}

function getDateKey(createdAt) {
    const date = new Date(createdAt);

    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ].join('-');
}

function getNotificationDateLabel(createdAt) {
    const date = new Date(createdAt);
    const today = new Date();

    const isToday =
        date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();

    if (isToday) {
        return '오늘';
    }

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function renderNotifications() {
    if (!notificationList) {
        return;
    }
    
    const visibleNotifications = notificationFilter === 'unread'
        ? notifications.filter((item) => !item.read)
        : notifications;

    if (!visibleNotifications.length) {
        notificationList.innerHTML = `
            <p class="notification-empty">
                ${notificationFilter === 'unread'
                    ? '미확인 알림이 없습니다.'
                    : '받은 알림이 없습니다.'}
            </p>
        `;
        return;
    }

    let lastDateKey = '';

    notificationList.innerHTML = visibleNotifications.map((item) => {
        const hasThumbnail = item.thumbnail?.image;
        const dateKey = getDateKey(item.createdAt);

        const dateTitle = lastDateKey !== dateKey
            ? `<div class="notification-date">`
                + `${getNotificationDateLabel(item.createdAt)}</div>`
            : '';

        lastDateKey = dateKey;

        return `
            ${dateTitle}

            <div
                class="notification-item${hasThumbnail
                    ? ' has-thumbnail'
                    : ''} ${item.read ? 'is-read' : 'is-unread'} ${item.isNew ? 'is-new' : ''}"
                data-notification-id="${item.id}"
            >
                ${item.profile.href ? `
                    <a class="notification-profile" href="${item.profile.href}" onclick="readNotification(${item.id})">
                        <img
                            src="${item.profile.image || '/favicon.ico'}"
                            onerror="this.src='/favicon.ico'"
                        >
                    </a>
                ` : `
                    <div class="notification-profile">
                        <img
                            src="${item.profile.image || '/favicon.ico'}"
                            onerror="this.src='/favicon.ico'"
                        >
                    </div>
                `}

                <a class="notification-info" href="${item.href}" onclick="readNotification(${item.id})">
                    <strong>${item.info.title}</strong>
                    <p>${item.info.message}</p>
                    <span>${getTimeAgo(item.createdAt)}</span>
                </a>

                ${hasThumbnail ? `
                    <a class="notification-thumbnail" href="${item.href}" tabindex="-1" onclick="readNotification(${item.id})">
                        <img src="${item.thumbnail.image}">
                    </a>
                ` : ''}

                <div class="notification-more">
                    <button class="notification-more-button" type="button" data-notification-more="${item.id}">
                        ⋮
                    </button>

                    <div class="notification-dropdown">
                        <button type="button" data-notification-read="${item.id}">
                            <span class="dropdown-icon icon-read"></span>
                            알림 읽기
                        </button>

                        <button type="button" data-notification-remove="${item.id}">
                            <span class="dropdown-icon icon-delete"></span>
                            알림 지우기
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    visibleNotifications.forEach((item) => {
        item.isNew = false;
    });
}

function readNotification(id) {
    const item = notifications.find(
        (notification) => notification.id === Number(id)
    );

    if (!item || item.read) {
        return;
    }

    item.read = true;

    renderNotifications();
    updateNotificationCount();
}

function removeNotification(id) {
    const index = notifications.findIndex(
        (notification) => notification.id === Number(id)
    );

    if (index < 0) {
        return;
    }

    notifications.splice(index, 1);

    renderNotifications();
    updateNotificationCount();
}

function closeNotificationDropdowns() {
    document.querySelectorAll(
        '.notification-more.is-open'
    ).forEach((item) => {
        item.classList.remove('is-open');
    });
}

document.addEventListener('click', (event) => {
    if (!notification?.contains(event.target)) {
        notification?.classList.remove('is-open');
    }

    if (!(event.target instanceof Element)) {
        return;
    }

    if (!event.target.closest('.notification-more')) {
        closeNotificationDropdowns();
    }

    if (!event.target.closest('[data-screen-scale-dropdown]')) {
        document.querySelectorAll('[data-screen-scale-dropdown].is-open').forEach((item) => {
            item.classList.remove('is-open');
        });
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        notification?.classList.remove('is-open');
        closeSettingsPopup();
        return;
    }

    if (event.key === 'Tab') {
        document.body.classList.add('is-tab-mode');
        trapSettingsTab(event);
    }
});

document.addEventListener('pointerdown', () => {
    document.body.classList.remove('is-tab-mode');
});

const SETTINGS = {
    general: {
        title: '일반',
        icon: 'icon-setting',
        page: '/components/settings/general.html'
    },
    notification: {
        title: '알림',
        icon: 'icon-bell',
        page: '/components/settings/notification.html'
    }
};

let notificationFilter = 'all';

const notificationFilterButtons = document.querySelectorAll('[data-notification-filter]');
const notificationReadAllButton = document.querySelector('[data-notification-read-all]');
const notificationClearAllButton = document.querySelector('[data-notification-clear-all]');

notificationFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        notificationFilter = button.dataset.notificationFilter;

        notificationFilterButtons.forEach((item) => {
            item.classList.toggle('is-active', item === button);
        });

        renderNotifications();
    });
});

notificationReadAllButton?.addEventListener('click', () => {
    notifications.forEach((item) => {
        item.read = true;
    });

    renderNotifications();
    updateNotificationCount();
});

notificationClearAllButton?.addEventListener('click', () => {
    notifications.length = 0;

    renderNotifications();
    updateNotificationCount();
});

const settingsCache = new Map();

const SETTINGS_FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

let beforeSettingsFocus = null;

function getSettingsFocusableElements() {
    const layer = document.querySelector('.settings-layer');

    if (!layer) {
        return [];
    }

    return [...layer.querySelectorAll(SETTINGS_FOCUSABLE_SELECTOR)]
        .filter((element) => {
            return element instanceof HTMLElement
                && element.offsetParent !== null;
        });
}

function trapSettingsTab(event) {
    const layer = document.querySelector('.settings-layer');

    if (!layer) {
        return;
    }

    const focusableElements = getSettingsFocusableElements();

    if (!focusableElements.length) {
        event.preventDefault();

        layer.querySelector('.settings-popup')?.focus();
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!layer.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

document.querySelectorAll('.settings-button').forEach((button) => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();

        notification?.classList.remove('is-open');

        const type = button.dataset.settingsOpen || 'general';

        openSettingsType(type);
    });
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

    syncSettingsMobileView();

    const layer = document.querySelector('.settings-layer');

    if (
        window.matchMedia('(max-width: 768px)').matches
        && type === 'notification'
    ) {
        layer?.classList.add('is-detail');
    }
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

    return SETTINGS[type] ? type : 'general';
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

        beforeSettingsFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        document.body.insertAdjacentHTML('beforeend', html);
        document.body.style.overflow = 'hidden';

        const layer = document.querySelector('.settings-layer');

        requestAnimationFrame(() => {
            layer?.querySelector('.settings-popup')?.focus({
                preventScroll: true
            });
        });

        layer?.addEventListener('click', (event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            if (target.closest('[data-settings-close]')) {
                closeSettingsPopup();
                return;
            }

            const mobileBack = target.closest('[data-settings-mobile-back]');

            if (mobileBack) {
                layer.classList.remove('is-detail');
                return;
            }

            const tab = target.closest('[data-settings-type]');

            if (!tab) {
                return;
            }

            const type = tab.dataset.settingsType;

            if (window.matchMedia('(max-width: 768px)').matches) {
                layer.classList.add('is-detail');
            }

            openSettingsType(type);
        });

        const sizeTrigger = target.closest('[data-screen-scale-trigger]');

        if (sizeTrigger) {
            const dropdown = sizeTrigger.closest('[data-screen-scale-dropdown]');

            document.querySelectorAll('[data-screen-scale-dropdown].is-open').forEach((item) => {
                if (item !== dropdown) {
                    item.classList.remove('is-open');
                }
            });

            dropdown?.classList.toggle('is-open');
            return;
        }

        const sizeButton = target.closest('[data-screen-scale]');

        if (sizeButton) {
            setScreenScale(sizeButton.dataset.screenScale);

            sizeButton
                .closest('[data-screen-scale-dropdown]')
                ?.classList.remove('is-open');

            return;
        }
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

    const setting = SETTINGS[type] || SETTINGS.general;

    const icon = layer.querySelector('[data-settings-title-icon]');

    if (icon) {
        icon.className = `icon ${setting.icon}`;
    }

    const title = layer.querySelector('[data-settings-title]');

    if (title) {
        title.textContent = setting.title;
    }

    content.innerHTML = `
        <div class="settings-loading">
            <span class="settings-spinner icon icon-setting"></span>
        </div>
    `;

    try {
        let html = settingsCache.get(type);

        if (!html) {
            const response = await fetch(setting.page);

            if (!response.ok) {
                throw new Error('설정 내용을 불러오지 못했습니다.');
            }

            html = await response.text();
            settingsCache.set(type, html);
        }

        content.innerHTML = html;

        setScreenScale(localStorage.getItem('screenScale') || '1', false);
    } catch (error) {
        console.error(error);
        content.innerHTML = '<p class="settings-empty">설정을 불러오지 못했습니다.</p>';
    }
}

function closeSettingsPopup(updateHash = true) {
    const hadSettingsPopup = !!document.querySelector('.settings-layer');

    document.querySelector('.settings-layer')?.remove();
    document.body.style.overflow = '';

    if (hadSettingsPopup && beforeSettingsFocus) {
        beforeSettingsFocus.blur();
        beforeSettingsFocus = null;
    }

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

async function showServiceNotification({
    title = '알림',
    message = ''
} = {}) {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return;
        }
    }

    if (Notification.permission !== 'granted') {
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    registration.showNotification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
    });
}

setInterval(() => {
    if (notifications.length) {
        renderNotifications();
    }
}, 60000);

const DAY = 1000 * 60 * 60 * 24;
const now = Date.now();

const testNotifications = [
    {
        title: '3일 전 알림',
        message: '3일 전 날짜 테스트입니다.',
        createdAt: now - (DAY * 3)
    },
    {
        title: '어제 알림',
        message: '어제 날짜 테스트입니다.',
        createdAt: now - DAY
    },
    {
        title: '오늘 알림',
        message: '오늘 날짜 테스트입니다.',
        createdAt: now
    }
];

let testCount = 0;

const testTimer = setInterval(() => {
    const item = testNotifications[testCount % testNotifications.length];

    addNotification({
        href: '#',
        profile: {
            href: '',
            image: ''
        },
        info: {
            title: `${item.title} ${testCount + 1}`,
            message: item.message
        },
        thumbnail: testCount % 2 === 1 ? {
            image: '/favicon.ico'
        } : null,
        createdAt: item.createdAt
    });

    testCount += 1;

    if (testCount >= 10) {
        clearInterval(testTimer);
    }
}, 2000);