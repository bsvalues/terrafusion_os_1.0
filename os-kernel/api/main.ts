import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();
const router = new Router();

const MOCK_DB = [
    { id: "101", title: "Operation Ironclad", updated_at: new Date(), content: [] },
    { id: "102", title: "Assessment: Benton 2025", updated_at: new Date(), content: [] },
    { id: "103", title: "Tax Grid Analysis", updated_at: new Date(), content: [] }
];

router.get("/api/health", (ctx) => {
  console.log("[GET] /api/health - 200 OK");
  ctx.response.body = { status: "healthy", mode: "SIMULATION" };
});

router.get("/api/data/notebooks", (ctx) => {
  console.log("[GET] /api/data/notebooks - Sending Mock Data");
  ctx.response.body = MOCK_DB;
});

router.post("/api/data/notebooks", async (ctx) => {
  if (!ctx.request.hasBody) ctx.throw(400, "Bad Request");
  const body = await ctx.request.body().value;
  const newEntry = { id: crypto.randomUUID(), title: body.title, updated_at: new Date(), content: [] };
  MOCK_DB.unshift(newEntry);
  console.log(`[POST] Created: ${body.title}`);
  ctx.response.body = newEntry;
});

app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

console.log("════════════════════════════════════════════════");
console.log("   TERRAFUSION KERNEL (SIMULATION MODE)   ");
console.log("   Status: ONLINE");
console.log("   Port:   5000");
console.log("   Database: BYPASSED (Mock Data Active)");
console.log("════════════════════════════════════════════════");

await app.listen({ port: 5000 });
