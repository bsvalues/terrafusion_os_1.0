import { readFile, writeFile } from "fs/promises";
import { createPrivateKey, sign as edSign } from "crypto";

const privPem = await readFile("keys/ed25519-private.pem", "utf8");
const keyObj = createPrivateKey(privPem);

const msg = Buffer.from("hello world", "utf8");
const sig = edSign(null, msg, keyObj); // 64 bytes
await writeFile("sig.bin", sig);

console.log("ok: wrote sig.bin (" + sig.length + " bytes)");
