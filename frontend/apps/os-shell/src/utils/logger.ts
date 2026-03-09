const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args: unknown[]) => { if (isDev) console.info('[TF]', ...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn('[TF]', ...args); },
  error: (...args: unknown[]) => console.error('[TF]', ...args),
  debug: (...args: unknown[]) => { if (isDev) console.debug('[TF]', ...args); },
};

export default logger;
