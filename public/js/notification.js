import { $, on } from './dom.js';
import {
    OPTION,
    DEFAULT_OPTION,
    getOption
} from './options.js';

const STORE_KEY = (
    'jjing-notifications'
);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const CLEAR_GRACE = 3000;

let items = loadItems();

let filter = 'all';
let keyword = '';

let lastId = getLastId();

function loadItems() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORE_KEY)
            || '[]'
        );

        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map(item => toItem(item))
            .filter(item => item.id > 0);
    } catch {
        return [];
    }
}

function saveItems() {
    const data = items.map(toSave);

    localStorage.setItem(
        STORE_KEY,
        JSON.stringify(data)
    );
}

function toItem(data = {}, isNew = false) {
    return {
        id: Number(data.id) || 0,
        title: String(data.title || '알림'),
        message: String(data.message || ''),
        href: data.href || '#',
        profileHref: data.profileHref || '',
        profile: data.profile || '',
        thumbnail: data.thumbnail || null,
        time: Number(data.time) || Date.now(),
        unread: data.unread !== false,
        isNew
    };
}

function toSave(item) {
    return {
        id: item.id,
        title: item.title,
        message: item.message,
        href: item.href,
        profileHref: item.profileHref,
        profile: item.profile,
        thumbnail: item.thumbnail,
        time: item.time,
        unread: item.unread
    };
}

function getLastId() {
    return items.reduce((max, item) => {
        return Math.max(max, Number(item.id) || 0);
    }, 0);
}

let viewBox = {
    list: null,
    badge: null,
    tabs: null
};

export function initNotification() {
    const btn = $(
        '.notify-button'
    );
    const panel = $(
        '#notify-panel'
    );
    const list = $(
        '.notify-list'
    );
    const badge = $(
        '.notify-badge'
    );
    const clear = $(
        '.notify-clear'
    );
    const remove = $(
        '.notify-remove-all'
    );

    const sBtn = $(
        '.notify-search-button'
    );
    const search = $(
        '.notify-search'
    );
    const sInput = $(
        '.notify-search-input'
    );
    const sClose = $(
        '.notify-search-close'
    );

    const tabs = (
        document.querySelectorAll(
        '.notify-tab'
    ));

    viewBox = {
        list,
        badge,
        tabs
    };

    render(list, badge, tabs);
    startClock();
    startTest(list, badge, tabs);

    on(btn, 'click', () => {
        togglePanel(btn, panel);
    });

    on(clear, 'click', () => {
        readAll(list, badge, tabs);
    });

    on(remove, 'click', () => {
        clearAll(list, badge, tabs);
    });

    tabs.forEach(tab => {
        on(tab, 'click', () => {
            setFilter(tab, list, badge, tabs);
        });
    });

    on(sBtn, 'click', () => {
        popSearch(sBtn);

        toggleSearch(
            search,
            sInput,
            list,
            badge,
            tabs
        );
    });

    on(sClose, 'click', () => {
        closeSearch(
            search,
            sInput,
            list,
            badge,
            tabs
        );
    });

    on(sInput, 'input', () => {
        keyword = sInput.value
            .trim()
            .toLowerCase();

        render(list, badge, tabs);
    });

    on(sInput, 'keydown', event => {
        closeSearchEsc(
            event,
            search,
            sInput,
            list,
            badge,
            tabs
        );
    });

    on(list, 'click', event => {
        event.stopPropagation();

        if (toggleMenu(event)) {
            return;
        }

        if (readMenu(event, list, badge, tabs)) {
            return;
        }

        if (deleteOne(event, list, badge, tabs)) {
            return;
        }

        if (openMain(event)) {
            return;
        }

        readClick(event, list, badge, tabs);
    });

    on(document, 'click', event => {
        closeOut(event, btn, panel);
        closeMenus(event);
    });

    on(document, 'keydown', event => {
        closeEsc(event, btn, panel);
    });

    on(panel, 'keydown', event => {
        closeTabEnd(event, btn, panel);
    });
}

export function pushNotification(data) {
    if (!viewBox.list) {
        return;
    }

    addItem(
        data,
        viewBox.list,
        viewBox.badge,
        viewBox.tabs
    );
}

