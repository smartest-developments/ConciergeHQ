import { createServer } from './server.js';
import { getServerConfig, validateStartupConfig } from './lib/runtimeConfig.js';

try {
  validateStartupConfig();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown startup configuration error';
  console.error(message);
  process.exit(1);
}

const { port, host } = getServerConfig();

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
