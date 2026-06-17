import express from 'express';
import http from 'http';
import https from 'https';

import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const PUBLIC_PATH = file.get('public');

const HTTPS_OPTIONS = {
    key: file.read(
        'config/private.key'
    ),
    cert: file.read(
        'config/public.crt'
    )
};

app.use(
    express.static(PUBLIC_PATH)
);

const isHttps =
    HTTPS_OPTIONS.key
    && HTTPS_OPTIONS.cert;

const server = isHttps
    ? https.createServer(
        HTTPS_OPTIONS,
        app
    )
    : http.createServer(app);

const port = isHttps
    ? HTTPS_PORT
    : HTTP_PORT;

const protocol = isHttps
    ? 'https'
    : 'http';

server.listen(port, () => {
    log.info(`${protocol}://localhost/`);
});