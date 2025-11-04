import glob
import json
import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
report = {
    'found_tenant_yaml': [],
    'found_env_files': [],
    'found_ai_model_configs': [],
    'missing_counties_in_config': []
}

# 1) tenant.*.yaml in config/
tenant_yaml_pattern = os.path.join(root, 'config', 'tenant.*.yaml')
for path in glob.glob(tenant_yaml_pattern):
    report['found_tenant_yaml'].append(os.path.relpath(path, root))

# 2) .env.* files under config/counties/
env_pattern = os.path.join(root, 'config', 'counties', '.env.*')
for path in glob.glob(env_pattern):
    report['found_env_files'].append(os.path.relpath(path, root))

# 3) per-county ai model configs
ai_pattern = os.path.join(root, 'backend', 'ai-models', '**', 'config', '*county*config*.yaml')
for path in glob.glob(ai_pattern, recursive=True):
    report['found_ai_model_configs'].append(os.path.relpath(path, root))

# 4) counties list from federation (fallback: WASHINGTON_STATE_COUNTIES folder)
counties_dir = os.path.join(root, 'backend', 'ai-models', 'WASHINGTON_STATE_COUNTIES')
if os.path.isdir(counties_dir):
    counties = [d for d in os.listdir(counties_dir) if os.path.isdir(os.path.join(counties_dir, d))]
else:
    counties = []

# Check which counties have either env or tenant yaml or ai model config
for county in counties:
    county_key = county.replace('_county', '').replace('_', ' ').title()
    # look for county-specific files
    has_any = False
    # env
    for env in report['found_env_files']:
        if county.split('_')[0] in env.lower():
            has_any = True
    # tenant yaml
    for ty in report['found_tenant_yaml']:
        if county.split('_')[0] in ty.lower():
            has_any = True
    # ai model configs
    for ac in report['found_ai_model_configs']:
        if county.split('_')[0] in ac.lower():
            has_any = True
    if not has_any:
        report['missing_counties_in_config'].append(county)

# Print a simple report
print(json.dumps(report, indent=2))

# Exit code: 0 if no missing counties, 2 otherwise
if report['missing_counties_in_config']:
    print('\nMissing county config entries for:', report['missing_counties_in_config'])
    exit(2)
else:
    print('\nAll discovered counties have config artifacts.\n')
    exit(0)
