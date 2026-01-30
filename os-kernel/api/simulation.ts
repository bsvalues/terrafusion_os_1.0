import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();
const router = new Router();

const DATA = [
  { id: "101", title: "Operation Ironclad", updated_at: new Date() },
  { id: "102", title: "Project: Zero Point", updated_at: new Date() },
  { id: "103", title: "Classified: Sector 7", updated_at: new Date() }
];

router.get("/api/health", (ctx) => {
  ctx.response.body = { status: "healthy", mode: "BYPASS_ACTIVE" };
  console.log("Health Check: OK");
});

router.get("/api/data/notebooks", (ctx) => {
  ctx.response.body = DATA;
  console.log("Sending Notebook List");
});

router.post("/api/data/notebooks", async (ctx) => {
  if (!ctx.request.hasBody) ctx.throw(400, "Bad Request");
  const body = await ctx.request.body().value;
  const newItem = { id: crypto.randomUUID(), title: body.title, updated_at: new Date() };
  DATA.unshift(newItem);
  ctx.response.body = newItem;
  console.log(`Created: ${body.title}`);
});

app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

console.log("ROCKET: SIMULATION KERNEL ONLINE (Port 5000)");
await app.listen({ port: 5000 });
