import { assertUniqueBy } from "../../../frontend/apps/os-shell/src/utils/assertUniqueBy";

describe("ShellHeader actions uniqueness", () => {
  it("throws when duplicate keys exist", () => {
    const actions = [
      { id: "new-file", intent: "standalone" },
      { id: "new-file", intent: "standalone" },
    ];
    expect(() =>
      assertUniqueBy(actions, (a) => a.id, "ShellHeader actions"),
    ).toThrow(/Duplicate keys detected/);
  });

  it("does not throw when ids are unique", () => {
    const actions = [
      { id: "new-file", intent: "standalone" },
      { id: "open-recent", intent: "standalone" },
    ];
    expect(() =>
      assertUniqueBy(actions, (a) => a.id, "ShellHeader actions"),
    ).not.toThrow();
  });

  it("reports correct duplicate count in error message", () => {
    const actions = [
      { id: "save", intent: "standalone" },
      { id: "save", intent: "standalone" },
      { id: "save", intent: "standalone" },
    ];
    expect(() =>
      assertUniqueBy(actions, (a) => a.id, "ShellHeader actions"),
    ).toThrow(/save \(x3\)/);
  });
});
