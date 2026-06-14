const key = 'theme';
const root = document.documentElement;
const darkQuery = '(prefers-color-scheme: dark)';

const theme = localStorage.getItem(key)
    || (
        matchMedia(darkQuery).matches
            ? 'dark'
            : 'light'
    );

root.dataset.theme = theme;