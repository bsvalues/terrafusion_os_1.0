/**
 * Custom Jest transformer to replace import.meta.env with process.env equivalents
 * This enables Vite projects to run tests with Jest
 */

const { createTransformer } = require('ts-jest');

const tsJestTransformer = createTransformer();

module.exports = {
  process(sourceText, sourcePath, options) {
    // Replace import.meta.env references with a mock object
    const transformedSource = sourceText
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
      .replace(/import\.meta\.env\.DEV/g, 'true')
      .replace(/import\.meta\.env\.PROD/g, 'false')
      .replace(/import\.meta\.env\.MODE/g, '"test"')
      .replace(/import\.meta\.env\.[A-Z_]+/g, '""') // Catch any remaining env vars
      .replace(/import\.meta\.env/g, '{}'); // Replace any raw import.meta.env references

    // Use ts-jest for the actual TypeScript transformation
    return tsJestTransformer.process(transformedSource, sourcePath, options);
  },
};
