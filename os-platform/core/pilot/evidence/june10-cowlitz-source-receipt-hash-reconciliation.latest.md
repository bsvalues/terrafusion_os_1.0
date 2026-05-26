# Cowlitz Source Receipt Hash Reconciliation

Generated: 2026-05-26T19:36:23.908Z

## Verdict

- Decision: receipt_corrected
- Hash parity restored: yes
- Parity mode: lf_to_crlf
- DB mutation attempted: no
- Cowlitz correction authorization ready: no
- Dry-run invalidated for authorization: no
- Production binding allowed: no

## Hashes

| Artifact | SHA-256 |
| --- | --- |
| Current raw artifact | b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174 |
| Source snapshot receipt | 90c663bb977e69155625df5a73a66c59f40a42ef9ff797a89fcb4deccf3b35e1 |
| Capture metadata | 90c663bb977e69155625df5a73a66c59f40a42ef9ff797a89fcb4deccf3b35e1 |

## Timestamp Comparison

| Source | Timestamp |
| --- | --- |
| Capture metadata | 2026-05-26T05:15:15.6517820Z |
| Source snapshot receipt | 2026-05-26T05:15:28.190Z |
| Current raw artifact mtime | 2026-05-26T18:43:17.658Z |
| Cowlitz dry-run generated | 2026-05-26T19:26:13.746Z |

## Raw Artifact Shape

| Metric | Value |
| --- | ---: |
| Bytes | 2116474 |
| JSONL pages | 29 |
| Features | 57705 |
| Pages with transfer limit | 28 |
| Pages without transfer limit | 1 |

## Variant Checks

| Variant | SHA-256 | Matches receipt |
| --- | --- | --- |
| raw_current_bytes | b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174 | no |
| ensure_final_lf | b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174 | no |
| trim_end | 6419ffda1d4a522db59109a6d2531e897ca7b124d9e50907c3c19f1315e42fa8 | no |
| crlf_to_lf | b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174 | no |
| lf_to_crlf | 90c663bb977e69155625df5a73a66c59f40a42ef9ff797a89fcb4deccf3b35e1 | yes |
| first_jsonl_line_only | 437d78b4a608e36b8053a7b9a6f6b5d342ffad4dfaa2027492e1c3db42af21d1 | no |
| first_jsonl_line_with_lf | f8467c83676248e2dcf117a31de85200e5be88ca1aeaa73f022cf540c69783e6 | no |
| jsonl_pages_minified | 6419ffda1d4a522db59109a6d2531e897ca7b124d9e50907c3c19f1315e42fa8 | no |
| jsonl_pages_minified_with_lf | b1c30d8f72b5cd81bdabcb6a01e006e8cdf74b789cd226e2bcda0a2686445174 | no |

## Decision

rerun Cowlitz bounded correction dry-run with this line-ending-aware receipt reconciliation evidence

Likely cause: receipt hash was computed over CRLF-normalized JSONL bytes while the current artifact is stored with LF line endings.

## Blockers

- Raw-byte hash differs because the receipt hash matches line-ending variant(s): lf_to_crlf.
- Cowlitz correction authorization remains blocked until the dry-run consumes this reconciliation evidence.
