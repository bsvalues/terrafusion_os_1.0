import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function frontendViteUrl() {
  const frontendRequire = createRequire(new URL('../../frontend/package.json', import.meta.url));
  const manifest = frontendRequire('vite/package.json');
  return new URL(
    manifest.exports['.'].import,
    pathToFileURL(frontendRequire.resolve('vite/package.json'))
  ).href;
}

/** Keep test preview and the API's default CORS origin on the same configured port. */
export function previewOptions(env = process.env) {
  const rawPort = env.TF_FRONTEND_PORT ?? '3102';
  if (!/^[1-9]\d{0,4}$/.test(rawPort) || Number(rawPort) > 65535) {
    throw new Error('TF_FRONTEND_PORT must be an integer between 1 and 65535.');
  }
  return {
    root: fileURLToPath(new URL('../../frontend', import.meta.url)),
    preview: { host: 'localhost', port: Number(rawPort), strictPort: true },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = previewOptions();
  const { preview } = await import(frontendViteUrl());
  const server = await preview(options);
  server.printUrls();
}
