import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs' / 'CODE_INTEL_BASELINE.json'
CURR = ROOT / 'docs' / 'TODO_INTEL.json'

if not BASE.exists():
    print('No baseline found; create docs/CODE_INTEL_BASELINE.json from current run to enable drift checks.')
    sys.exit(0)

if not CURR.exists():
    print('No current TODO_INTEL.json; run scan_todos.py first.')
    sys.exit(1)

base = json.loads(BASE.read_text(encoding='utf-8'))
curr = json.loads(CURR.read_text(encoding='utf-8'))

violations = []

# Example guard: do not allow increase in SECURITY or FIXME counts
for tag in ['SECURITY','FIXME']:
    b = base['counts']['by_tag'].get(tag, 0)
    c = curr['counts']['by_tag'].get(tag, 0)
    if c > b:
        violations.append({
            'tag': tag,
            'baseline': b,
            'current': c,
            'issue': 'Count increased'
        })

if violations:
    print(json.dumps({ 'drift': violations }, indent=2))
    sys.exit(1)

print('Baseline comparison passed')
sys.exit(0)
