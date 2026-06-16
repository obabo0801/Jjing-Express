import { $, on } from './dom.js';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const now = Date.now();

let notifications = [
    {
        id: 1,
        title: '알림 테스트',
        message: '새로운 알림이 도착했습니다.',
        href: '#',
        profileHref: '#',
        profile: '/favicon.svg',
        thumbnail: '/favicon.svg',
        time: now - DAY,
        unread: true
    },
    {
        id: 2,
        title: '테마 변경',
        message: '테마 버튼 효과가 적용되었습니다.',
        href: '#',
        profileHref: '#',
        profile: '/favicon.svg',
        thumbnail: null,
        time: now - MINUTE,
        unread: true
    },
    {
        id: 3,
        title: 'Jjing Express',
        message: '알림 패널 UI를 준비했습니다.',
        href: '#',
        profileHref: '',
        profile: '',
        thumbnail: null,
        time: now - 3 * MINUTE,
        unread: false
    }
];

let filter = 'all';

let notificationId = notifications.length;

export function initNotification() {
    const button = $('.notify-button');
    const panel = $('#notify-panel');
    const list = $('.notify-list');
    const badge = $('.notify-badge');
    const clear = $('.notify-clear');
    const removeAll = $('.notify-remove-all');
    const tabs = document.querySelectorAll(
        '.notify-tab'
    );

    renderNotification(list, badge, tabs);
    startNotificationClock();
    startNotificationTest(list, badge, tabs);

    on(button, 'click', () => {
        toggleNotification(button, panel);
    });

    on(clear, 'click', () => {
        readAll(list, badge, tabs);
    });

    on(removeAll, 'click', () => {
        deleteAll(list, badge, tabs);
    });

    tabs.forEach(tab => {
        on(tab, 'click', () => {
            changeFilter(tab, list, badge, tabs);
        });
    });

    on(list, 'click', event => {
        event.stopPropagation();

        if (toggleNotificationMenu(event)) {
            return;
        }

        if (readNotificationMenu(event, list, badge, tabs)) {
            return;
        }

        if (deleteNotification(event, list, badge, tabs)) {
            return;
        }

        readNotification(event, list, badge, tabs);
    });

    on(document, 'click', event => {
        closeOutside(event, button, panel);
        closeNotificationMenus(event);
    });

    on(document, 'keydown', event => {
        closeEscape(event, button, panel);
    });
}

function renderNotification(list, badge, tabs) {
    if (!list) {
        return;
    }

    list.replaceChildren();

    const items = getFilteredNotifications();

    if (!items.length) {
        list.append(createEmpty());
    } else {
        let lastDate = '';

        items.forEach(item => {
            const date = getDateKey(item.time);

            if (date !== lastDate) {
                list.append(createDate(item.time));
                lastDate = date;
            }

            list.append(createItem(item));
        });
    }

    items.forEach(item => {
        item.isNew = false;
    });

    updateBadge(badge);
    updateTabs(tabs);
}

function getFilteredNotifications() {
    const items = filter === 'unread'
        ? notifications.filter(item => item.unread)
        : notifications;

    return [...items].sort(
        (a, b) => b.time - a.time
    );
}

function createItem(item) {
    const wrap = document.createElement('div');
    wrap.className = item.unread
        ? 'notify-item is-unread'
        : 'notify-item';

    if (item.isNew) {
        wrap.classList.add('is-new');
    }

    if (item.thumbnail) {
        wrap.classList.add('has-thumbnail');
    }

    const main = document.createElement('div');
    main.className = 'notify-main';

    const dot = document.createElement('span');
    dot.className = 'notify-dot';

    const profile = createImage(
        'notify-profile',
        item.profile,
        item.profileHref,
        item.id
    );

    const content = document.createElement('a');
    content.className = 'notify-content notify-read';
    content.href = safeHref(item.href);
    content.dataset.id = String(item.id);

    const title = document.createElement('strong');
    title.className = 'notify-title';
    title.textContent = item.title;

    const message = document.createElement('span');
    message.className = 'notify-message';
    message.textContent = item.message;

    const time = document.createElement('span');
    time.className = 'notify-time';
    time.dataset.time = String(item.time);
    time.textContent = formatTime(item.time);

    const more = document.createElement('div');
    more.className = 'notify-more';
    more.dataset.id = String(item.id);

    const moreButton = document.createElement('button');
    moreButton.className = 'notify-more-button';
    moreButton.type = 'button';
    moreButton.textContent = '⋮';

    const menu = document.createElement('div');
    menu.className = 'notify-menu';

    const read = document.createElement('button');
    read.className = 'notify-menu-read';
    read.type = 'button';
    read.dataset.id = String(item.id);
    read.textContent = '읽음';

    const remove = document.createElement('button');
    remove.className = 'notify-remove';
    remove.type = 'button';
    remove.dataset.id = String(item.id);
    remove.textContent = '삭제';

    menu.append(read, remove);
    more.append(moreButton, menu);

    content.append(title, message, time);
    main.append(dot, profile, content);

    if (item.thumbnail) {
        main.append(createImage(
            'notify-thumbnail notify-read',
            item.thumbnail,
            item.href,
            item.id
        ));
    }

    wrap.append(main, more);

    return wrap;
}

