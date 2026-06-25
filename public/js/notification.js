import {
    $, $$, on, esc, lastTab
} from './dom.js';

import {
    OPTION, DEFAULT_OPTION,
    opt
} from './options.js';

const KEY = (
    'jjing-notifications'
);

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const GRACE = 3000;
const GAP = 14;
const CLEAR = 520;

let items = loadItems();

let tab = 'all';
let word = '';

let id = maxId();

let ui = {
    list: null,
    badge: null,
    tabs: null
};

export function initNotify() {
    const btn = $(
        '.notify > .tool'
    );
    const panel = $(
        '#notify'
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
    const cls = $(
        '.notify-close'
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
    const sCls = $(
        '.notify-search-close'
    );

    const tabs = $$(
        '.notify-tab'
    );

    const head = $(
        '.notify-head'
    );
    const title = $(
        '.notify-head-title'
    );
    const actions = $(
        '.notify-actions'
    );

    const update = () => {
        headSync(
            panel,
            head,
            title,
            actions
        );
    };

    ui = {
        list,
        badge,
        tabs
    };

    render();
    startClock();
    startTest();

    on(btn, 'click', () => {
        panelToggle(btn, panel);

        requestAnimationFrame(() => {
            update();
        });
    });

    on(clear, 'click', () => {
        readAll();
    });

    on(remove, 'click', () => {
        clearAll();
    });

    on(cls, 'click', () => {
        panelClose(btn, panel);
    });

    tabs.forEach(tab => {
        on(tab, 'click', () => {
            setFilter(tab);
        });
    });

    on(sBtn, 'click', () => {
        searchPop(sBtn);

        searchToggle(
            search,
            sInput
        );
    });

    on(sCls, 'click', () => {
        searchClose(
            search,
            sInput
        );
    });

    on(sInput, 'input', () => {
        word = sInput.value
            .trim()
            .toLowerCase();

        render();
    });

    on(sInput, 'keydown', event => {
        searchEsc(
            event,
            search,
            sInput
        );
    });

    on(list, 'click', event => {
        event.stopPropagation();

        if (menuToggle(event)) {
            return;
        }

        if (menuRead(event)) {
            return;
        }

        if (removeOne(event)) {
            return;
        }

        if (mainOpen(event)) {
            return;
        }

        readLink(event);
    });

    on(document, 'click', event => {
        outClose(event, btn, panel);
        menuClose(event);
    });

    on(document, 'keydown', event => {
        escClose(event, btn, panel);
    });

    on(panel, 'keydown', event => {
        tabClose(event, btn, panel);
    });

    on(window, 'resize', () => {
        update();
    });

    if (head) {
        new ResizeObserver(() => {
            update();
        }).observe(head);
    }
}

export function pushNotify(data) {
    if (!ui.list) {
        return;
    }

    addItem(data);
}

function headSync(panel, head, title, actions) {
    if (!panel || !head || !title || !actions) {
        return;
    }

    head.classList.remove('wrap');

    if (panel.hidden) {
        return;
    }

    head.classList.toggle(
        'wrap',
        actions.offsetTop > title.offsetTop
    );
}

function render() {
    const {
        list,
        badge,
        tabs
    } = ui;

    if (!list) {
        return;
    }

    const focus = focusNow();

    list.replaceChildren();

    const view = viewItems();

    if (!view.length) {
        list.append(makeEmpty());
    } else {
        let lastDate = '';

        view.forEach(item => {
            const date = dateKey(item.time);

            if (date !== lastDate) {
                list.append(makeDate(item.time));
                lastDate = date;
            }

            list.append(makeItem(item));
        });
    }

    view.forEach(item => {
        item.isNew = false;
    });

    setBadge(badge);
    setTabs(tabs);
    focusBack(focus);
}

function viewItems() {
    let list = tab === 'unread'
        ? items.filter(item => item.unread)
        : items;

    if (word) {
        list = list.filter(item => {
            const title = item.title
                .toLowerCase();

            const message = item.message
                .toLowerCase();

            return title.includes(word)
                || message.includes(word);
        });
    }

    return [...list].sort(
        (a, b) => b.time - a.time
    );
}

function focusNow() {
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
        '.notify-control'
    );

    if (more?.dataset.id) {
        return {
            type: 'more',
            id: more.dataset.id
        };
    }

    return null;
}

function focusBack(focus) {
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
            `.notify-control[data-id="${id}"] `
            + '.notify-more-button'
    };

    const selector = selectorMap[focus.type];

    requestAnimationFrame(() => {
        $(selector)?.focus({
            preventScroll: true
        });
    });
}

function searchToggle(
    search,
    input
) {
    if (!search || !input) {
        return;
    }

    const open = search.hidden;

    if (!open) {
        searchClose(
            search,
            input
        );

        return;
    }

    search.hidden = false;
    input.focus();
}

function playClass(node, name) {
    if (!node) {
        return;
    }

    node.classList.remove(name);

    requestAnimationFrame(() => {
        node.classList.add(name);
    });

    node.addEventListener(
        'animationend',
        () => {
            node.classList.remove(name);
        },
        { once: true }
    );
}

