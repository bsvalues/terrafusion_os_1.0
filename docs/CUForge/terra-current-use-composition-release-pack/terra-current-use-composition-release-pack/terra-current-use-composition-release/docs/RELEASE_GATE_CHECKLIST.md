# Current Use Release Gate Checklist

## Compile

- [ ] Frontend compiles
- [ ] Backend compiles
- [ ] Tests pass
- [ ] No route collision
- [ ] No duplicate DI registration

## Domain Boundaries

- [ ] Forge owns rollback facts
- [ ] Dais only references workflow
- [ ] Dossier owns document bodies
- [ ] Atlas owns geometry
- [ ] Treasurer owns collection
- [ ] TerraTrace receives audit events

## Safety

- [ ] AI disabled or explain-only
- [ ] Notice issuance is preview-only
- [ ] Interest calculation limitation is visible
- [ ] Policy version is visible
- [ ] Trace is append-only
- [ ] No automatic approval/denial/removal

## Demo

- [ ] Open parcel
- [ ] Current Use tab visible
- [ ] Rollback calculation works
- [ ] Explanation ledger visible
- [ ] Notice preview visible
- [ ] Trace event visible
- [ ] Policy pack visible
