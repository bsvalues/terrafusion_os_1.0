// Dev-only SecureVault seeder for Benton County credentials
// Usage: node frontend/electron/tools/vault-seeder.dev.js
// Note: Do NOT commit real secrets. This seeds mock credentials for local development.

const { SecureVault } = require('../security/secure-vault');

(async () => {
  try {
    const vault = new SecureVault();
    const countyId = 'benton';
    const mockCreds = {
      type: 'pacs9-service-account',
      username: 'dev_benton',
      token: 'mock-token-for-local-dev',
      issuedAt: new Date().toISOString(),
    };

    await vault.storeCountyCredentials(countyId, mockCreds);
    console.log(`[vault] Seeded mock credentials for county: ${countyId}`);
  } catch (err) {
    console.error('[vault] Failed to seed credentials:', err);
    process.exitCode = 1;
  }
})();