function createImage(className, src, href = '', id = '') {
    const wrap = href
        ? document.createElement('a')
        : document.createElement('span');

    wrap.className = className;

    if (href) {
        wrap.href = safeHref(href);
        wrap.dataset.id = String(id);
    }

    const image = document.createElement('img');
    image.src = src || '/favicon.svg';
    image.draggable = false;

    image.addEventListener('error', () => {
        image.src = '/favicon.svg';
    }, { once: true });

    wrap.append(image);

    return wrap;
}

function safeHref(href) {
    if (!href) {
        return '#';
    }

    try {
        const url = new URL(
            href,
            location.origin
        );

        if (
            url.protocol !== 'http:'
            && url.protocol !== 'https:'
        ) {
            return '#';
        }

        return url.href;
    } catch {
        return '#';
    }
}

function createEmpty() {
    const empty = document.createElement('p');
    empty.className = 'notify-empty';
    empty.textContent = '새로운 알림이 없습니다.';

    return empty;
}

function createDate(time) {
    const date = document.createElement('div');
    date.className = 'notify-date';
    date.textContent = formatDate(time);

    return date;
}

function getDateKey(time) {
    const date = new Date(time);

    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ].join('-');
}

function formatDate(time) {
    const date = new Date(time);
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

function startNotificationClock() {
    setInterval(updateTimes, 30 * SECOND);
}

function updateTimes() {
    document.querySelectorAll(
        '.notify-time'
    ).forEach(time => {
        time.textContent = formatTime(
            Number(time.dataset.time)
        );
    });
}

function formatTime(time) {
    const diff = Math.max(
        0,
        Date.now() - time
    );

    if (diff < MINUTE) {
        return `${Math.floor(diff / SECOND)}초 전`;
    }

    if (diff < HOUR) {
        return `${Math.floor(diff / MINUTE)}분 전`;
    }

    if (diff < DAY) {
        return `${Math.floor(diff / HOUR)}시간 전`;
    }

    return `${Math.floor(diff / DAY)}일 전`;
}

function updateBadge(badge, animate = false) {
    if (!badge) {
        return;
    }

    const count = notifications.filter(
        item => item.unread
    ).length;

    badge.hidden = count <= 0;
    badge.textContent = String(count);

    if (!animate || count <= 0) {
        return;
    }

    badge.classList.remove('is-pop');

    requestAnimationFrame(() => {
        badge.classList.add('is-pop');
    });

    badge.addEventListener('animationend', () => {
        badge.classList.remove('is-pop');
    }, { once: true });
}

function updateTabs(tabs) {
    tabs.forEach(tab => {
        tab.classList.toggle(
            'is-active',
            tab.dataset.filter === filter
        );
    });
}

function changeFilter(tab, list, badge, tabs) {
    filter = tab.dataset.filter || 'all';

    renderNotification(list, badge, tabs);
}

function readNotification(event, list, badge, tabs) {
    const item = event.target.closest(
        '.notify-read'
    );

    if (!item) {
        return;
    }

    readNotificationById(
        Number(item.dataset.id),
        list,
        badge,
        tabs
    );
}

function toggleNotificationMenu(event) {
    const button = event.target.closest(
        '.notify-more-button'
    );

    if (!button) {
        return false;
    }

    const more = button.closest(
        '.notify-more'
    );

    document.querySelectorAll(
        '.notify-more.is-open'
    ).forEach(item => {
        if (item !== more) {
            item.classList.remove(
                'is-open',
                'is-up'
            );
        }
    });

    more?.classList.remove('is-up');
    more?.classList.toggle('is-open');

    const menu = more?.querySelector(
        '.notify-menu'
    );
    const panel = document.querySelector(
        '.notify-panel'
    );

    if (!more?.classList.contains('is-open')) {
        return true;
    }

    const menuRect = menu.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gap = 14;

    if (menuRect.bottom + gap > panelRect.bottom) {
        more.classList.add('is-up');
    }

    return true;
}

function getOpenMenuId() {
    const more = document.querySelector(
        '.notify-more.is-open'
    );

    return more
        ? more.dataset.id
        : '';
}

function restoreNotificationMenu(id) {
    if (!id) {
        return;
    }

    const more = document.querySelector(
        `.notify-more[data-id="${id}"]`
    );

    if (!more) {
        return;
    }

    more.classList.add('is-open');

    const menu = more.querySelector(
        '.notify-menu'
    );
    const list = document.querySelector(
        '.notify-list'
    );

    if (!menu || !list) {
        return;
    }

    requestAnimationFrame(() => {
        const gap = 14;
        const menuRect = menu.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();

        more.classList.remove('is-up');

        if (menuRect.bottom + gap > listRect.bottom) {
            more.classList.add('is-up');
        }
    });
}

function readNotificationMenu(event, list, badge, tabs) {
    const button = event.target.closest(
        '.notify-menu-read'
    );

    if (!button) {
        return false;
    }

    readNotificationById(
        Number(button.dataset.id),
        list,
        badge,
        tabs
    );

    closeNotificationMenus();

    return true;
}

function readNotificationById(id, list, badge, tabs) {
    const notification = notifications.find(
        item => item.id === id
    );

    if (!notification) {
        return;
    }

    notification.unread = false;

    renderNotification(list, badge, tabs);
}

function closeNotificationMenus(event) {
    const target = event?.target;

    if (target?.closest?.('.notify-more')) {
        return;
    }

    document.querySelectorAll(
        '.notify-more.is-open'
    ).forEach(item => {
        item.classList.remove('is-open');
    });
}

function readAll(list, badge, tabs) {
    notifications.forEach(item => {
        item.unread = false;
    });

    renderNotification(list, badge, tabs);
}

function deleteNotification(event, list, badge, tabs) {
    const button = event.target.closest(
        '.notify-remove'
    );

    if (!button) {
        return false;
    }

    const id = Number(button.dataset.id);

    notifications = notifications.filter(
        item => item.id !== id
    );

    renderNotification(list, badge, tabs);

    return true;
}

function deleteAll(list, badge, tabs) {
    notifications = [];

    renderNotification(list, badge, tabs);
}

function addNotification(data, list, badge, tabs) {
    const openMenuId = getOpenMenuId();

    const holdScroll = list.scrollTop > 0;
    const beforeTop = list.scrollTop;
    const beforeHeight = list.scrollHeight;

    notifications.unshift({
        id: ++notificationId,
        title: data.title || '알림',
        message: data.message || '',
        href: data.href || '#',
        profileHref: data.profileHref || '',
        profile: data.profile || '',
        thumbnail: data.thumbnail || null,
        time: data.time || Date.now(),
        unread: true,
        isNew: true
    });

    renderNotification(list, badge, tabs);

    if (holdScroll) {
        const afterHeight = list.scrollHeight;

        list.scrollTop = beforeTop
            + afterHeight
            - beforeHeight;
    }

    restoreNotificationMenu(openMenuId);

    updateBadge(badge, true);
}

function startNotificationTest(list, badge, tabs) {
    if (!location.search.includes(
        'test=notification'
    )) {
        return;
    }

    let count = 0;

    setInterval(() => {
        count += 1;

        addNotification({
            title: `테스트 알림 ${count}`,
            message: '새 알림 추가 효과 테스트입니다.',
            href: '#',
            profileHref: '#',
            profile: '/favicon.svg',
            thumbnail: count % 2 === 0
                ? '/favicon.svg'
                : null
        }, list, badge, tabs);
    }, 3000);
}

function toggleNotification(button, panel) {
    if (!button || !panel) {
        return;
    }

    const open = panel.hidden;

    panel.hidden = !open;

    button.setAttribute(
        'aria-expanded',
        String(open)
    );
}

function closeNotification(button, panel) {
    if (!button || !panel) {
        return;
    }

    panel.hidden = true;

    button.setAttribute(
        'aria-expanded',
        'false'
    );
}

function closeOutside(event, button, panel) {
    if (!button || !panel || panel.hidden) {
        return;
    }

    const target = event.target;

    if (
        target.closest('.notify-panel')
        || target.closest('.notify-button')
    ) {
        return;
    }

    closeNotification(button, panel);
}

function closeEscape(event, button, panel) {
    if (event.key !== 'Escape') {
        return;
    }

    closeNotification(button, panel);
}