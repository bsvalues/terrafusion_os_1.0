// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAEMON_ERROR_CODES = exports.DAEMON_METHODS = void 0;
exports.encodeFrame = encodeFrame;
exports.createLineSplitter = createLineSplitter;
exports.DAEMON_METHODS = {
    ADAPTER_LIST: 'adapter.list',
    ADAPTER_COMPLETE: 'adapter.complete',
    ADAPTER_CHAT: 'adapter.chat',
    ADAPTER_CANCEL: 'adapter.cancel',
    DAEMON_SHUTDOWN: 'daemon.shutdown',
};
exports.DAEMON_ERROR_CODES = {
    UNKNOWN_METHOD: 'unknown_method',
    UNKNOWN_ADAPTER: 'unknown_adapter',
    INVALID_PARAMS: 'invalid_params',
    ADAPTER_ERROR: 'adapter_error',
    REQUEST_FAILED: 'request_failed',
    CONNECTION_CLOSED: 'connection_closed',
};
/** Encode a frame as one newline-terminated JSON line. */
function encodeFrame(frame) {
    return `${JSON.stringify(frame)}\n`;
}
/** Stateful line splitter for the wire protocol. */
function createLineSplitter() {
    let buf = '';
    return {
        push(chunk) {
            buf += chunk;
            const out = [];
            let idx;
            while ((idx = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, idx);
                buf = buf.slice(idx + 1);
                if (line.trim().length > 0)
                    out.push(line);
            }
            return out;
        },
    };
}
