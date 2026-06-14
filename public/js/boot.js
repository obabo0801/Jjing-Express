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

let faviconUrls = {};

window.setFaviconTheme = (
    function setFaviconTheme(theme)
{
    const icon = document.querySelector(
        'link[rel="icon"]'
    );

    if (!icon || !faviconUrls[theme]) {
        return;
    }

    icon.href = faviconUrls[theme];
});

async function initFavicon() {
    const response = await fetch('/favicon.svg');
    const svg = await response.text();

    faviconUrls = {
        dark: createFaviconUrl(svg, '#ffffff'),
        light: createFaviconUrl(svg, '#c98e5f')
    };

    window.setFaviconTheme(theme);
}

function createFaviconUrl(svg, color) {
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

initFavicon();