function render(list, badge, tabs) {
    if (!list) {
        return;
    }

    const focus = getFocus();

    list.replaceChildren();

    const view = getView();

    if (!view.length) {
        list.append(createEmpty());
    } else {
        let lastDate = '';

        view.forEach(item => {
            const date = getDateKey(item.time);

            if (date !== lastDate) {
                list.append(createDate(item.time));
                lastDate = date;
            }

            list.append(createItem(item));
        });
    }

    view.forEach(item => {
        item.isNew = false;
    });

    updateBadge(badge);
    updateTabs(tabs);
    restoreFocus(focus);
}

function getFocus() {
    const active = document.activeElement;

    if (!active?.closest?.('.notify-list')) {
        return null;
    }

    const content = active.closest(
        '.notify-content'
    );

    if (content?.dataset.id) {
        return {
            type: 'content',
            id: content.dataset.id
        };
    }

    const profile = active.closest(
        '.notify-profile'
    );

    if (profile?.dataset.id) {
        return {
            type: 'profile',
            id: profile.dataset.id
        };
    }

    const more = active.closest(
        '.notify-more'
    );

    if (more?.dataset.id) {
        return {
            type: 'more',
            id: more.dataset.id
        };
    }

    return null;
}

function restoreFocus(focus) {
    if (!focus) {
        return;
    }

    const id = focus.id;

    const selectorMap = {
        content:
            `.notify-content[data-id="${id}"]`,

        profile:
            `.notify-profile[data-id="${id}"]`,

        more:
            `.notify-more[data-id="${id}"] `
            + '.notify-more-button'
    };

    const selector = selectorMap[focus.type];

    requestAnimationFrame(() => {
        document.querySelector(
            selector
        )?.focus({
            preventScroll: true
        });
    });
}

function toggleSearch(
    searchBox,
    searchInput,
    list,
    badge,
    tabs
) {
    if (!searchBox || !searchInput) {
        return;
    }

    const open = searchBox.hidden;

    if (!open) {
        closeSearch(
            searchBox,
            searchInput,
            list,
            badge,
            tabs
        );

        return;
    }

    searchBox.hidden = false;
    searchInput.focus();
}

function popSearch(button) {
    if (!button) {
        return;
    }

    button.classList.remove('is-pop');

    requestAnimationFrame(() => {
        button.classList.add('is-pop');
    });

    button.addEventListener('animationend', () => {
        button.classList.remove('is-pop');
    }, {
        once: true
    });
}

function closeSearch(
    searchBox,
    searchInput,
    list,
    badge,
    tabs
) {
    if (!searchBox || !searchInput) {
        return;
    }

    keyword = '';
    searchInput.value = '';
    searchBox.hidden = true;

    render(list, badge, tabs);
}

function closeSearchEsc(
    event,
    searchBox,
    searchInput,
    list,
    badge,
    tabs
) {
    if (event.key !== 'Escape') {
        return;
    }

    event.stopPropagation();

    closeSearch(
        searchBox,
        searchInput,
        list,
        badge,
        tabs
    );
}

function getView() {
    let list = filter === 'unread'
        ? items.filter(item => item.unread)
        : items;

    if (keyword) {
        list = list.filter(item => {
            const title = item.title
                .toLowerCase();

            const message = item.message
                .toLowerCase();

            return title.includes(keyword)
                || message.includes(keyword);
        });
    }

    return [...list].sort(
        (a, b) => b.time - a.time
    );
}

function createItem(item) {
    const wrap = document.createElement('div');
    wrap.className = item.unread
        ? 'notify-item is-unread'
        : 'notify-item is-read';

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

    const moreIcon = document.createElement('span');
    moreIcon.className = 'notify-more-icon';
    moreIcon.textContent = '⋮';

    moreButton.append(moreIcon);

    const menu = document.createElement('div');
    menu.className = 'notify-menu';

    const read = document.createElement('button');
    read.className = 'notify-menu-read';
    read.type = 'button';
    read.dataset.id = String(item.id);
    read.append(
        createMenuIcon('read'),
        '읽음'
    );

    const remove = document.createElement('button');
    remove.className = 'notify-remove';
    remove.type = 'button';
    remove.dataset.id = String(item.id);
    remove.append(
        createMenuIcon('delete'),
        '삭제'
    );

    menu.append(read, remove);
    more.append(moreButton, menu);

    content.append(title, message, time);
    main.append(dot, profile, content);

    if (item.thumbnail) {
        main.append(createImage(
            'notify-thumbnail',
            item.thumbnail
        ));
    }

    wrap.append(main, more);

    return wrap;
}

