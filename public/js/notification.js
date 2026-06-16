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
        time: now - DAY,
        unread: true
    },
    {
        id: 2,
        title: '테마 변경',
        message: '테마 버튼 효과가 적용되었습니다.',
        time: now - MINUTE,
        unread: true
    },
    {
        id: 3,
        title: 'Jjing Express',
        message: '알림 패널 UI를 준비했습니다.',
        time: now - 3 * MINUTE,
        unread: false
    }
];

let filter = 'all';

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
        if (deleteNotification(event, list, badge, tabs)) {
            return;
        }

        readNotification(event, list, badge, tabs);
    });

    on(document, 'click', event => {
        closeOutside(event, button, panel);
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

    const main = document.createElement('button');
    main.className = 'notify-main';
    main.type = 'button';
    main.dataset.id = String(item.id);

    const dot = document.createElement('span');
    dot.className = 'notify-dot';

    const content = document.createElement('span');
    content.className = 'notify-content';

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

    const remove = document.createElement('button');
    remove.className = 'notify-remove';
    remove.type = 'button';
    remove.dataset.id = String(item.id);
    remove.textContent = '삭제';

    content.append(title, message, time);
    main.append(dot, content);
    wrap.append(main, remove);

    return wrap;
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

function updateBadge(badge) {
    if (!badge) {
        return;
    }

    const count = notifications.filter(
        item => item.unread
    ).length;

    badge.hidden = count <= 0;
    badge.textContent = String(count);
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
        '.notify-main'
    );

    if (!item) {
        return;
    }

    const id = Number(item.dataset.id);
    const notification = notifications.find(
        item => item.id === id
    );

    if (!notification) {
        return;
    }

    notification.unread = false;

    renderNotification(list, badge, tabs);
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