# Security Policy

- Supported branches: main (Terrafusion OS 1.0)
- Report vulnerabilities:
  [security@terrafusion.local](mailto:security@terrafusion.local) (do not open
  public issues)
- Do not include sensitive data in reports. Share PoCs privately.

## Key and Secrets Handling

- Never commit production secrets or private keys. The `keys/` directory must
  only contain placeholders or dev materials.
- Rotate keys per-county. Each county (sovereign model) must use distinct
  credentials.
- Store secrets in your secure vault (see
  `frontend/electron/security/secure-vault.js`).

## County Isolation Requirements

- No cross-county data sharing for Sovereign deployments.
- Federated model must use gateway-enforced isolation per documented policies.

## Responsible Disclosure

1.  Email report with detailed reproduction steps.
2.  We acknowledge within 3 business days.
3.  Fix timeline depends on severity and government impact.

## Compliance

- FISMA/NIST controls maintained; see `docs/compliance/`.
- Branding and public messaging: "Government. Transcended." per brand guide.
