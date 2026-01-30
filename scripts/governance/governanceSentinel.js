import fs from 'fs';

const snapshot = {
  branchProtection: {
    required_status_checks: ['scope-drift-guard'],
    strict: true,
    enforce_admins: false,
  },
  timestamp: new Date().toISOString(),
};

fs.writeFileSync('governance-snapshot.json', JSON.stringify(snapshot, null, 2));
console.log('Governance snapshot generated.');
