## Helm v4 + Windows: Chart.yaml not found from deep repo paths

**Symptom:** `helm lint backend/helm/<chart>/` reports "Chart.yaml file is missing"
even when the file exists and is valid ASCII YAML.

**Root cause:** Helm v4's Go runtime resolves paths via `GetFileAttributesEx`
which conflicts with Git Bash UNIX-style path translation at deep directory depths.
Charts are structurally valid — `helm template` renders correctly from temp paths.

**Workaround (local dev):**
```bash
cp -rL backend/helm/terrafusion-api C:/tmp/tf-api && helm lint C:/tmp/tf-api && rm -rf C:/tmp/tf-api
```

**CI:** Not affected — CI runs on Ubuntu (linux/amd64) where paths resolve correctly.
Charts are validated in `kubernetes-infrastructure-ci.yml`.
