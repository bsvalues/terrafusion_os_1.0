/** Map file extension to Monaco language id without importing Monaco. */
export function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    sql: 'sql',
    py: 'python',
    cs: 'csharp',
    csproj: 'xml',
    sln: 'plaintext',
    dockerfile: 'dockerfile',
    toml: 'ini',
    env: 'ini',
    lock: 'plaintext',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}
