# Current Use Support Runbook

## First Checks

1. Check module health.
2. Check recent errors.
3. Check feature flags.
4. Confirm policy resolver.
5. Confirm rollback engine version.
6. Confirm TerraTrace sink.
7. Confirm user permissions.

## Common Issues

### Missing rollback values

Error:

```txt
CU_ROLLBACK_MISSING_TAX_YEAR_DATA
```

Action:

- verify current-use value
- verify true and fair value
- verify levy rate
- rerun calculation after values are complete

### Notice cannot issue

Error:

```txt
CU_NOTICE_APPROVAL_REQUIRED
```

Action:

- verify notice status is ApprovedForIssuance
- verify user has IssueNotice permission

### Permission denied

Error:

```txt
CU_PERMISSION_DENIED
```

Action:

- check role catalog
- verify user assigned proper county role
