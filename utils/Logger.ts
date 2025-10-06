// Minimal stub for Logger
export class Logger {
  constructor(serviceName?: string) {}
  error(...args: any[]) { console.error(...args); }
  info(...args: any[]) { console.info(...args); }
  warn(...args: any[]) { console.warn(...args); }
  debug(...args: any[]) { console.debug(...args); }
}
