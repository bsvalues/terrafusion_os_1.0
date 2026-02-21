import test from "node:test";
import assert from "node:assert/strict";
import { runDoctor } from "../../../tools/canon/doctor.mjs";

function capture() {
  let out = "";
  let err = "";
  return {
    stdout: { write: (s) => void (out += s) },
    stderr: { write: (s) => void (err += s) },
    getOut: () => out,
    getErr: () => err,
  };
}

test("canon doctor --dry prints report and exits 0", async () => {
  const io = capture();

  const code = await runDoctor({
    argv: ["node", "doctor.mjs", "--dry"],
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 0);
  assert.match(io.getOut(), /Canon Health Report/i);
  assert.match(io.getOut(), /DRY/i);
  assert.match(io.getOut(), /repo clean/i);
  assert.match(io.getOut(), /type-check/i);
  assert.match(io.getOut(), /phase83/i);
});

test("canon doctor gate logic: fails when a required gate fails", async () => {
  const io = capture();
  const fakeExec = () => ({ ok: false, code: 2, stdout: "nope", stderr: "bad" });

  const gates = [
    {
      id: "type_check",
      label: "pnpm run type-check",
      required: true,
      run: async (ctx) => {
        const res = ctx.exec("pnpm", ["run", "type-check"]);
        return { ok: res.ok, detail: "fail", meta: { code: res.code } };
      },
    },
  ];

  const code = await runDoctor({
    argv: ["node", "doctor.mjs"],
    gates,
    execImpl: fakeExec,
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 1);
  assert.match(io.getOut(), /Overall:\s*FAIL/i);
  assert.match(io.getErr(), /Failed required gates/i);
});

test("canon doctor --json emits stable shape", async () => {
  const io = capture();

  const code = await runDoctor({
    argv: ["node", "doctor.mjs", "--dry", "--json"],
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 0);

  const parsed = JSON.parse(io.getOut());
  assert.equal(parsed.tool, "terracanon-doctor");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.overallOk, true);
  assert.ok(Array.isArray(parsed.results));
  assert.ok(parsed.results.length >= 3);
});