function searchPop(button) {
    playClass(button, 'pop');
}

function searchClose(
    search,
    input
) {
    if (!search || !input) {
        return;
    }

    word = '';
    input.value = '';
    search.hidden = true;

    render();
}

function searchEsc(
    event,
    search,
    input
) {
    if (!esc(event)) {
        return;
    }

    event.stopPropagation();

    searchClose(
        search,
        input
    );
}

function makeItem(item) {
    const wrap = document.createElement('div');

    wrap.className = [
        'notify-item',
        item.unread ? 'unread' : 'read',
        item.isNew ? 'new' : ''
    ].filter(Boolean).join(' ');

    const main = document.createElement('div');
    main.className = 'notify-main';

    const dot = document.createElement('span');
    dot.className = 'notify-dot';

    const profile = makeImage(
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
    time.textContent = timeText(item.time);

    const more = document.createElement('div');
    more.className = 'notify-control';
    more.dataset.id = String(item.id);

    const moreButton = document.createElement('button');
    moreButton.className = 'notify-more-button';
    moreButton.type = 'button';

    const moreIcon = document.createElement('span');
    moreIcon.className = 'notify-more-icon';
    moreIcon.textContent = '⋮';

    moreButton.append(moreIcon);

    const menu = document.createElement('div');
    menu.className = 'notify-more';

    const read = document.createElement('button');
    read.className = 'notify-more-read';
    read.type = 'button';
    read.dataset.id = String(item.id);
    read.append(
        makeIcon('read'),
        '읽음'
    );

    const remove = document.createElement('button');
    remove.className = 'notify-remove';
    remove.type = 'button';
    remove.dataset.id = String(item.id);
    remove.append(
        makeIcon('delete'),
        '삭제'
    );

    menu.append(read, remove);
    more.append(moreButton, menu);

    content.append(title, message, time);
    main.append(dot, profile, content);

    if (item.thumbnail) {
        main.append(makeImage(
            'notify-thumbnail',
            item.thumbnail
        ));
    }

    wrap.append(main, more);

    return wrap;
}

function makeIcon(name) {
    const icon = document.createElement('span');

    icon.className = `icon icon-${name} notify-more-icon`;

    return icon;
}

function makeImage(className, src, href = '', id = '') {
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

function makeEmpty() {
    const empty = document.createElement('p');
    empty.className = 'notify-empty';
    empty.textContent = '새로운 알림이 없습니다.';

    return empty;
}

function makeDate(time) {
    const date = document.createElement('div');
    date.className = 'notify-date';
    date.textContent = dateText(time);

    return date;
}

function dateKey(time) {
    const date = new Date(time);

    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ].join('-');
}

function dateText(time) {
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
    setInterval(updateTimes, 30 * SEC);
}

function updateTimes() {
    $$('.notify-time')
        .forEach(time => {
            time.textContent = timeText(
                Number(time.dataset.time)
            );
        });
}

function timeText(time) {
    const diff = Math.max(
        0,
        Date.now() - time
    );

    if (diff < MIN) {
        return `${Math.floor(diff / SEC)}초 전`;
    }

    if (diff < HOUR) {
        return `${Math.floor(diff / MIN)}분 전`;
    }

    if (diff < DAY) {
        return `${Math.floor(diff / HOUR)}시간 전`;
    }

    return `${Math.floor(diff / DAY)}일 전`;
}

function setBadge(badge, animate = false) {
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

    playClass(badge, 'pop');
}

function setTabs(tabs) {
    tabs.forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset.filter === tab
        );
    });
}

function menuToggle(event) {
    const button = event.target.closest(
        '.notify-more-button'
    );

    if (!button) {
        return false;
    }

    menuPop(button);

    const more = button.closest(
        '.notify-control'
    );

    $$('.notify-control.open')
        .forEach(item => {
            if (item !== more) {
                item.classList.remove(
                    'open',
                    'up'
                );
            }
        });

    more?.classList.remove('up');
    more?.classList.toggle('open');

    const menu = more?.querySelector(
        '.notify-more'
    );
    const panel = $(
        '.notify-box'
    );

    if (!more?.classList.contains('open')) {
        return true;
    }

    const menuRect = menu.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    if (menuRect.bottom + GAP > panelRect.bottom) {
        more.classList.add('up');
    }

    return true;
}

function menuId() {
    const list = ui.list;

    if (!list) {
        return '';
    }

    const more = list.querySelector(
        '.notify-control.open'
    );

    return more
        ? more.dataset.id
        : '';
}

function menuRestore(id) {
    const list = ui.list;

    if (!id || !list) {
        return;
    }

    const more = list.querySelector(
        `.notify-control[data-id="${id}"]`
    );

    if (!more) {
        return;
    }

    more.classList.add('open');

    const menu = more.querySelector(
        '.notify-more'
    );

    if (!menu) {
        return;
    }

    requestAnimationFrame(() => {
        const menuRect = menu.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();

        more.classList.remove('up');

        if (menuRect.bottom + GAP > listRect.bottom) {
            more.classList.add('up');
        }
    });
}

