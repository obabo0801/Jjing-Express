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

window.setFaviconTheme = (
    async function setFaviconTheme(theme)
{
    const icon = document.querySelector(
        'link[rel="icon"]'
    );

    if (!icon) {
        return;
    }

    const color = theme === 'dark'
        ? '#ffffff'
        : '#c98e5f';

    const response = await fetch('/favicon.svg');
    let svg = await response.text();

    svg = svg.replace(
        '</svg>',
        `
            <style>
                .favicon {
                    fill: ${color} !important;
                }
            </style>
        </svg>`
    );

    icon.href = (
        'data:image/svg+xml;charset=utf-8,'
        + encodeURIComponent(svg)
    );
});

window.setFaviconTheme(theme);