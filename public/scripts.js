const button = document.querySelector('.theme-button');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';

setTheme(savedTheme);

button?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    setTheme(nextTheme);
});

function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);

    if (button) {
        button.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}