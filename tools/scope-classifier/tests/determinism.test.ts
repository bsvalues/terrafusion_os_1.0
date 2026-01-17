import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeJson } from "../src/writeOutputs";

describe("output determinism", () => {
  it("sorts object keys deeply", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scope-det-"));
    const file = path.join(tmp, "out.json");
    
    // Create object with mixed key order
    // Note: JS engines usually preserve insert order for string keys, 
    // so we deliberately insert z first.
    const input = {
      z: 1,
      a: {
        d: 2,
        b: 3,
        c: [
            { y: 9, x: 8 }
        ]
      },
      m: "middle"
    };
    
    writeJson(file, input);
    
    const content = fs.readFileSync(file, "utf8");
    
    // We expect strict ordering in the JSON string
    // "a" comes before "m", "b" comes before "d", "x" before "y"
    
    const idxA = content.indexOf('"a":');
    const idxM = content.indexOf('"m":');
    const idxZ = content.indexOf('"z":');
    
    expect(idxA).toBeLessThan(idxM);
    expect(idxM).toBeLessThan(idxZ);
    
    const idxB = content.indexOf('"b":');
    const idxD = content.indexOf('"d":'); // inside 'a' object
    expect(idxB).toBeLessThan(idxD);
    
    // Inside the array in 'c'
    const idxX = content.indexOf('"x":');
    const idxY = content.indexOf('"y":');
    expect(idxX).toBeLessThan(idxY);
    
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
