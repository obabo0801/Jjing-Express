const key = 'theme';
const root = document.documentElement;

const theme = localStorage.getItem(key)
    || (
        matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
    );

root.dataset.theme = theme;