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
const STEP = 30;
const EDGE = 120;

let items = loadItems();

let tab = 'all';
let word = '';
let loading = false;
let opens = new Set();
let sizes = new Map();
let active = '';
let id = maxId();
let ui = {
    btn: null,
    panel: null,
    list: null,
    badge: null,
    tabs: null,
    search: null,
    input: null
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
        btn,
        panel,
        list,
        badge,
        tabs,
        search,
        input: sInput
    };

    render();

    setInterval(
        updateTimes, 30 * SEC
    );

    startTest();

    on(btn, 'click', () => {
        if (panel.hidden) {
            open(panel);
        } else {
            close(
                btn, panel
            );
        }

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
        close(
            btn, panel
        );
    });

    tabs.forEach(tab => {
        on(tab, 'click', () => {
            setFilter(tab);
        });
    });

    on(sBtn, 'click', () => {
        playClass(sBtn, 'pop');

        searchToggle(
            search, sInput
        );
    });

    on(sCls, 'click', () => {
        searchClose(
            search, sInput
        );
    });

    on(sInput, 'input', () => {
        const next = sInput.value
            .trim()
            .toLowerCase();

        if (next === word) {
            return;
        }

        word = next;
        resetDates();

        list.scrollTop = 0;

        render();
    });

    on(sInput, 'keydown', event => {
        if (!esc(event)) {
            return;
        }

        event.stopPropagation();

        searchClose(
            search, sInput
        );
    });

    on(list, 'click', event => {
        event.stopPropagation();

        if (dateToggle(event)) {
            return;
        }

        if (menuToggle(event)) {
            return;
        }

        if (menuRead(event)) {
            return;
        }

        if (removeOne(event)) {
            return;
        }

        if (itemOpen(event)) {
            return;
        }

        const read = event.target.closest(
            '.notify-read'
        );

        if (read) {
            readOne(
                Number(read.dataset.id)
            );
        }
    });

    on(list, 'scroll', () => {
        moreItems(list);
    });

    on(document, 'click', event => {
        if (
            !panel.hidden
            && !event.target.closest('.notify')
        ) {
            close(
                btn, panel, false
            );
        }

        menuClose(event);
    });

    on(document, 'keydown', event => {
        if (!esc(event)) {
            return;
        }

        close(
            btn, panel, false
        );
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

function open(panel) {
    panel.hidden = false;

    document.body.classList.add(
        'notify-open'
    );

    updateTimes();
}

function close(
    button, panel, keep = true
) {
    if (!button || !panel
        || panel.hidden) {
        return;
    }
    
    if (panel.contains(
        document.activeElement
    )) {
        document.activeElement.blur();
    }

    panel.hidden = true;

    document.body.classList.remove(
        'notify-open'
    );

    reset();
    
    if (keep) {
        button.focus();
        return;
    }

    button.blur();
}

function reset() {
    const {
        search, input
    } = ui;

    menuClose();

    if (search?.hidden && !word) {
        return;
    }

    searchClose(
        search, input
    );
}

function tabClose(
    event, button, panel
) {
    if (!lastTab(event, panel, 'button, a, input')) {
        return;
    }

    event.preventDefault();

    close(
        button, panel
    );
}

function render() {
    const {
        list, badge, tabs
    } = ui;

    if (!list) {
        return;
    }

    loading = false;

    const focus = focusNow();

    list.replaceChildren();

    const all = viewItems();
    const counts = dateCounts(all);
    const unread = unreadCounts(all);

    if (!all.length) {
        list.append(makeEmpty());
    } else {
        appendView(
            list, all, counts, unread
        );
    }

    all.forEach(item => {
        item.isNew = false;
    });

    setBadge(badge);
    setTabs(tabs);
    focusBack(focus);
}

function appendView(
    list, view, counts = null, unread = null
) {
    let last = '';
    const seen = new Map();

    view.forEach(item => {
        const key = dateKey(item.time);
        const open = opens.has(key);

        if (key !== last) {
            list.append(makeDate(
                item.time,
                counts?.get(key) || 0,
                unread?.get(key) || 0,
                !open
            ));

            last = key;
        }

        if (!open) {
            return;
        }

        const count = seen.get(key) || 0;
        const size = sizes.get(key) || STEP;

        if (count >= size) {
            return;
        }

        seen.set(
            key,
            count + 1
        );

        list.append(makeItem(item));
    });
}

function headSync(
    panel, head, title, actions
) {
    if (!panel || !head
        || !title || !actions) {
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

function moreItems(list) {
    const panel = list?.closest(
        '.notify-box'
    );

    if (!list || panel?.hidden) {
        return;
    }

    if (list.clientHeight <= 0 || loading) {
        return;
    }

    if (!active || !opens.has(active)) {
        return;
    }

    const all = viewItems();
    const total = dateCounts(all).get(active) || 0;
    const size = sizes.get(active) || STEP;

    if (size >= total) {
        return;
    }

    const nearBottom = (
        list.scrollTop
        + list.clientHeight
        >= list.scrollHeight - EDGE
    );

    if (!nearBottom) {
        return;
    }

    loading = true;

    const next = Math.min(
        size + STEP,
        total
    );

    const loads = makeLoads(
        next - size
    );

    list.append(...loads);

    requestAnimationFrame(() => {
        sizes.set(active, next);

        loads.forEach(item => {
            item.remove();
        });

        loading = false;

        render();
    });
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

function setFilter(button) {
    const next = button
        .dataset.filter || 'all';

    if (next === tab) {
        return;
    }

    tab = next;
    resetDates();

    ui.list.scrollTop = 0;

    render();
}

function searchToggle(
    search, input
) {
    if (!search || !input) {
        return;
    }

    const open = search.hidden;

    if (!open) {
        searchClose(
            search, input
        );

        return;
    }

    search.hidden = false;
    input.focus();
}

function searchClose(
    search, input
) {
    if (!search || !input) {
        return;
    }

    word = '';
    resetDates();

    input.value = '';
    search.hidden = true;

    ui.list.scrollTop = 0;

    render();
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

            const date = dateText(item.time)
                .toLowerCase();

            const key = dateKey(item.time)
                .toLowerCase();

            return title.includes(word)
                || message.includes(word)
                || date.includes(word)
                || key.includes(word);
        });
    }

    return [...list].sort(
        (a, b) => b.time - a.time
    );
}

function resetDates() {
    opens.clear();
    sizes.clear();
    active = '';
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

function makeImage(
    name, src, href = '', id = ''
) {
    const isLink = Boolean(href);

    const wrap = isLink
        ? document.createElement('a')
        : document.createElement('span');

    wrap.className = name;

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

function makeEmpty() {
    const empty = document.createElement('p');
    empty.className = 'notify-empty';

    if (word) {
        empty.textContent = '검색 결과가 없습니다.';
    } else if (tab === 'unread') {
        empty.textContent = '미확인 알림이 없습니다.';
    } else {
        empty.textContent = '새로운 알림이 없습니다.';
    }

    return empty;
}

function makeDate(
    time, count = 0, unread = 0, folded = false
) {
    const key = dateKey(time);

    const button = document.createElement('button');
    button.className = [
        'notify-date',
        unread > 0 ? 'unread' : 'read'
    ].join(' ');
    button.type = 'button';
    button.dataset.date = key;

    const title = document.createElement('span');
    title.className = 'notify-date-title';
    title.textContent = `${dateText(time)} (${count})`;

    const state = document.createElement('span');
    state.className = 'notify-date-state';
    state.textContent = folded
        ? '펼치기'
        : '접기';

    button.append(title, state);

    return button;
}

function makeLoads(count) {
    return Array.from(
        { length: count },
        () => {
            const item = document
                .createElement('div');

            item.className = (
                'notify-item load'
            );

            return item;
        }
    );
}

function dateToggle(event) {
    const button = event.target.closest(
        '.notify-date'
    );

    if (!button) {
        return false;
    }

    const key = button.dataset.date;

    if (!key) {
        return true;
    }

    if (opens.has(key)) {
        opens.delete(key);
        sizes.delete(key);

        if (active === key) {
            active = '';
        }
    } else {
        opens.add(key);
        sizes.set(key, STEP);
        active = key;
    }

    render();

    return true;
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
        .forEach(menuOff);
}

function menuToggle(event) {
    const button = event.target.closest(
        '.notify-more-button'
    );

    if (!button) {
        return false;
    }

    playClass(button, 'pop');

    const more = button.closest(
        '.notify-control'
    );

    $$('.notify-control.open')
        .forEach(item => {
            if (item !== more) {
                menuOff(item);
            }
        });

    more?.classList.remove('up');
    more?.classList.toggle('open');

    const menu = more?.querySelector(
        '.notify-more'
    );
    const panel = ui.panel;

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

function menuOff(item) {
    item?.classList.remove(
        'open',
        'up'
    );
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

function itemOpen(event) {
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

function readOne(id) {
    const notification = items.find(
        item => item.id === id
    );

    if (!notification
        || !notification.unread) {
        return;
    }

    notification.unread = false;

    saveItems();
    render();
}

function readAll() {
    const list = viewItems()
        .filter(item => item.unread);

    if (!list.length) {
        return;
    }

    list.forEach(item => {
        item.unread = false;
    });

    saveItems();
    render();
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

    menuOff(
        item.querySelector(
            '.notify-control'
        )
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
        viewItems()
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

function clearNode(
    item, index = 0
) {
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

function addItem(data) {
    const {
        list, badge
    } = ui;

    if (!list || !canNotify()) {
        return;
    }

    const menu = menuId();

    const hold = list.scrollTop > 0;
    const top = list.scrollTop;
    const height = list.scrollHeight;

    const item = toItem({
        ...data,
        id: ++id,
        unread: true
    }, true);

    items.unshift(item);

    const key = dateKey(item.time);

    if (hold && opens.has(key)) {
        sizes.set(
            key,
            (sizes.get(key) || STEP) + 1
        );
    }

    saveItems();

    if (hold) {
        list.classList.add('hold');
    }

    render();

    if (hold) {
        const next = list.scrollHeight;

        list.scrollTop = top
            + next
            - height;

        requestAnimationFrame(() => {
            list.classList.remove('hold');
        });
    }

    menuRestore(menu);

    setBadge(badge, true);
    playClass(ui.btn, 'shake');
    playSound();
}

function removeIds(ids) {
    const set = new Set(ids);

    const next = items.filter(
        item => !set.has(item.id)
    );

    if (next.length === items.length) {
        return;
    }

    items = next;

    saveItems();
    render();
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

function setBadge(
    badge, animate = false
) {
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

function toItem(
    data = {}, isNew = false
) {
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

function startTest() {
    if (!location.search.includes(
        'test'
    )) {
        return;
    }

    let count = 0;

    setInterval(() => {
        count += 1;

        const day = Math.floor(
            (count - 1) / 5
        ) % 3;

        addItem({
            title: `테스트 알림 ${count}`,
            message: '새 알림 추가 효과 테스트입니다.',
            href: '#',
            profileHref: '#',
            profile: '/favicon.svg',
            thumbnail: count % 2 === 0
                ? '/favicon.svg'
                : null,
            time: Date.now() - day * DAY
        });
    }, 3000);
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

function dateCounts(list) {
    const counts = new Map();

    list.forEach(item => {
        const key = dateKey(item.time);

        counts.set(
            key,
            (counts.get(key) || 0) + 1
        );
    });

    return counts;
}

function unreadCounts(list) {
    const counts = new Map();

    list.forEach(item => {
        if (!item.unread) {
            return;
        }

        const key = dateKey(item.time);

        counts.set(
            key,
            (counts.get(key) || 0) + 1
        );
    });

    return counts;
}