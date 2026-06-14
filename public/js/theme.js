const root = document.documentElement;
const key = 'theme';

export function initTheme() {
    const button = document.querySelector('.theme-button');

    setTheme(getTheme(), false);
    watchTheme();

    button?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const theme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(theme);
}

function setTheme(theme, save = true) {
    root.dataset.theme = theme;

    if (save) {
        localStorage.setItem(key, theme);
    }
}

function getTheme() {
    return localStorage.getItem(key)
        || systemTheme();
}

function systemTheme() {
    return matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function watchTheme() {
    const query = matchMedia('(prefers-color-scheme: dark)');

    query.addEventListener('change', () => {
        if (localStorage.getItem(key)) {
            return;
        }

        setTheme(systemTheme(), false);
    });
}