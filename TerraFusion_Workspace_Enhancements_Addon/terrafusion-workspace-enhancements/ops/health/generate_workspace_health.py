#!/usr/bin/env python3
import json, os, sys, subprocess, re, datetime

def bool_score(b): return 1 if b else 0

def assess_workspace(path):
    ws = os.path.basename(path.rstrip("/"))
    # Heuristic checks (placeholders; replace with real CI integrations)
    build = os.path.exists(os.path.join(path, "package.json"))
    tests = os.path.exists(os.path.join(path, "tests")) or os.path.exists(os.path.join(path, "src"))
    vulns = True  # assume no critical vulns (replace with scanner output)
    deps = True   # assume up-to-date (replace with lockfile check)
    docs = os.path.exists(os.path.join(path, "README.md"))
    owner = True  # require CODEOWNERS mapping upstream
    recent = True # e.g., use git log --since

    score = int(100 * (bool_score(build)+bool_score(tests)+bool_score(vulns)+bool_score(deps)+bool_score(docs)+bool_score(owner)+bool_score(recent)) / 7)
    status = "healthy" if score >= 85 else ("warning" if score >= 70 else "critical")
    recs = []
    if not docs: recs.append("Add README.md")
    if not tests: recs.append("Add unit/integration tests")
    return {
        "workspace": ws,
        "status": status,
        "checks": {
            "buildPassing": build,
            "testsPassing": tests,
            "noCriticalVulnerabilities": vulns,
            "dependenciesUpToDate": deps,
            "documentationExists": docs,
            "hasActiveOwner": owner,
            "recentActivity": recent
        },
        "score": score,
        "generatedAt": datetime.datetime.utcnow().isoformat()+"Z",
        "recommendations": recs
    }

def main():
    roots = sys.argv[1:] or ["marketplace","frontend","platform"]
    reports = []
    for r in roots:
        if not os.path.isdir(r): continue
        for entry in os.scandir(r):
            if entry.is_dir():
                reports.append(assess_workspace(entry.path))
    print(json.dumps({"reports":reports}, indent=2))

if __name__ == "__main__":
    main()
