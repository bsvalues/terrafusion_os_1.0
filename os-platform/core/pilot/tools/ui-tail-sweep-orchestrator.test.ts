import { describe, expect, it } from "vitest";
import {
  locateLineAndSnippet,
  scanTextForRawColors,
  scanFiles,
  toLeakGuardTestName,
  renderLeakGuardTest,
} from "./ui-tail-sweep-orchestrator";

describe("ui-tail-sweep-orchestrator", () => {
  it("counts raw-color hits and finds first index", () => {
    const txt = "ok rgba(0,0,0,0.2) and #fff and hsl(200 20% / 1)";
    const { count, firstIndex } = scanTextForRawColors(txt);
    expect(count).toBe(3);
    expect(firstIndex).toBeGreaterThanOrEqual(0);
  });

  it("locates line + snippet deterministically", () => {
    const txt = "a\nb\nc rgba(0,0,0,0.2) d\n";
    const { count, firstIndex } = scanTextForRawColors(txt);
    expect(count).toBe(1);
    const loc = locateLineAndSnippet(txt, firstIndex);
    expect(loc.line).toBe(3);
    expect(loc.snippet).toMatch(/rgba\(/);
  });

  it("scans multiple files with injected reader (no fs)", () => {
    const files = ["x.tsx", "y.tsx"];
    const fakeRead = (p: string) =>
      p === "x.tsx" ? "rgba(1,2,3,0.4)" : "clean";
    const res = scanFiles(files, fakeRead as any);
    expect(res.totalFiles).toBe(2);
    expect(res.totalHits).toBe(1);
    expect(res.hits.find((h) => h.file === "x.tsx")?.count).toBe(1);
  });

  it("generates stable test name", () => {
    const name = toLeakGuardTestName(
      "frontend/apps/os-shell/src/components/x/Foo.tsx",
    );
    expect(name).toContain(
      "frontend-apps-os-shell-src-components-x-foo-tsx-leak-guard.test.ts",
    );
  });

  it("renders leak guard test with canonical resolver", () => {
    const rendered = renderLeakGuardTest(
      "frontend/apps/os-shell/src/components/x/Foo.tsx",
    );
    expect(rendered).toMatch(
      /path\.resolve\(__dirname,\s*"\.\."\s*,\s*"\.\."\s*,\s*"\.\."/,
    );
    expect(rendered).toMatch(/assertNoRawColorLeaks/);
  });

  it("returns zero hits for clean files", () => {
    const txt = "color: var(--tf-text-primary); background: transparent;";
    const { count } = scanTextForRawColors(txt);
    expect(count).toBe(0);
  });

  it("sorts results: count desc, file asc", () => {
    const files = ["a.tsx", "b.tsx", "c.tsx"];
    const fakeRead = (p: string) => {
      if (p === "a.tsx") return "rgba(1,2,3,0.4) #fff";
      if (p === "b.tsx") return "clean";
      return "rgba(0,0,0,0.5)";
    };
    const res = scanFiles(files, fakeRead as any);
    expect(res.hits[0].file).toBe("a.tsx"); // 2 hits
    expect(res.hits[1].file).toBe("c.tsx"); // 1 hit
    expect(res.hits[2].file).toBe("b.tsx"); // 0 hits
  });
});
