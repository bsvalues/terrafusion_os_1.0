# Commit Sequence

## Commit 1

```txt
feat(current-use): add TerraForge Current Use frontend module
```

## Commit 2

```txt
feat(current-use): add rollback engine and frontend tests
```

## Commit 3

```txt
feat(current-use): add backend API skeleton and rollback service
```

## Commit 4

```txt
test(current-use): add backend rollback calculator tests
```

## Commit 5

```txt
docs(current-use): add API contract and hardening checklist
```

## Merge Gate

Do not merge unless:

- frontend build passes
- backend build passes
- rollback tests pass
- Workbench tab registration is behind safe module flag or isolated tab registry
