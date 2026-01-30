import re, json, os, sys, pathlib, datetime, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'docs'
OUT_DIR.mkdir(exist_ok=True)
JSON_OUT = OUT_DIR / 'TODO_INTEL.json'
MD_OUT = OUT_DIR / 'STATUS.md'

TAG_SET = {
    'TODO','FIXME','NOTE','TEST','OPTIMIZE','DOC',
    'AI','SYNC','DATAFLOW','SECURITY','PERFORMANCE','UI/UX','COMPLIANCE',
    'ARCH','FACTOR12','TRUSTFABRIC','QUANTUM','TRANSCENDENCE','CONSCIOUSNESS'
}

PATTERN = re.compile(r"(?:^\s*(?:#|//|<!--|;|/\*|\*)\s*)(?:\[(?P<module>[^\]]+)\]\s*)?(?P<tag>" + '|'.join(map(re.escape, TAG_SET)) + r")\s*:\s*(?P<text>.+?)\s*$")

IGNORE_DIRS = {
    '.git', '.venv', 'venv', 'node_modules', 'dist', 'build', '__pycache__',
    '.next', 'out', 'bin', 'obj', '.ci_artifacts_local', 'artifacts',
    '.pnpm-store', '.ci_test_results', '.data', '_archive', '_CLEAN_BUILD_ZONE',
    'backups', 'cache', 'logs', 'temp', 'target', 'test-results', 'generated_tests',
    'ARCGIS'
}
IGNORE_PREFIXES = {
    '_pre_restore_safety_',
}
VALID_EXT = {'.py','.ts','.tsx','.js','.jsx','.md','.json','.yml','.yaml','.ini','.cfg','.cs','.go','.rs'}
MAX_FILE_SIZE = 2_000_000  # bytes

def walk_files(root: pathlib.Path):
    try:
        # Use tracked files when available; avoids scanning huge untracked dirs.
        pathspecs = [f'*{ext}' for ext in sorted(VALID_EXT)]
        result = subprocess.run(
            ['git', '-C', str(root), 'ls-files', '--', *pathspecs],
            check=True,
            capture_output=True,
            text=True
        )
        for line in result.stdout.splitlines():
            if not line:
                continue
            rel_path = pathlib.Path(line)
            if any(part in IGNORE_DIRS for part in rel_path.parts):
                continue
            if any(part.startswith(prefix) for part in rel_path.parts for prefix in IGNORE_PREFIXES):
                continue
            p = root / rel_path
            try:
                if p.stat().st_size > MAX_FILE_SIZE:
                    continue
            except (OSError, PermissionError):
                continue
            yield p
        return
    except Exception:
        # Fall back to filesystem walk if git isn't available.
        pass

    for dirpath, dirs, files in os.walk(root):
        # Prune heavy or irrelevant directories early
        dirs[:] = [
            d for d in dirs
            if d not in IGNORE_DIRS and not any(d.startswith(prefix) for prefix in IGNORE_PREFIXES)
        ]
        for name in files:
            try:
                p = pathlib.Path(dirpath) / name
                if p.suffix.lower() in VALID_EXT and p.stat().st_size <= MAX_FILE_SIZE:
                    yield p
            except (OSError, PermissionError):
                # Skip broken symlinks, permission denied, etc.
                continue

def rel(p: pathlib.Path):
    try:
        return str(p.relative_to(ROOT))
    except:
        return str(p)

def main():
    records = []
    for file in walk_files(ROOT):
        try:
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    m = PATTERN.search(line)
                    if m:
                        records.append({
                            'file': rel(file),
                            'line': i,
                            'module': (m.group('module') or '').strip(),
                            'tag': m.group('tag'),
                            'text': m.group('text').strip()
                        })
        except Exception:
            pass

    by_tag = {}
    by_module = {}
    for r in records:
        by_tag.setdefault(r['tag'], []).append(r)
        mod = r['module'] or '(unspecified)'
        by_module.setdefault(mod, []).append(r)

    payload = {
        'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'root': str(ROOT),
        'counts': {
            'total': len(records),
            'by_tag': {k: len(v) for k, v in sorted(by_tag.items(), key=lambda x: (-len(x[1]), x[0]))},
            'by_module': {k: len(v) for k, v in sorted(by_module.items(), key=lambda x: (-len(x[1]), x[0]))}
        },
        'items': records
    }

    JSON_OUT.write_text(json.dumps(payload, indent=2), encoding='utf-8')

    lines = []
    lines.append('# TerraFusion Code Intelligence Status\n')
    lines.append(f"_Generated: {payload['generated_at']}_\n")
    lines.append(f"**Total items:** {payload['counts']['total']}\n")
    lines.append('## Top Tags\n')
    for tag, count in list(payload['counts']['by_tag'].items())[:10]:
        lines.append(f"- **{tag}**: {count}")
    lines.append('\n## Top Modules\n')
    for mod, count in list(payload['counts']['by_module'].items())[:10]:
        lines.append(f"- **{mod}**: {count}")
    MD_OUT.write_text('\n'.join(lines), encoding='utf-8')

    print(f'Wrote {rel(JSON_OUT)} and {rel(MD_OUT)}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
