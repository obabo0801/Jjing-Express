import { config } from 'dotenv';
import express from 'express';
config({ quiet: true });
import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3000;
const PUBLIC = file.get(
    'public'
);

const CHECK = (
    process.env.CHECK === '1'
);

const PAGE_CHECK = file.get(
    'public/check.html'
);
const PAGE_SORRY = file.get(
    'public/sorry.html'
);
const PAGE_ERROR = file.get(
    'public/error.html'
);

const BLOCK = [
    '/check.html',
    '/sorry.html'
];

const DIRS = [
    '/css/',
    '/js/',
    '/assets/'
];

const FILES = [
    '/favicon.svg',
    '/check.svg'
];

app.use((req, res, next) => {
    if (!CHECK) {
        return next();
    }

    if (asset(req.path)) {
        return next();
    }

    if (req.path !== '/') {
        return res.redirect(302, '/');
    }

    return page(
        res, 503, PAGE_CHECK
    );
});

app.use((req, res, next) => {
    if (
        !html(req)
        && !css(req)
        && !js(req)
    ) {
        return next();
    }

    return page(
        res, 404, PAGE_SORRY
    );
});

app.use(express.static(PUBLIC));

app.use((req, res) => {
    return page(
        res, 404, PAGE_SORRY
    );
});

app.listen(PORT, () => {
    log.info(`http://localhost:${PORT}/`);
});

function page(res, status, target) {
    return res.status(status)
        .sendFile(target, err => {
        if (!err) {
            return;
        }

        log.error(err);

        if (res.headersSent) {
            return;
        }

        res.status(500).sendFile(
            PAGE_ERROR, error => {
            if (!error) {
                return;
            }

            log.error(error);
        });
    });
}

function ref(req) {
    return Boolean(
        req.get('referer')
    );
}

function asset(path) {
    return (
        DIRS.some(
            dir => path.startsWith(dir)
        ) || FILES.includes(path)
    );
}

function html(req) {
    return BLOCK.includes(
        req.path
    );
}

function js(req) {
    const dest = req.get(
        'sec-fetch-dest'
    );

    return (
        req.path.startsWith(
            '/js/'
        )
        && dest !== 'script'
        && !ref(req)
    );
}

function css(req) {
    const dest = req.get(
        'sec-fetch-dest'
    );

    return (
        req.path.startsWith(
            '/css/'
        )
        && dest !== 'style'
        && !ref(req)
    );
}