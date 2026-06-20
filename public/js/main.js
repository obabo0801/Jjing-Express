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
    initTheme();
    initTop();
    initNotification();
    initSettings();
    ready();
}

function ready() {
    requestAnimationFrame(() => {
        document
            .body
            .classList
            .add('ready');
    });
}