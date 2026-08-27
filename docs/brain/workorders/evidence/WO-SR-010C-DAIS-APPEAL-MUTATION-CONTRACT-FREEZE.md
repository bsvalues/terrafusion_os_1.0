# WO-SR-010C - Dais Appeal Mutation Contract Freeze Evidence

## Current verdict

`DAIS_APPEAL_MUTATION_CONTRACT_FROZEN`

## Frozen boundary

`dais.appeal-mutation@1.0.0` defines two operations:

- `create`: applies the closed Dais ground vocabulary, `MARKET_VALUE` default, effective UTC tax-
  year default, and initial `filed` timestamps;
- `transition`: applies the closed lifecycle graph and emits only status and governed timestamps.

The exchange contains no parcel owner, address, email, phone, assessed or appealed value, decision
value, notes, provider, SQL, credential, or persistence field. The sovereign host remains responsible
for identity, authorization, county isolation, transactions, persistence, audit, and transport.

## Observed focused proof

The local synthetic corpus currently proves accepted create defaults, filed-to-heard, and heard-to-
decided decisions; typed rejection of invalid ground, tax year, requested status, terminal
transition, and time-regressing lifecycle; county/result mismatch; and schema rejection of PII and
monetary cross-lane fields. All three focused mutation tests pass and both JSON documents parse.

The pre-calendar-repair complete freeze verifier passed from a fresh disposable exact-commit checkout after
its manifest-listed files were mechanically rematerialized as canonical LF. It reported 7 groups,
66 frozen files, 10 deferred files, and 5 OS-internal files; the complete Node suite passed 23/23.
The Windows
sparse worktree materializes text as CRLF while the manifest correctly pins canonical Git LF blobs,
so no pre-existing frozen hash was rewritten to accommodate that checkout transformation.

## Claim boundary

This contract-freeze evidence does not by itself claim mutation runtime adoption or Dais source
ownership; those claims are established by their protected successor records below.

Independent review found and repaired one pre-freeze P1: the first candidate permitted a `filed`
snapshot with `decisionAt` and permitted `hasDecidedValue=true` on a non-`decided` target. The
decision semantics now reject both contradictory shapes with typed `INVALID_LIFECYCLE` results and
dedicated frozen negative fixtures.

A subsequent required-conversation finding exposed a second fail-open case: shape-valid but
calendar-impossible UTC timestamps could pass the schema regex and `Date.parse` ordering. The
contract proof now parses actual UTC calendar instants (including only known leap seconds) and adds
`invalid-calendar.synthetic.json`, which requires typed `INVALID_LIFECYCLE`. The repaired freeze is
7 groups / 67 frozen files. A detached exact-commit checkout of `a29f7a685` was mechanically
rematerialized from canonical Git blobs; the complete freeze verifier passed and the complete Node
suite passed 23/23.

## Protected completion

Sovereign PR #1468 reviewed exact head `377ed29b84c4f46b623f61a64d7644f911f76db6`
and merged as protected main `52744220509a54b6544e0fa193b6d09e8d93c159` with tree
`45c652086876c0e3841f742012614e1bf377674c`. Backend compilation, required
checks, exact-head merge, and protected-main verification passed.
