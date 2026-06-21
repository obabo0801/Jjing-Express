import { config } from 'dotenv';
import express from 'express';
config({ quiet: true });
import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3000;
const PUBLIC_PATH = file.get('public');
const CHECK = process.env.CHECK === '1';

const ASSET_DIRS = [
    '/css/',
    '/js/',
    '/assets/'
];

const ASSET_FILES = [
    '/favicon.svg',
    '/check.svg'
];

app.use((req, res, next) => {
    if (!CHECK) {
        return next();
    }

    if (isAsset(req.path)) {
        return next();
    }

    if (req.path !== '/') {
        return res.redirect(302, '/');
    }

    res.status(503).sendFile(
        file.get('public/check.html')
    );
});

app.use(express.static(PUBLIC_PATH));

app.use((req, res) => {
    res.status(404).sendFile(
        file.get('public/404.html')
    );
});

app.listen(PORT, () => {
    log.info(`http://localhost:${PORT}/`);
});

function isAsset(path) {
    return (
        ASSET_DIRS.some(
            dir => path.startsWith(dir)
        ) || ASSET_FILES.includes(path)
    );
}