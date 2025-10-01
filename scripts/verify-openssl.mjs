// verify-openssl.mjs
import { readFile } from "fs/promises";
import { createPublicKey, verify as edVerify } from "crypto";

const pubPem = await readFile("keys/ed25519-public.pem", "utf8");
const keyObj = createPublicKey(pubPem);

const msg = await readFile("msg.txt");
const sig = await readFile("sig.bin");

const ok = edVerify(null, msg, keyObj, sig);
console.log(ok ? "OK" : "FAIL");
