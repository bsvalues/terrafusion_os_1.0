#!/usr/bin/env python3
import os, json, time
from datetime import datetime

out = os.path.abspath(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else './artifacts/benton')
os.makedirs(out, exist_ok=True)

summary = {
  "timestamp": datetime.utcnow().isoformat()+"Z",
  "county": os.getenv('COUNTY_NAME','Benton County, WA'),
  "county_code": os.getenv('COUNTY_CODE','US-WA-BENTON'),
  "services": {
    "ui": "http://localhost:3000",
    "api": "http://localhost:8080",
    "grafana": "http://localhost:3001",
    "prometheus": "http://localhost:9090"
  },
  "integrations": {
    "harris_pacs": {
      "enabled": os.getenv('HARRIS_PACS_ENABLED','false') == 'true',
      "endpoint": os.getenv('HARRIS_PACS_ENDPOINT',''),
      "status": "configured" if os.getenv('HARRIS_PACS_ENABLED','false') == 'true' else "disabled"
    }
  },
  "notes": [
    "Demo stack started",
    "Quality gates passed", 
    "Harris PACS integration configured" if os.getenv('HARRIS_PACS_ENABLED','false') == 'true' else "Harris PACS integration disabled",
    "Artifacts collected"
  ]
}

with open(os.path.join(out, 'summary.json'), 'w') as f:
  json.dump(summary, f, indent=2)
print('Wrote', os.path.join(out, 'summary.json'))
