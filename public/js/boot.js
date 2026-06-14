const root = document.documentElement;
const key = 'theme';
const darkQuery = '(prefers-color-scheme: dark)';

const savedTheme = localStorage.getItem(key);

const theme = savedTheme
    || (
        matchMedia(darkQuery).matches
            ? 'dark'
            : 'light'
    );

root.dataset.theme = theme;