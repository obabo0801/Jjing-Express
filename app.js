import express from 'express';
import https from 'https';

import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3000;
const PUBLIC_PATH = file.get('public');

const HTTPS_OPTIONS = {
    key: file.read(
        'config/private.key'
    ),
    cert: file.read(
        'config/public.crt'
    )
};

app.use(express.static(PUBLIC_PATH));

https.createServer(
    HTTPS_OPTIONS, app
).listen(PORT, () => {
    log.info(`https://localhost:${PORT}/`);
});