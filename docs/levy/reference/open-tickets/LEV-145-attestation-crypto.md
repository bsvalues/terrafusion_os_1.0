# LEV-145 — Assessor Attestation as Hash + CorrelationId

**Status:** OPEN | **Blocking:** T-4 / LEV-134 | **Priority:** MUST-HAVE

## Problem
LEV-134 currently specifies "assessor signature line" — prose, print-artifact
thinking. For TerraTrace + 6-year retention (LEV-142) + FISMA audit, this
must be cryptographic: hash of the certification payload + signer identity +
correlationId + timestamp.

A signature line on a PDF is **not** a cryptographic attestation and will
not survive a rigorous DPA / auditor review.

## Out of scope until DPA + security review
- Whether Benton requires Common-Access-Card / smart-card signing or accepts
  password-backed identity
- Key management (does the county have a PKI, or do we use a signed JWT
  claim from the assessor's identity provider?)

## Open questions for Assessor + DPA + security
1. What authentication does the Assessor use to sign the REV 64-0100 today
   (wet signature on PDF? digital signature?)
2. Is there an existing county PKI / signing cert?
3. Must attestation be **non-repudiable** (smart-card / HSM) or is
   strong-authenticated-session sufficient?

## Deliverable shape (sketch)
- Attestation event payload:
  ```
  {
    eventType: "levy.certification.attested",
    certRunId, taxYear, countyId,
    payloadHash: sha256(canonical JSON of all district certifications),
    signerSubject: <OIDC sub or cert CN>,
    signerName: <display>,
    signatureAlgorithm: "RS256" | "ES256",
    signature: <base64>,
    correlationId,
    attestedAt
  }
  ```
- PDF cert package (LEV-134) embeds the payloadHash + correlationId + a
  verification URL, alongside the wet signature (belt-and-suspenders)
- Verify endpoint: `GET /api/levy/v1/attestation/{correlationId}/verify` —
  returns pass/fail + signer identity

## References
- LEV-134 (certification documents)
- LEV-142 (retention + PRA)
- NIST SP 800-57 — Key Management
- FISMA-HIGH controls AU-10 (non-repudiation)
