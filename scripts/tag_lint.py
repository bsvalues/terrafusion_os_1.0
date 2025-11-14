import re, sys, pathlib, json

ROOT = pathlib.Path(__file__).resolve().parents[1]

RULES = {
    # 1) Enforce [MODULE] prefix for Tier-2/3 tags
    'require_module_for_tags': ['AI','SYNC','DATAFLOW','SECURITY','PERFORMANCE','UI/UX','COMPLIANCE','ARCH','FACTOR12','TRUSTFABRIC','QUANTUM','TRANSCENDENCE','CONSCIOUSNESS'],
    # 2) Domain-specific: COMPLIANCE in TERRA-LEVY must reference RCW or DOR
    'levy_compliance_ref': { 'module': 'TERRA-LEVY', 'tag': 'COMPLIANCE', 'must_include': ['RCW','DOR'] }
}

TAG_SET = set(RULES['require_module_for_tags'] + ['TODO','FIXME','NOTE','TEST','OPTIMIZE','DOC'])
PATTERN = re.compile(r"(?:^\s*(?:#|//|<!--|;|/\*|\*)\s*)(?:\[(?P<module>[^\]]+)\]\s*)?(?P<tag>" + '|'.join(map(re.escape, TAG_SET)) + r")\s*:\s*(?P<text>.+?)\s*$")
VALID_EXT = {'.py','.ts','.tsx','.js','.jsx','.md','.json','.yml','.yaml','.ini','.cfg','.cs','.go','.rs'}
IGNORE_DIRS = {'.git','.venv','venv','node_modules','dist','build','__pycache__'}

violations = []

for p in ROOT.rglob('*'):
    if p.is_dir():
        if p.name in IGNORE_DIRS:
            continue
        continue
    if p.suffix.lower() not in VALID_EXT:
        continue
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                m = PATTERN.search(line)
                if not m:
                    continue
                module = (m.group('module') or '').strip()
                tag = m.group('tag')
                text = (m.group('text') or '').strip()

                # Rule 1: require module for Tier-2/3
                if tag in RULES['require_module_for_tags'] and not module:
                    violations.append({
                        'file': str(p),
                        'line': i,
                        'issue': 'Missing [MODULE] prefix',
                        'tag': tag,
                        'text': text
                    })

                # Rule 2: Levy compliance references
                lev = RULES['levy_compliance_ref']
                if module == lev['module'] and tag == lev['tag']:
                    if not any(k in text for k in lev['must_include']):
                        violations.append({
                            'file': str(p),
                            'line': i,
                            'issue': 'COMPLIANCE requires RCW or DOR reference',
                            'tag': tag,
                            'text': text
                        })
    except Exception:
        pass

if violations:
    print(json.dumps({ 'violations': violations }, indent=2))
    sys.exit(1)
else:
    print('Tag lint passed')
    sys.exit(0)
