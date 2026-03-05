import { createServer } from './server.js';
import { validateStartupEnv } from './lib/runtimeConfig.js';

const port = Number(process.env.PORT ?? 3001);
const host = '0.0.0.0';

validateStartupEnv();

const app = createServer();

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`API listening on http://${host}:${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
