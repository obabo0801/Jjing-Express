import { config } from 'dotenv';
import express from 'express';
config({ quiet: true });
import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3000;
const PUBLIC_PATH = file.get('public');
const CHECK = process.env.CHECK === '1';

app.use((req, res, next) => {
    if (!CHECK) {
        return next();
    }

    if (isAsset(req.path)) {
        return next();
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
    return path.startsWith('/css/')
        || path.startsWith('/js/')
        || path.startsWith('/assets/')
        || path === '/favicon.svg'
        || path === '/check.svg';
}