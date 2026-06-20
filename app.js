import express from 'express';

import * as file from '#utils/file';
import * as log from '#utils/log';

const app = express();

const PORT = 3000;
const PUBLIC_PATH = file.get('public');

app.use(express.static(PUBLIC_PATH));

app.listen(PORT, () => {
    log.info(`http://localhost:${PORT}/`);
});