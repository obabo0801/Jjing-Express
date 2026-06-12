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

settingsButton?.addEventListener('click', (event) => {
    event.stopPropagation();

    notification?.classList.remove('is-open');

    location.hash = 'settings';
});

window.addEventListener('hashchange', () => {
    if (location.hash === '#settings') {
        openSettingsPopup();
        return;
    }

    closeSettingsPopup(false);
});

async function openSettingsPopup() {
    if (document.querySelector('.settings-layer')) {
        return;
    }

    try {
        const response = await fetch('/components/settings.html');
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

            const tab = target.closest('[data-settings-tab]');

            if (tab) {
                const name = tab.dataset.settingsTab;

                layer.querySelectorAll('.settings-tab').forEach((button) => {
                    button.classList.toggle('is-active', button === tab);
                });

                layer.querySelectorAll('.settings-panel').forEach((panel) => {
                    panel.classList.toggle(
                        'is-active',
                        panel.dataset.settingsPanel === name
                    );
                });
            }
        });
    } catch (error) {
        console.error(error);
    }
}

function closeSettingsPopup(updateHash = true) {
    document.querySelector('.settings-layer')?.remove();
    document.body.style.overflow = '';

    if (updateHash && location.hash === '#settings') {
        history.back();
    }
}

if (location.hash === '#settings') {
    openSettingsPopup();
}