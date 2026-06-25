import { initTheme }
    from './theme.js';
import { initTop }
    from './top.js';
import { initNotify }
    from './notification.js';
import { initSettings }
    from './settings.js';

init();

function init() {
    initTheme();
    initTop();
    initNotify();
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