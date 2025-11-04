// app/api/portal/[...path]/route.ts – simple proxy to Axum backend
import type { NextRequest } from 'next/server';
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8787';
export async function GET(req: NextRequest, { params }: any) {
  const path = (params.path||[]).join('/');
  const r = await fetch(`${BACKEND}/api/${path}`);
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type')||'application/json' }});
}
export async function POST(req: NextRequest, { params }: any) {
  const path = (params.path||[]).join('/');
  const r = await fetch(`${BACKEND}/api/${path}`, { method:'POST', body: await req.text(), headers:{'content-type':'application/json'} });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type')||'application/json' }});
}
