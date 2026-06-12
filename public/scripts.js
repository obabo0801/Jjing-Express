const button = document.querySelector('.theme-button');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme') === 'light'
    ? 'light'
    : 'dark';

setTheme(savedTheme);

button?.addEventListener('click', () => {
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
    }
});