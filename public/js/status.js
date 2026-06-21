(() => {
    const root = document.documentElement;
    const sysQuery = '(prefers-color-scheme: light)';

    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    });

    matchMedia(sysQuery).addEventListener('change', () => {
        if (root.getAttribute('theme') !== 'system') {
            return;
        }

        window.setFaviconTheme?.(sys());
    });

    function sys() {
        return matchMedia(sysQuery).matches
            ? 'light'
            : 'dark';
    }
})();