/**
 * Custom Jest transformer that replaces import.meta.env references with
 * literal values BEFORE ts-jest compiles TypeScript.
 *
 * Why: Jest's vm.Script (CommonJS) cannot parse `import.meta` syntax at
 * the parser level. Runtime mocks in setupTests.ts and globals config
 * run too late — the SyntaxError fires during parsing, not execution.
 *
 * This transformer does regex text-replacement on raw source first, then
 * delegates to ts-jest for the actual TypeScript compilation.
 */

const tsJest = require('ts-jest');

module.exports = {
  createTransformer(tsJestConfig) {
    const inner = tsJest.createTransformer(tsJestConfig);

    return {
      process(sourceText, sourcePath, options) {
        // Replace import.meta.env references with literal values.
        // Order matters: specific vars first, then catch-all patterns.
        const cleaned = sourceText
          // Specific VITE_ environment variables
          .replace(/import\.meta\.env\.VITE_API_URL/g, '"http://localhost:5000"')
          .replace(/import\.meta\.env\.VITE_COUNTY_NAME/g, '"Benton County"')
          .replace(/import\.meta\.env\.VITE_COUNTY_CODE/g, '"benton"')
          .replace(/import\.meta\.env\.VITE_COUNTY_FIPS/g, '"53005"')
          .replace(/import\.meta\.env\.VITE_COUNTY_STATE/g, '"Washington"')
          .replace(/import\.meta\.env\.VITE_COUNTY_PARCEL_COUNT/g, '"100000"')
          .replace(/import\.meta\.env\.VITE_HARRIS_PACS_VERSION/g, '"9.0"')
          .replace(/import\.meta\.env\.VITE_HARRIS_PACS_ENABLED/g, '"true"')
          .replace(/import\.meta\.env\.VITE_SYNC_INTERVAL/g, '"15"')
          .replace(/import\.meta\.env\.VITE_DEMO_MODE/g, '"false"')
          .replace(/import\.meta\.env\.VITE_DEPLOYMENT_MODE/g, '"test"')
          .replace(/import\.meta\.env\.VITE_SLA_AVAILABILITY/g, '"99.9"')
          .replace(/import\.meta\.env\.VITE_SLA_P95_LATENCY/g, '"150"')
          .replace(/import\.meta\.env\.VITE_AI_SWARM_ENABLED/g, '"true"')
          .replace(/import\.meta\.env\.VITE_QUANTUM_OPTIMIZATION/g, '"true"')
          .replace(/import\.meta\.env\.VITE_REAL_TIME_SYNC/g, '"true"')
          .replace(/import\.meta\.env\.VITE_ADVANCED_ANALYTICS/g, '"true"')
          // Built-in Vite env flags
          .replace(/import\.meta\.env\.DEV/g, 'true')
          .replace(/import\.meta\.env\.PROD/g, 'false')
          .replace(/import\.meta\.env\.MODE/g, '"test"')
          .replace(/import\.meta\.env\.SSR/g, 'false')
          .replace(/import\.meta\.env\.BASE_URL/g, '"/"')
          // Catch-all: any remaining VITE_ or uppercase env vars
          .replace(/import\.meta\.env\.[A-Z_]+/g, '""')
          // Bare import.meta.env object reference
          .replace(/import\.meta\.env/g, '({})');

        return inner.process(cleaned, sourcePath, options);
      },

      getCacheKey(...args) {
        return inner.getCacheKey(...args);
      },
    };
  },
};
