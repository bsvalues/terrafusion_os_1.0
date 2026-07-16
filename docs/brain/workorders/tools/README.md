# Work Order Query and Report Tools

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

## Queue Report

`wo-report.mjs` renders the query result as deterministic Markdown on stdout. It adds provenance,
ranked-candidate, blocked-record, and completed-record sections without writing a report file or
mutating registry state.

The report deliberately distinguishes its registry projection from live routing. The canonical
current node remains `WORK_ORDER_PROGRAM_QUEUE.md`, interpreted under `CONTINUATION_RULEBOOK.md` and
the active authority record.

```powershell
node docs/brain/workorders/tools/wo-report.mjs
node docs/brain/workorders/tools/wo-report.mjs --authority R1
node docs/brain/workorders/tools/wo-report.mjs > .tmp/work-order-report.md
```

## Validation

```powershell
node --test docs/brain/workorders/tools/wo-query.test.mjs
node --test docs/brain/workorders/tools/wo-report.test.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
node docs/brain/workorders/tools/wo-report.mjs
```
