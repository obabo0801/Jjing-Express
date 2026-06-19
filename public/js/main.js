import { initTheme }
    from './theme.js';
import { initTop }
    from './top.js';
import { initNotification }
    from './notification.js';
import { initSettings }
    from './settings.js';

init();

function init() {
    ready();
    initTheme();
    initTop();
    initNotification();
    initSettings();
}

function ready() {
    requestAnimationFrame(() => {
        document
            .body
            .classList
            .add('is-ready');
    });
}