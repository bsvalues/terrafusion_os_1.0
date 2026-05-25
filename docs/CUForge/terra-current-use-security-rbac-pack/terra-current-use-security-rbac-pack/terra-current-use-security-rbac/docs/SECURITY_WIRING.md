# Current Use Security Wiring

## Backend

Register:

```csharp
services.AddTerraCurrentUseSecurity();
```

## Frontend

Wrap dangerous actions:

```tsx
<CurrentUsePermissionGate
  principal={principal}
  permission="ISSUE_NOTICE"
  fallback={<CurrentUseReadOnlyNotice />}
>
  <IssueNoticeButton />
</CurrentUsePermissionGate>
```

## Required Protected Actions

- rollback lock
- notice approval
- notice issuance
- notice void
- policy management
- payment marked paid
- import commit
- AI assist
