# WO-SR-011D - Dossier Mutation Decision Contract Freeze Evidence

## Current verdict

`FOCUSED_CONTRACT_PROOF_PASS_PROTECTED_ASSURANCE_PENDING`

## Boundary evidence

`dossier.mutation-decision@1.0.0` contains six pure decision operations: `createNote`,
`registerDocument`, `transitionDocumentStatus`, `registerEvidence`, `appendCustodyEvent`, and
`createPacket`. It carries explicit sovereign host assertions, allocated identities/timestamps,
optimistic versions/current snapshots, and host-computed hash-chain inputs. It contains no database,
SQL, transaction, credential, HTTP, TerraTrace implementation, provider call, or deployment action.

The frozen semantics mirror the current persistent controller meaning: append-only notes; initial
active documents with Dossier-owned custody classification; forward-only active/sealed/archived transitions; pending evidence with a created
genesis event; the existing six custody actions and current integrity mappings; and template-order
packet completeness over non-archived current documents. Packet matching is made deterministic by
newest upload instant then document ID. No evidence or custody state is mutated by this proof.

## Observed local proof

- eight accepted synthetic exchanges pass schema and exact-output comparison, including custody-
  entering deed, non-custody photo, and unknown-type default-false registration;
- six typed rejected exchanges prove false host assertions, create-version conflict, backward
  document status, stale chain head, cross-parcel document linkage, and duplicate template refusal;
- result identity mismatch fails semantic proof and HTTP/persistence/connection fields fail schema;
- host-supplied `entersCustodyChain` fails schema, closing the last sovereign classification leak;
- target document/evidence identity is bound into each mutable current-state snapshot and tested
  against same-scope target substitution;
- the focused Node test reports 3/3 passing;
- every new contract file is listed in the sovereign freeze manifest by SHA-256.

At exact local commit `5744c63ea1e4018d595c482d971af7f102df9ab6`, rebased onto protected staging
merge `aec4f1e18b619730842c828e4f1c93ecd18d64b2`, all 85 frozen files were mechanically rematerialized from
canonical Git blobs. The complete freeze verifier passed with 8 groups, 85 frozen files, 10
deferred files, and 5 OS-internal files; the complete Node suite passed 26/26. Independent review's
ownership finding was repaired before publication by removing host-supplied custody classification
and freezing the exact current Dossier mapping with true, false, and unknown/default proof.

The Windows sparse checkout materializes pre-existing frozen files with CRLF, so complete freeze
identity is run from canonical Git blobs after commit rather than rewriting any established hash.
C# compilation is delegated to the protected Backend Gate because this host has no `dotnet` binary.

## Dependency and remaining required gates

`WO-SR-011B` passed 8/8 required checks with zero unresolved threads and merged reviewed head
`85387bdc6088eb82fc8bcd16cfd1424e95804597` as protected main
`d82a2d3638a722fa541836abbd5c4ab45f8e060d`. This branch integrates that exact merge. The initial
protected contract checks also exposed and closed a reserved-C#-keyword build failure, an
operation/mutation schema-coupling gap, and whitespace-only custody notes; Backend Fast, canonical
Backend, Seal, governance, and the complete canonical Git-blob freeze subsequently passed.

The post-integration exact-head proof rerun, protected checks, merge, and protected-main
verification remain required. Optional third-party review is non-gating. Rollback is the additive
contract commit revert; no runtime or county data was touched.
