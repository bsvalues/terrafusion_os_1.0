import express from "express";
import { exec as _exec } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { promisify } from "node:util"; const exec = promisify(_exec);

const app = express(); app.use(express.json({limit:"5mb"}));

// Use environment variable for port - NO HARDCODING!
const PORT = process.env.TF_AGENT_TOOLS_PORT || 7070;
const API_URL = `http://localhost:${process.env.TF_API_PORT || 5046}`;

const WHITELIST = new Set([
  "npm test","npm run build","npm run lint","npm run typecheck",
  "dotnet build -c Release","dotnet test -c Release",
  `dotnet run --project backend/TerraFusion.API/TerraFusion.API.csproj --urls=${API_URL}`,
  "playwright test","pw:test"
]);

const ok=(res,data)=>res.json({ok:true,data}); const bad=(res,msg)=>res.status(400).json({ok:false,error:msg});

app.post("/repo.list", async (req,res)=>{ try{
  const {stdout}=await exec("git ls-files"); const files=stdout.split("\n").filter(Boolean);
  const {globs}=req.body??{}; if(!globs?.length) return ok(res,files);
  ok(res, files.filter(f=>globs.some(g=>f.startsWith(g.replace("/**","")))));
}catch(e){bad(res,String(e))}});

app.post("/fs.read",(req,res)=>{ const {path}=req.body??{};
  if(!path||!existsSync(path)) return bad(res,"path not found");
  try{ ok(res,{path,content:readFileSync(path,"utf8")}) }catch(e){bad(res,String(e))}
});

app.post("/fs.patch",(req,res)=>{ const {path,unified_diff,allow_create}=req.body??{};
  if(!path||!unified_diff) return bad(res,"path and unified_diff required");
  if(!existsSync(path)&&!allow_create) return bad(res,"path missing and allow_create not set");
  const marker="\n@@ FINAL_FILE_SNAPSHOT @@\n"; if(!unified_diff.includes(marker)) return bad(res,"missing FINAL_FILE_SNAPSHOT marker");
  try{ const body=unified_diff.split(marker)[1]; writeFileSync(path,body,"utf8"); ok(res,{path,bytes:body.length}) }catch(e){bad(res,String(e))}
});

app.post("/exec.run", async (req,res)=>{ const {cmd,timeout_sec}=req.body??{};
  if(!cmd||!WHITELIST.has(cmd)) return bad(res,"non-whitelisted command");
  try{ const {stdout,stderr}=await exec(cmd,{timeout:(timeout_sec??900)*1000,maxBuffer:10_000_000});
       ok(res,{cmd,stdout:stdout.slice(-20000),stderr:stderr.slice(-20000)}) }catch(e){bad(res,String(e))}
});

app.post("/tests.collect", async (req,res)=>{ try{
  const {stdout}=await exec(`bash -lc 'ls -1 **/*.trx **/junit*.xml **/test-results/**/*.json 2>/dev/null || true'`);
  const files=stdout.split("\n").filter(Boolean);
  ok(res,{trx:files.filter(f=>f.endsWith(".trx")), junit:files.filter(f=>f.includes("junit")&&f.endsWith(".xml")),
          playwright:files.filter(f=>f.endsWith(".json")&&f.includes("test-results"))});
}catch(e){bad(res,String(e))}});

app.listen(PORT,()=>console.log(`Agent tools on http://127.0.0.1:${PORT}`));