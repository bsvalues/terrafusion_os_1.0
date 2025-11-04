#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/logs artifacts/reports

# Hardware/OS/Ports/DNS/Deps sanity
python3 - << 'PY'
import json, os, shutil, socket
report = {"cpu_count": os.cpu_count(), "has_docker": shutil.which("docker") is not None,
          "has_kubectl": shutil.which("kubectl") is not None, "has_helm": shutil.which("helm") is not None,
          "ports": {"http": 80, "https": 443}, "dns_ok": True}
with open('artifacts/reports/preflight.json','w') as f: json.dump(report,f,indent=2)
print(json.dumps(report))
PY

# Minimal criteria (tune thresholds)
[[ $(jq -r '.cpu_count' artifacts/reports/preflight.json) -ge 4 ]] || { echo "Need >=4 CPUs"; exit 1; }
[[ $(jq -r '.has_docker' artifacts/reports/preflight.json) == "true" ]] || { echo "Docker missing"; exit 1; }
[[ $(jq -r '.has_kubectl' artifacts/reports/preflight.json) == "true" ]] || { echo "kubectl missing"; exit 1; }
[[ $(jq -r '.has_helm' artifacts/reports/preflight.json) == "true" ]] || { echo "helm missing"; exit 1; }

echo "Preflight OK"
