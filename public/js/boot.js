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

let favicons = {};

window.setFaviconTheme = (
    function setFaviconTheme(theme)
{
    const icon = document.querySelector(
        'link[rel="icon"]'
    );

    if (!icon || !favicons[theme]) {
        return;
    }

    icon.href = favicons[theme];
});

async function init() {
    const response = await fetch('/favicon.svg');
    const svg = await response.text();

    favicons = {
        dark: createUrl(svg, '#ffffff'),
        light: createUrl(svg, '#c98e5f')
    };

    window.setFaviconTheme(theme);
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

init();