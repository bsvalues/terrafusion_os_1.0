"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
// Minimal stub for Logger
class Logger {
    constructor(serviceName) { }
    error(...args) { console.error(...args); }
    info(...args) { console.info(...args); }
    warn(...args) { console.warn(...args); }
    debug(...args) { console.debug(...args); }
}
exports.Logger = Logger;
