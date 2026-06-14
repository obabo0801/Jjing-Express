const root = document.documentElement;
const darkQuery = '(prefers-color-scheme: dark)';

const theme = matchMedia(darkQuery).matches
    ? 'dark'
    : 'light';

root.dataset.theme = theme;