function menuRead(event) {
    const button = event.target.closest(
        '.notify-more-read'
    );

    if (!button) {
        return false;
    }

    readOne(
        Number(button.dataset.id)
    );

    menuClose();

    return true;
}

function menuClose(event) {
    const target = event?.target;

    if (target?.closest?.('.notify-more')) {
        return;
    }

    $$('.notify-control.open')
        .forEach(item => {
            item.classList.remove(
                'open',
                'up'
            );
        });
}

function setFilter(button) {
    tab = button.dataset.filter || 'all';

    render();
}

function readLink(event) {
    const item = event.target.closest(
        '.notify-read'
    );

    if (!item) {
        return;
    }

    readOne(
        Number(item.dataset.id)
    );
}

function mainOpen(event) {
    const item = event.target.closest(
        '.notify-item'
    );

    if (!item) {
        return false;
    }

    if (event.target.closest(
        'a, button, .notify-more'
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

function menuPop(button) {
    playClass(button, 'pop');
}

function sync() {
    saveItems();
    render();
}

function removeIds(ids) {
    const set = new Set(ids);

    items = items.filter(
        item => !set.has(item.id)
    );

    sync();
}

function readOne(id) {
    const notification = items.find(
        item => item.id === id
    );

    if (!notification
        || !notification.unread) {
        return;
    }

    notification.unread = false;

    sync();
}

function readAll() {
    if (!items.some(
        item => item.unread
    )) {
        return;
    }

    items.forEach(item => {
        item.unread = false;
    });

    sync();
}

function clearNode(item, index = 0) {
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

    item.classList.add('clear');
}

function removeOne(event) {
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
        removeIds([id]);

        return true;
    }

    item.querySelector(
        '.notify-control'
    )?.classList.remove(
        'open',
        'up'
    );

    clearNode(item);

    setTimeout(() => {
        removeIds([id]);
    }, CLEAR);

    return true;
}

function clearAll() {
    const list = ui.list;

    if (!list) {
        return;
    }

    const limit = Date.now() - GRACE;

    const ids = new Set(
        items
            .filter(item => item.time <= limit)
            .map(item => item.id)
    );

    const nodes = list.querySelectorAll(
        '.notify-item'
    );

    if (!ids.size) {
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

        if (!ids.has(id)) {
            return;
        }

        clearNode(item, index);
    });

    setTimeout(() => {
        removeIds(ids);
    }, CLEAR);
}

function addItem(data) {
    const {
        list,
        badge
    } = ui;

    if (!list || !canNotify()) {
        return;
    }

    const openMenuId = menuId();

    const holdScroll = list.scrollTop > 0;
    const beforeTop = list.scrollTop;
    const beforeHeight = list.scrollHeight;

    items.unshift(toItem({
        ...data,
        id: ++id,
        unread: true
    }, true));

    saveItems();

    if (holdScroll) {
        list.classList.add('hold');
    }

    render();

    if (holdScroll) {
        const afterHeight = list.scrollHeight;

        list.scrollTop = beforeTop
            + afterHeight
            - beforeHeight;

        requestAnimationFrame(() => {
            list.classList.remove('hold');
        });
    }

    menuRestore(openMenuId);

    setBadge(badge, true);
    shakeButton();
    playSound();
}

function shakeButton() {
    const button = $('.notify > .tool');

    if (!button) {
        return;
    }

    playClass(button, 'shake');
}

function canNotify() {
    return opt(
        OPTION.notifyEnable,
        DEFAULT_OPTION.notifyEnable
    ) === '1';
}

function canSound() {
    return opt(
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

function startTest() {
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
        });
    }, 3000);
}

function panelToggle(button, panel) {
    if (!button || !panel) {
        return;
    }

    if (panel.hidden) {
        panelOpen(panel);

        return;
    }

    panelClose(button, panel);
}

function panelOpen(panel) {
    panel.hidden = false;

    document.body.classList.add(
        'notify-open'
    );

    updateTimes();
}

function panelClose(button, panel) {
    if (!button || !panel
        || panel.hidden) {
        return;
    }

    panel.hidden = true;

    document.body.classList.remove(
        'notify-open'
    );

    panelReset();
    button.focus();
}

function panelReset() {
    menuClose();

    searchClose(
        $('.notify-search'),
        $('.notify-search-input')
    );
}

function outClose(event, button, panel) {
    if (!button || !panel || panel.hidden) {
        return;
    }

    if (event.target.closest('.notify')) {
        return;
    }

    panelClose(button, panel);
}

function escClose(event, button, panel) {
    if (!esc(event)) {
        return;
    }

    panelClose(button, panel);
}

function tabClose(event, button, panel) {
    if (!lastTab(event, panel, 'button, a, input')) {
        return;
    }

    event.preventDefault();

    panelClose(button, panel);
}

function loadItems() {
    try {
        const data = JSON.parse(
            localStorage.getItem(KEY)
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
        KEY,
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

function maxId() {
    return items.reduce((max, item) => {
        return Math.max(max, Number(item.id) || 0);
    }, 0);
}