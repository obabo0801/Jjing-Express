(() => {
    const root = document.documentElement;
    const key = 'theme';
    const sysQuery = '(prefers-color-scheme: light)';

    const modes = [
        'light',
        'dark',
        'night',
        'system'
    ];

    const saved = localStorage.getItem(key);

    const mode = modes.includes(saved)
        ? saved
        : 'light';

    root.setAttribute('theme', mode);

    let favicons = {};

    window.setFaviconTheme = function setFaviconTheme(theme) {
        const icon = document.querySelector(
            'link[rel="icon"]'
        );

        if (!icon || !favicons[theme]) {
            return;
        }

        icon.href = favicons[theme];
    };

    init();

    async function init() {
        const response = await fetch('/favicon.svg');
        const svg = await response.text();

        favicons = {
            light: createUrl(svg, '#c98e5f'),
            dark: createUrl(svg, '#ffffff'),
            night: createUrl(svg, '#ffffff')
        };

        window.setFaviconTheme(
            mode === 'system'
                ? sys()
                : mode
        );
    }

    function sys() {
        return matchMedia(sysQuery).matches
            ? 'light'
            : 'dark';
    }

    function createUrl(svg, color) {
        const favicon = svg.replace(
            '</svg>',
            `
                <style>
                    .favicon {
                        fill: ${color} !important;
                    }
                </style>
            </svg>`
        );

        const blob = new Blob(
            [favicon],
            { type: 'image/svg+xml' }
        );

        return URL.createObjectURL(blob);
    }
})();