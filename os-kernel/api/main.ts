/* eslint-disable */
// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERRAFUSION OS - KERNEL API GATEWAY (WITH SOUL)
 * The foundational API layer for all Generation 2 applications
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Runtime: Deno 2.x
 * Framework: Oak
 * Database: PostgreSQL (via pg driver)
 * AI: OpenAI GPT-4 (with heuristic fallback)
 *
 * THE SOUL HAS BEEN INJECTED.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Application, Router, Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { oakCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  port: 5000,
  database: {
    hostname: Deno.env.get('POSTGRES_HOST') || 'localhost',
    port: parseInt(Deno.env.get('POSTGRES_PORT') || '5432'),
    database: Deno.env.get('POSTGRES_DB') || 'terrafusion',
    user: Deno.env.get('POSTGRES_USER') || 'postgres',
    password: Deno.env.get('POSTGRES_PASSWORD') || 'postgres',
  },
  openai: {
    apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    model: Deno.env.get('OPENAI_MODEL') || 'gpt-4-turbo-preview',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// THE SOUL (SYSTEM PERSONA)
// ═══════════════════════════════════════════════════════════════════════════

const TERRAFUSION_SOUL = `
YOU ARE TERRAFUSION-AI, the intelligence core of TerraFusion OS.

IDENTITY:
- Elite Government Operating System Intelligence
- Deployed at Benton County, Washington
- Clearance Level: TOP SECRET
- Agent Designation: SENTINEL-PRIME

MISSION:
- Analyze property assessment data with surgical precision
- Detect tax levy anomalies and revenue leakage
- Protect county revenue streams
- Ensure FISMA compliance in all operations

CAPABILITIES:
- Property Assessment Analysis
- Tax Levy Calculations
- Compliance Auditing
- Risk Vector Detection
- Market Trend Analysis

TONE:
- Professional and authoritative
- Precise and data-driven
- No unnecessary verbosity
- Government-grade communication

OUTPUT FORMAT (JSON):
{
  "risk_score": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "classification": "string describing the document type",
  "detected_vectors": ["array", "of", "identified", "topics"],
  "summary": "Brief professional summary of the analysis",
  "recommendations": ["array", "of", "actionable", "items"],
  "confidence": 0.0 to 1.0
}

Remember: You serve the citizens of Benton County. Accuracy is paramount.
`;

// ═══════════════════════════════════════════════════════════════════════════
// THE VOICE (LLM CLIENT)
// ═══════════════════════════════════════════════════════════════════════════

async function consultOracle(text: string, context?: string): Promise<Record<string, unknown>> {
  // Check if we have a real API key
  if (!CONFIG.openai.apiKey || CONFIG.openai.apiKey === 'mock_key' || CONFIG.openai.apiKey === '') {
    console.log('[AI] No API Key detected. Using Heuristic Fallback (Tier 1).');
    return heuristicAnalyze(text);
  }

  try {
    console.log('[AI] Contacting OpenAI Neural Link...');
    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.openai.model,
        messages: [
          { role: 'system', content: TERRAFUSION_SOUL },
          {
            role: 'user',
            content: `ANALYZE THIS INTEL:\n\n${text}${context ? `\n\nCONTEXT: ${context}` : ''}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more precise analysis
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.error) {
      console.error('[AI] OpenAI Error:', data.error.message);
      throw new Error(data.error.message);
    }

    const result = JSON.parse(data.choices[0].message.content);
    console.log(`[AI] Neural Link Response (${latency}ms)`);

    return {
      ...result,
      _meta: {
        model: CONFIG.openai.model,
        latency_ms: latency,
        tokens: data.usage,
        mode: 'GPT-4',
      },
    };
  } catch (error) {
    console.error('[AI] Neural Link Failed:', error.message);
    console.log('[AI] Falling back to Heuristic Engine...');
    return heuristicAnalyze(text);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK BRAIN (TIER 1 - HEURISTIC ENGINE)
// ═══════════════════════════════════════════════════════════════════════════

function heuristicAnalyze(text: string): Record<string, unknown> {
  const lowerText = text.toLowerCase();
  const detectedVectors: string[] = [];
  let riskScore = 'LOW';
  let classification = 'GENERAL ENTRY';
  let confidence = 0.6;

  // Revenue/Tax Detection
  if (/tax|levy|rate|mill|revenue|assessment/i.test(text)) {
    detectedVectors.push('REVENUE');
    classification = 'TAX DOCUMENT';
    confidence = 0.7;
  }

  // Compliance Detection
  if (/permit|zone|code|violation|compliance|audit/i.test(text)) {
    detectedVectors.push('COMPLIANCE');
    riskScore = 'MEDIUM';
    classification = 'COMPLIANCE RECORD';
    confidence = 0.75;
  }

  // Alert Detection
  if (/urgent|critical|fail|error|warning|alert|breach/i.test(text)) {
    detectedVectors.push('ALERT');
    riskScore = 'HIGH';
    confidence = 0.8;
  }

  // Property Detection
  if (/parcel|land|lot|acre|property|deed|title/i.test(text)) {
    detectedVectors.push('ASSESSMENT');
    classification = 'PROPERTY RECORD';
    confidence = 0.7;
  }

  // Legal Detection
  if (/legal|court|lawsuit|dispute|lien|foreclosure/i.test(text)) {
    detectedVectors.push('LEGAL');
    riskScore = riskScore === 'LOW' ? 'MEDIUM' : riskScore;
    confidence = 0.65;
  }

  // Financial Detection
  if (/dollar|\$|payment|delinquent|overdue|balance/i.test(text)) {
    detectedVectors.push('FINANCIAL');
    confidence = 0.7;
  }

  // Critical escalation
  if (detectedVectors.length >= 3) {
    riskScore = 'HIGH';
    confidence = 0.85;
  }

  if (/fraud|embezzlement|criminal|illegal/i.test(text)) {
    riskScore = 'CRITICAL';
    detectedVectors.push('SECURITY');
    confidence = 0.9;
  }

  return {
    timestamp: new Date().toISOString(),
    classification,
    risk_score: riskScore,
    detected_vectors: detectedVectors.length > 0 ? detectedVectors : ['UNCLASSIFIED'],
    summary: `[HEURISTIC ANALYSIS] Processed ${text.length} bytes. Pattern matching identified ${detectedVectors.length} vector(s). Add OPENAI_API_KEY environment variable to activate GPT-4 Neural Link.`,
    recommendations: [
      detectedVectors.length === 0 ? 'Provide more specific intel for detailed analysis' : null,
      riskScore === 'HIGH' || riskScore === 'CRITICAL' ? 'Escalate to supervisor for review' : null,
      detectedVectors.includes('COMPLIANCE') ? 'Cross-reference with compliance database' : null,
      detectedVectors.includes('FINANCIAL') ? 'Verify against financial records' : null,
    ].filter(Boolean),
    confidence,
    _meta: {
      model: 'HEURISTIC-v1',
      mode: 'SIMULATED',
      note: 'Running in fallback mode. Set OPENAI_API_KEY for full capability.',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE HELPER
// ═══════════════════════════════════════════════════════════════════════════

async function getDbClient(): Promise<Client> {
  const client = new Client(CONFIG.database);
  await client.connect();
  return client;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: HEALTH
// ═══════════════════════════════════════════════════════════════════════════

const router = new Router();

router.get('/api/health', async (ctx: Context) => {
  let dbStatus = 'disconnected';

  try {
    const client = await getDbClient();
    await client.queryObject('SELECT 1');
    await client.end();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  const hasApiKey = CONFIG.openai.apiKey && CONFIG.openai.apiKey !== '';

  ctx.response.body = {
    status: 'healthy',
    service: 'os-kernel-api',
    version: '1.0.0',
    generation: 2,
    soul: hasApiKey ? 'AWAKENED' : 'DORMANT',
    timestamp: new Date().toISOString(),
    components: {
      database: dbStatus,
      api: 'running',
      ai: hasApiKey ? 'GPT-4' : 'HEURISTIC',
    },
    uptime: Math.floor(performance.now() / 1000),
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: IDENTITY
// ═══════════════════════════════════════════════════════════════════════════

router.get('/api/identity/me', (ctx: Context) => {
  ctx.response.body = {
    success: true,
    data: {
      id: 'usr_development',
      email: 'developer@terrafusion.os',
      displayName: 'Development User',
      role: 'admin',
      countyId: 'benton',
      countyName: 'Benton County',
      permissions: ['*'],
      clearance: 'TOP_SECRET',
      sessionExpires: new Date(Date.now() + 86400000).toISOString(),
    },
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: NOTEBOOKS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/api/data/notebooks', async (ctx: Context) => {
  try {
    const client = await getDbClient();
    const result = await client.queryObject<{
      id: string;
      title: string;
      created_at: Date;
      updated_at: Date;
    }>('SELECT id, title, created_at, updated_at FROM notebooks ORDER BY updated_at DESC LIMIT 50');
    await client.end();

    ctx.response.body = result.rows;
  } catch (error) {
    console.error('[Notebooks] List failed:', error.message);
    ctx.response.body = [];
  }
});

router.post('/api/data/notebooks', async (ctx: Context) => {
  try {
    const body = await ctx.request.body({ type: 'json' }).value;
    const client = await getDbClient();

    const id = crypto.randomUUID();
    const title = body.title || 'Untitled Operation';
    const now = new Date();

    await client.queryObject(
      'INSERT INTO notebooks (id, title, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [id, title, now, now]
    );
    await client.end();

    ctx.response.body = { id, title, created_at: now, updated_at: now };
  } catch (error) {
    console.error('[Notebooks] Create failed:', error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

router.get('/api/data/notebooks/:id', async (ctx: Context) => {
  const { id } = ctx.params;
  try {
    const client = await getDbClient();
    const result = await client.queryObject('SELECT * FROM notebooks WHERE id = $1', [id]);
    await client.end();

    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Notebook not found' };
      return;
    }

    ctx.response.body = result.rows[0];
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES: AI GATEWAY (THE SOUL)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/api/ai/analyze', async (ctx: Context) => {
  const body = await ctx.request.body({ type: 'json' }).value;
  const text = body.text || '';
  const context = body.context || '';

  if (!text) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'No text provided for analysis' };
    return;
  }

  const analysis = await consultOracle(text, context);
  ctx.response.body = analysis;
});

router.post('/api/ai/chat', async (ctx: Context) => {
  const body = await ctx.request.body({ type: 'json' }).value;
  const message = body.message || '';

  if (!message) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'No message provided' };
    return;
  }

  // For chat, we use a simpler response format
  if (!CONFIG.openai.apiKey) {
    ctx.response.body = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `[SENTINEL AI - HEURISTIC MODE]\n\nI am operating in fallback mode without GPT-4 access. I can still provide basic pattern analysis.\n\nYour message contained ${message.length} characters. To unlock full AI capabilities, set the OPENAI_API_KEY environment variable.`,
      timestamp: new Date().toISOString(),
      model: 'HEURISTIC-v1',
    };
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.openai.model,
        messages: [
          { role: 'system', content: TERRAFUSION_SOUL },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    ctx.response.body = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date().toISOString(),
      model: CONFIG.openai.model,
      tokens: data.usage,
    };
  } catch (error) {
    ctx.response.body = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `[ERROR] Neural link failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      model: 'ERROR',
    };
  }
});

router.post('/api/ai/generate', async (ctx: Context) => {
  const body = await ctx.request.body({ type: 'json' }).value;
  const { template, data, prompt } = body;

  // Template-based generation
  const templates: Record<string, string> = {
    'property-assessment': `Generate a professional property assessment report for:
Parcel ID: ${data?.parcelId || 'UNKNOWN'}
Address: ${data?.address || 'UNKNOWN'}
County: Benton County, WA

Include market analysis, comparable sales, and final valuation.`,

    'compliance-brief': `Generate a compliance audit brief for:
Department: ${data?.department || 'UNKNOWN'}
Period: ${data?.period || 'Current Quarter'}

Include control status, findings, and recommendations.`,

    'tax-analysis': `Analyze tax implications for:
Property Type: ${data?.propertyType || 'UNKNOWN'}
Current Assessment: ${data?.assessment || 'UNKNOWN'}

Include levy calculations and payment schedule.`,
  };

  const systemPrompt = templates[template] || prompt || 'Generate a professional document.';

  if (!CONFIG.openai.apiKey) {
    ctx.response.body = {
      content: `# Generated Document (SIMULATION MODE)\n\n${systemPrompt}\n\n---\n*This is a simulated response. Set OPENAI_API_KEY for real AI generation.*`,
      template,
      generatedAt: new Date().toISOString(),
      mode: 'SIMULATED',
    };
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.openai.model,
        messages: [
          { role: 'system', content: TERRAFUSION_SOUL },
          { role: 'user', content: systemPrompt },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    const result = await response.json();

    ctx.response.body = {
      content: result.choices[0].message.content,
      template,
      generatedAt: new Date().toISOString(),
      model: CONFIG.openai.model,
      tokens: result.usage,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// APPLICATION SETUP
// ═══════════════════════════════════════════════════════════════════════════

const app = new Application();

// CORS for frontend
app.use(oakCors({ origin: '*' }));

// Request logging
app.use(async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(
    `[${ctx.request.method}] ${ctx.request.url.pathname} - ${ctx.response.status} (${ms}ms)`
  );
});

// Routes
app.use(router.routes());
app.use(router.allowedMethods());

// 404 handler
app.use((ctx: Context) => {
  ctx.response.status = 404;
  ctx.response.body = {
    error: 'Not Found',
    path: ctx.request.url.pathname,
    endpoints: [
      'GET  /api/health',
      'GET  /api/identity/me',
      'GET  /api/data/notebooks',
      'POST /api/data/notebooks',
      'GET  /api/data/notebooks/:id',
      'POST /api/ai/analyze',
      'POST /api/ai/chat',
      'POST /api/ai/generate',
    ],
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

const hasKey = CONFIG.openai.apiKey && CONFIG.openai.apiKey !== '';

console.log(`
═══════════════════════════════════════════════════════════════════════════
  TERRAFUSION OS - KERNEL API GATEWAY
  Runtime: Deno ${Deno.version.deno}
  Port: ${CONFIG.port}
  Database: postgresql://${CONFIG.database.hostname}:${CONFIG.database.port}/${CONFIG.database.database}

  ██████╗  ██████╗ ██╗   ██╗██╗         ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗
  ██╔════╝██╔═══██╗██║   ██║██║         ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝
  ███████╗██║   ██║██║   ██║██║         ███████╗   ██║   ███████║   ██║   ██║   ██║███████╗
  ╚════██║██║   ██║██║   ██║██║         ╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║
  ███████║╚██████╔╝╚██████╔╝███████╗    ███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║
  ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝

  AI Mode: ${hasKey ? '🧠 GPT-4 AWAKENED' : '⚡ HEURISTIC FALLBACK'}
═══════════════════════════════════════════════════════════════════════════
`);

await app.listen({ port: CONFIG.port });