function createMenuIcon(name) {
    const icon = document.createElement('span');

    icon.className = `icon icon-${name} notify-menu-icon`;

    return icon;
}

function createImage(className, src, href = '', id = '') {
    const isLink = Boolean(href);

    const wrap = isLink
        ? document.createElement('a')
        : document.createElement('span');

    wrap.className = className;

    if (isLink) {
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

function startClock() {
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

    const count = items.filter(
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

function setFilter(tab, list, badge, tabs) {
    filter = tab.dataset.filter || 'all';

    render(list, badge, tabs);
}

function readClick(event, list, badge, tabs) {
    const item = event.target.closest(
        '.notify-read'
    );

    if (!item) {
        return;
    }

    readById(
        Number(item.dataset.id),
        list,
        badge,
        tabs
    );
}

function openMain(event) {
    const item = event.target.closest(
        '.notify-item'
    );

    if (!item) {
        return false;
    }

    if (event.target.closest(
        'a, button, .notify-menu'
    )) {
        return false;
    }

    const link = item.querySelector(
        '.notify-content'
    );

    if (!link) {
        return false;
    }

    link.click();

    return true;
}

function toggleMenu(event) {
    const button = event.target.closest(
        '.notify-more-button'
    );

    if (!button) {
        return false;
    }

    popMore(button);

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

function popMore(button) {
    button.classList.remove('is-pop');

    requestAnimationFrame(() => {
        button.classList.add('is-pop');
    });

    button.addEventListener(
        'animationend',
        () => {
            button.classList.remove('is-pop');
        },
        { once: true }
    );
}

function getMenuId() {
    const more = document.querySelector(
        '.notify-more.is-open'
    );

    return more
        ? more.dataset.id
        : '';
}

function restoreMenu(id) {
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

function readMenu(event, list, badge, tabs) {
    const button = event.target.closest(
        '.notify-menu-read'
    );

    if (!button) {
        return false;
    }

    readById(
        Number(button.dataset.id),
        list,
        badge,
        tabs
    );

    closeMenus();

    return true;
}

function readById(id, list, badge, tabs) {
    const notification = items.find(
        item => item.id === id
    );

    if (!notification) {
        return;
    }

    notification.unread = false;

    saveItems();

    render(list, badge, tabs);
}

function closeMenus(event) {
    const target = event?.target;

    if (target?.closest?.('.notify-more')) {
        return;
    }

    document.querySelectorAll(
        '.notify-more.is-open'
    ).forEach(item => {
        item.classList.remove(
            'is-open',
            'is-up'
        );
    });
}

function readAll(list, badge, tabs) {
    items.forEach(item => {
        item.unread = false;
    });

    saveItems();

    render(list, badge, tabs);
}

function clearItem(item, index = 0) {
    const side = index % 2 === 0
        ? -1
        : 1;

    item.style.setProperty(
        '--clear-index',
        index
    );

    item.style.setProperty(
        '--clear-x',
        `${side * 90}px`
    );

    item.style.setProperty(
        '--clear-y',
        `${30 + index * 8}px`
    );

    item.style.setProperty(
        '--clear-rotate',
        `${side * 12}deg`
    );

    item.classList.add('is-clear');
}

function deleteOne(event, list, badge, tabs) {
    const button = event.target.closest(
        '.notify-remove'
    );

    if (!button) {
        return false;
    }

    const id = Number(button.dataset.id);
    const item = button.closest(
        '.notify-item'
    );

    if (!item) {
        items = items.filter(
            item => item.id !== id
        );

        saveItems();

        render(list, badge, tabs);

        return true;
    }

    item.querySelector(
        '.notify-more'
    )?.classList.remove(
        'is-open',
        'is-up'
    );

    clearItem(item);

    setTimeout(() => {
        items = items.filter(
            item => item.id !== id
        );

        saveItems();

        render(list, badge, tabs);
    }, 520);

    return true;
}

function clearAll(list, badge, tabs) {
    const limit = Date.now() - CLEAR_GRACE;

    const ids = items
        .filter(item => item.time <= limit)
        .map(item => item.id);

    const nodes = list.querySelectorAll(
        '.notify-item'
    );

    if (!ids.length) {
        return;
    }

    nodes.forEach((item, index) => {
        const link = item.querySelector(
            '.notify-read'
        );

        if (!link) {
            return;
        }

        const id = Number(link.dataset.id);

        if (!ids.includes(id)) {
            return;
        }

        clearItem(item, index);
    });

    setTimeout(() => {
        items = items.filter(
            item => !ids.includes(item.id)
        );

        saveItems();

        render(list, badge, tabs);
    }, 520);
}

function addItem(data, list, badge, tabs) {
    if (!canNotify()) {
        return;
    }

    const openMenuId = getMenuId();

    const holdScroll = list.scrollTop > 0;
    const beforeTop = list.scrollTop;
    const beforeHeight = list.scrollHeight;

    items.unshift(toItem({
        ...data,
        id: ++lastId,
        unread: true
    }, true));

    saveItems();

    if (holdScroll) {
        list.classList.add('is-hold');
    }

    render(list, badge, tabs);

    if (holdScroll) {
        const afterHeight = list.scrollHeight;

        list.scrollTop = beforeTop
            + afterHeight
            - beforeHeight;

        requestAnimationFrame(() => {
            list.classList.remove('is-hold');
        });
    }

    restoreMenu(openMenuId);

    updateBadge(badge, true);
    shakeButton();
    playSound();
}

function shakeButton() {
    const button = $('.notify-button');

    if (!button) {
        return;
    }

    button.classList.remove('is-shake');

    requestAnimationFrame(() => {
        button.classList.add('is-shake');
    });

    button.addEventListener(
        'animationend',
        () => {
            button.classList.remove('is-shake');
        },
        { once: true }
    );
}

function canNotify() {
    return getOption(
        OPTION.notifyEnable,
        DEFAULT_OPTION.notifyEnable
    ) === '1';
}

function canSound() {
    return getOption(
        OPTION.notifySound,
        DEFAULT_OPTION.notifySound
    ) === '1';
}

function playSound() {
    if (!canSound()) {
        return;
    }

    const Context = window.AudioContext
        || window.webkitAudioContext;

    if (!Context) {
        return;
    }

    try {
        const audio = new Context();
        const sound = audio.createOscillator();
        const volume = audio.createGain();

        sound.type = 'sine';
        sound.frequency.value = 880;

        volume.gain.setValueAtTime(
            0.001,
            audio.currentTime
        );

        volume.gain.exponentialRampToValueAtTime(
            0.18,
            audio.currentTime + 0.01
        );

        volume.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.18
        );

        sound.connect(volume);
        volume.connect(audio.destination);

        sound.start();
        sound.stop(audio.currentTime + 0.2);

        sound.addEventListener('ended', () => {
            audio.close();
        }, { once: true });
    } catch {}
}

function startTest(list, badge, tabs) {
    if (!location.search.includes(
        'test'
    )) {
        return;
    }

    let count = 0;

    setInterval(() => {
        count += 1;

        addItem({
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

function togglePanel(button, panel) {
    if (!button || !panel) {
        return;
    }

    if (panel.hidden) {
        openPanel(panel);

        return;
    }

    closePanel(button, panel);
}

function openPanel(panel) {
    panel.hidden = false;

    updateTimes();
}

function closePanel(button, panel) {
    if (!button || !panel
        || panel.hidden) {
        return;
    }

    panel.hidden = true;
    resetPanel();
    button.focus();
}

function resetPanel() {
    closeMenus();

    closeSearch(
        $('.notify-search'),
        $('.notify-search-input'),
        viewBox.list,
        viewBox.badge,
        viewBox.tabs
    );
}

function closeOut(event, button, panel) {
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

    closePanel(button, panel);
}

function closeEsc(event, button, panel) {
    if (event.key !== 'Escape') {
        return;
    }

    closePanel(button, panel);
}

function closeTabEnd(event, button, panel) {
    if (
        event.key !== 'Tab'
        || event.shiftKey
        || !panel
        || panel.hidden
    ) {
        return;
    }

    const focusList = [
        ...panel.querySelectorAll(
            'button, a, input'
        )
    ].filter(item => {
        return !item.hidden
            && !item.disabled
            && item.offsetParent !== null;
    });

    const last = focusList[
        focusList.length - 1
    ];

    if (document.activeElement !== last) {
        return;
    }

    closePanel(button, panel);
}