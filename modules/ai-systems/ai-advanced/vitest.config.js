"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts'],
            threshold: {
                global: {
                    statements: 85,
                    functions: 85,
                    branches: 85,
                    lines: 85,
                },
            },
        },
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules/', 'dist/'],
    },
});
//# sourceMappingURL=vitest.config.js.map