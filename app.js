import { config } from 'dotenv';
import express from 'express';
config({ quiet: true });
import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3001;
const PUB = file.get('public');
const CHECK = process.env.CHECK === '1';

const BLOCK = [
    '/check.html',
    '/404.html'
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

    res.status(503).sendFile(
        file.get('public/check.html')
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

    return res.status(404).sendFile(
        file.get('public/404.html')
    );
});

app.use(express.static(PUB));

app.use((req, res) => {
    return res.status(404).sendFile(
        file.get('public/404.html')
    );
});

app.listen(PORT, () => {
    log.info(`http://localhost:${PORT}/`);
});

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