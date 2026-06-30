# Work Order Query Tool

`wo-query.mjs` is the first read-only query tool for the TerraFusion Work Order Engine.

It answers:

- current active lane;
- completed Work Orders;
- blocked Work Orders;
- next recommended Work Order;
- why that Work Order is next.

## Contract

The tool is intentionally read-only:

- reads registry JSON;
- reads scoring rules JSON;
- computes advisory scores locally;
- writes only to stdout;
- does not query GitHub;
- does not inspect worktrees;
- does not create, edit, stage, commit, push, or merge.

## Usage

```powershell
node docs/brain/workorders/tools/wo-query.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
node docs/brain/workorders/tools/wo-query.mjs --authority R1
node docs/brain/workorders/tools/wo-query.mjs --registry docs/brain/workorders/registry/work-order-registry.seed.json
```

## Output

Text output is designed for operators. JSON output is designed for future Goal + Loop integration.

The recommendation is advisory. It does not authorize execution, merge, deployment, protected data access, or destructive cleanup.

## Validation

```powershell
node --test docs/brain/workorders/tools/wo-query.test.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
```
