# Test Examples (v1)

These are illustrative test shapes (Vitest/Jest style) that you can drop into your repo.

## 1) RBAC vs Allowlist
```ts
import { canExecuteTool } from "./policy";

test("denies tool when claim missing even if allowlisted", () => {
  expect(canExecuteTool({
    userClaims: [],
    enabledTools: ["assign_task"],
    tool: { toolId:"assign_task", requiredClaims:["dais:tasks:write"] }
  })).toBe(false);
});

test("denies tool when not allowlisted even if claim present", () => {
  expect(canExecuteTool({
    userClaims: ["dais:tasks:write"],
    enabledTools: [],
    tool: { toolId:"assign_task", requiredClaims:["dais:tasks:write"] }
  })).toBe(false);
});
```

## 2) TerraTrace append-only
```ts
test("emits invoked + succeeded events", async () => {
  const events = await runToolAndCollectTrace("draft_notice");
  expect(events.some(e => e.type==="tool_invoked")).toBe(true);
  expect(events.some(e => e.type==="tool_succeeded")).toBe(true);
  // ensure no update calls
  expect(events.some(e => e.type==="tool_invoked" && e.hasOutputsInline)).toBe(false);
});
```

## 3) Risk policy
```ts
test("write_high requires confirmation+reason", () => {
  const policy = policyFor("write_high");
  expect(policy.requiresConfirmation).toBe(true);
  expect(policy.requiresReasonCode).toBe(true);
});
```

## 4) PII sanitization
```ts
test("trace payload contains no SSN or phone", () => {
  const payload = sanitizeForTrace("SSN 123-45-6789 Phone (509) 555-1212");
  expect(payload).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
  expect(payload).not.toMatch(/\(\d{3}\)\s*\d{3}-\d{4}/);
});
```
