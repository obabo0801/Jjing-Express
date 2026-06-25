import { initTheme }
    from './theme.js';
import { initTop }
    from './top.js';
import { initNotify }
    from './notification.js';
import { initSetting }
    from './settings.js';

init();

function init() {
    initTheme();
    initTop();
    initNotify();
    initSetting();
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