const root = document.documentElement;
const sysQuery = '(prefers-color-scheme: light)';

document.addEventListener('contextmenu', event => {
    event.preventDefault();
});

window.addEventListener('load', () => {
    document.body.classList.add('ready');
});

matchMedia(sysQuery).addEventListener('change', () => {
    if (root.dataset.themeMode !== 'system') {
        window.setFaviconTheme?.(sys());
        return;
    }

    const theme = sys();

    root.dataset.theme = theme;
    window.setFaviconTheme?.(theme);
});

function sys() {
    return matchMedia(sysQuery).matches
        ? 'light'
        : 'dark';
}