import { createServer } from 'http'
import { parse as parseUrl } from 'url'
import { existsSync, readFileSync, readdirSync, statSync, createReadStream } from 'fs'
import { join, extname, basename } from 'path'
import { spawn, spawnSync } from 'child_process'

const repoRoot = process.cwd()
const uiDir = join(repoRoot, 'tools', 'testing-dashboard', 'ui')
const port = process.env.TF_TEST_UI_PORT ? Number(process.env.TF_TEST_UI_PORT) : 4137

function hasCommand(cmd) {
  try {
    if (process.platform === 'win32') {
      const which = spawnSync('where', [cmd], { stdio: 'ignore' })
      return which.status === 0
    }
    const which = spawnSync('which', [cmd], { stdio: 'ignore' })
    return which.status === 0
  } catch {
    return false
  }
}

function listDiscoveryDirs() {
  const entries = readdirSync(repoRoot, { withFileTypes: true })
  const dirs = entries
    .filter(e => e.isDirectory() && e.name.startsWith('test-discovery-'))
    .map(e => ({ name: e.name, path: join(repoRoot, e.name), mtime: statSync(join(repoRoot, e.name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  return dirs
}

function latestDiscoveryDir() {
  const dirs = listDiscoveryDirs()
  return dirs.length > 0 ? dirs[0] : null
}

function readSummary(dirPath) {
  const summaryPath = join(dirPath, 'COMPLETE_TEST_SUMMARY.md')
  if (!existsSync(summaryPath)) return null
  const md = readFileSync(summaryPath, 'utf8')
  const totalMatch = md.match(/\*\*TOTAL\*\* \| \*\*(\d+) tests\*\*/i)
  const total = totalMatch ? Number(totalMatch[1]) : null
  const categories = []
  const lines = md.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const catMatch = line.match(/^\|\s*([A-Z_]+)\s*\|\s*(\d+) tests/i)
    if (catMatch) {
      const name = catMatch[1]
      const count = Number(catMatch[2])
      categories.push({ name, count })
    }
  }
  return { summaryPath, total, categories, raw: md }
}

function aiSummarize(summary) {
  if (!summary) return { insights: [], risks: [], recommendations: [] }
  const total = summary.total || 0
  const cats = summary.categories || []
  const zeroCats = cats.filter(c => c.count === 0).map(c => c.name)
  const topCats = [...cats].sort((a, b) => b.count - a.count).slice(0, 3)
  const insights = [
    `Total discovered test artifacts: ${total}`,
    `Top categories: ${topCats.map(c => `${c.name} (${c.count})`).join(', ')}`
  ]
  const risks = []
  if (zeroCats.length > 0) risks.push(`No tests detected in: ${zeroCats.join(', ')}`)
  const recommendations = []
  if (total < 300) recommendations.push('Run discovery again or expand search to modules and deployment directories')
  if (!zeroCats.length) recommendations.push('Proceed to execute all tests and compare pass/fail rates')
  return { insights, risks, recommendations }
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  }
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function runDiscoverySse(res) {
  const useBash = hasCommand('bash')
  let child
  if (useBash) {
    child = spawn('bash', ['-lc', './scripts/discover-all-tests.sh'], { cwd: repoRoot })
  } else if (process.platform === 'win32') {
    child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/ai-orientation.ps1', '-RunDiscovery'], { cwd: repoRoot })
  } else {
    writeSse(res, 'error', { message: 'No bash available and not on Windows with PowerShell.' })
    res.end()
    return
  }
  child.stdout.on('data', chunk => writeSse(res, 'log', { message: chunk.toString() }))
  child.stderr.on('data', chunk => writeSse(res, 'log', { message: chunk.toString() }))
  child.on('close', code => {
    const latest = latestDiscoveryDir()
    const summary = latest ? readSummary(latest.path) : null
    writeSse(res, 'done', { code, latest: latest ? latest.name : null, total: summary?.total || null })
    res.end()
  })
}

function runExecuteAllSse(res) {
  const latest = latestDiscoveryDir()
  if (!latest) {
    writeSse(res, 'error', { message: 'No discovery directory found. Run discovery first.' })
    return res.end()
  }
  const scriptPath = join(latest.path, 'execute-all-tests.sh')
  if (!existsSync(scriptPath)) {
    writeSse(res, 'error', { message: 'execute-all-tests.sh not found in latest discovery directory.' })
    return res.end()
  }
  if (!hasCommand('bash')) {
    writeSse(res, 'error', { message: 'Bash not available to run execute-all-tests.sh. Install Git Bash or WSL.' })
    return res.end()
  }
  const child = spawn('bash', ['-lc', scriptPath], { cwd: repoRoot })
  child.stdout.on('data', chunk => writeSse(res, 'log', { message: chunk.toString() }))
  child.stderr.on('data', chunk => writeSse(res, 'log', { message: chunk.toString() }))
  child.on('close', code => {
    writeSse(res, 'done', { code })
    res.end()
  })
}

function serveStatic(req, res, pathname) {
  const filePath = pathname === '/' ? join(uiDir, 'index.html') : join(uiDir, pathname.replace(/^\//, ''))
  if (!filePath.startsWith(uiDir) || !existsSync(filePath)) {
    res.statusCode = 404
    return res.end('Not found')
  }
  const ext = extname(filePath).toLowerCase()
  const map = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
  res.setHeader('Content-Type', map[ext] || 'application/octet-stream')
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  const { pathname, query } = parseUrl(req.url, true)
  if (pathname === '/api/status' && req.method === 'GET') {
    const latest = latestDiscoveryDir()
    const summary = latest ? readSummary(latest.path) : null
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ latest: latest ? latest.name : null, summary }))
  }
  if (pathname === '/api/discovery/dirs' && req.method === 'GET') {
    const dirs = listDiscoveryDirs().map(d => ({ name: d.name, mtime: d.mtime }))
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ dirs }))
  }
  if (pathname === '/api/summary' && req.method === 'GET') {
    const latest = latestDiscoveryDir()
    const summary = latest ? readSummary(latest.path) : null
    const ai = aiSummarize(summary)
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ latest: latest ? latest.name : null, ai, summary }))
  }
  if (pathname === '/api/discover/stream' && (req.method === 'POST' || req.method === 'GET')) {
    const headers = sseHeaders()
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
    return runDiscoverySse(res)
  }
  if (pathname === '/api/execute/stream' && (req.method === 'POST' || req.method === 'GET')) {
    const headers = sseHeaders()
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
    return runExecuteAllSse(res)
  }
  if (pathname === '/api/modules/run' && req.method === 'GET') {
    const script = join(repoRoot, 'AI Modules', 'ALL_MODULES_TEST.js')
    if (!existsSync(script)) {
      res.statusCode = 404
      return res.end('ALL_MODULES_TEST.js not found')
    }
    if (!hasCommand('node')) {
      res.statusCode = 500
      return res.end('Node not available')
    }
    const child = spawn(process.execPath, [script], { cwd: repoRoot })
    res.setHeader('Content-Type', 'text/plain')
    child.stdout.pipe(res, { end: false })
    child.stderr.pipe(res, { end: false })
    child.on('close', code => {
      res.end(`\n\n(exit ${code})`)
    })
    return
  }
  if (pathname === '/AI_NAVIGATION.md' && req.method === 'GET') {
    const filePath = join(repoRoot, 'AI_NAVIGATION.md')
    if (!existsSync(filePath)) { res.statusCode = 404; return res.end('Not found') }
    res.setHeader('Content-Type', 'text/markdown')
    return createReadStream(filePath).pipe(res)
  }
  if (pathname === '/TEST_REGISTRY.md' && req.method === 'GET') {
    const filePath = join(repoRoot, 'TEST_REGISTRY.md')
    if (!existsSync(filePath)) { res.statusCode = 404; return res.end('Not found') }
    res.setHeader('Content-Type', 'text/markdown')
    return createReadStream(filePath).pipe(res)
  }
  if (pathname?.startsWith('/')) {
    return serveStatic(req, res, pathname)
  }
  res.statusCode = 404
  res.end('Not found')
})

server.listen(port, () => {
  console.log(`TerraFusion Test UI running at http://localhost:${port}`)
  console.log('Endpoints: /, /api/status, /api/summary, POST /api/discover/stream, POST /api/execute/stream')
})


