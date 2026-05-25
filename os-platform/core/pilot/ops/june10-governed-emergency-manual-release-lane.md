# June 10 Governed Emergency Manual Release Lane

Date: 2026-05-25
Status: prepared only; not authorized; not executed
Primary lane: `.github/workflows/release-lane.yml`
Emergency lane: manual exact-SHA release, only after explicit owner authorization

## Purpose

This runbook prepares a governed emergency release path for the narrow case where
GitHub Actions cannot run the authoritative release lane because of an external
platform-capacity blocker, such as Actions budget exhaustion.

It is not a convenience path. It is not a way to bypass failed tests, failed
security findings, failed review, or unresolved product blockers. Option A
remains the required path: restore GitHub Actions capacity, run CI, merge through
the governed PR lane, and deploy through `release-lane.yml`.

## Hard Boundary

Do not execute this procedure unless all are true:

- GitHub Actions is externally unavailable or budget-blocked.
- The release fixes an approved June 10 ship blocker.
- The target PRs are reviewed and ready except for the Actions capacity outage.
- The exact release SHA is known and recorded.
- The owner explicitly authorizes the emergency manual lane in writing.
- The operator can capture the full release receipt in this runbook's format.

Do not use this lane if:

- CI produced a real test, build, lint, or security finding.
- The target SHA is dirty, local-only, or unreviewed.
- The release requires undocumented data mutation.
- The operator cannot prove rollback readiness before deployment.
- The release is cosmetic, speculative, or not June 10 critical.

## Current June 10 Use Case

Known production defects are fixed in separated PRs but not deployed while the
Actions budget blocks release execution:

| PR | Scope | Production symptom until deployed |
|---|---|---|
| #871 | Pilot frontend contract/auth header fixes | `/api/pilot/invoke` and `/api/pilot/explain` runtime errors |
| #872 | DAIS queue schema repair | `/api/dais/queue/all` returns server error |

These PRs still belong on the normal governed lane first.

## Authorization Record

Before any manual release starts, create an authorization entry:

```text
manualReleaseAuthorized=false
authorizedBy=
authorizedAtUtc=
reason=GitHub Actions budget outage prevents governed release-lane execution
targetEnvironment=production
releaseSha=
includedPrs=
currentProductionSha=
rollbackSha=
operator=
```

The owner authorization phrase must be explicit, for example:

```text
I authorize the governed emergency manual production release for SHA <full-sha>
because GitHub Actions remains budget-blocked.
```

## Exact SHA Deployment Path

The manual lane must mirror `release-lane.yml`, not invent a second production
shape.

### 1. Local Release Preflight

```bash
set -euo pipefail

git fetch origin main --tags
git fetch origin pull/871/head:pr-871
git fetch origin pull/872/head:pr-872

# Replace with the reviewed merge or release candidate SHA.
RELEASE_SHA="<full-release-sha>"

git rev-parse "$RELEASE_SHA^{commit}"
git status --short
```

Required result:

- release SHA resolves to a commit;
- local worktree is clean;
- release candidate contains only reviewed PR content intended for release;
- no uncommitted files are part of the deployment.

### 2. Required Local Gates

Run the local gates that do not depend on GitHub-hosted runners:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

If any local gate fails, stop. Do not deploy manually.

### 3. Build Exact-SHA Images

Use the same image names and Dockerfiles as `release-lane.yml`.

```bash
OWNER="bsvalues"
BACKEND_IMAGE="ghcr.io/${OWNER}/terrafusion-os-backend-internal:${RELEASE_SHA}"
FRONTEND_IMAGE="ghcr.io/${OWNER}/terrafusion-os-frontend-internal:${RELEASE_SHA}"

git checkout "$RELEASE_SHA"

# Overlay deploy infrastructure from origin/main exactly as release-lane does.
for path in \
  ops/proxy/Caddyfile \
  ops/prod/runtime-compose.template.yml \
  ops/edge-proxy/Caddyfile \
  ops/edge-proxy/docker-compose.yml \
  frontend/Dockerfile \
  backend/Dockerfile
do
  mkdir -p "$(dirname "$path")"
  git show "origin/main:$path" > "$path"
done

docker build --pull --target runtime -f backend/Dockerfile -t "$BACKEND_IMAGE" backend
docker push "$BACKEND_IMAGE"

docker builder prune -af
docker image prune -af

docker build --pull --target production -f frontend/Dockerfile -t "$FRONTEND_IMAGE" .
docker push "$FRONTEND_IMAGE"
```

## Artifact Verification

Record image digests before touching production:

```bash
docker buildx imagetools inspect "$BACKEND_IMAGE" > "backend-image-${RELEASE_SHA}.txt"
docker buildx imagetools inspect "$FRONTEND_IMAGE" > "frontend-image-${RELEASE_SHA}.txt"
```

On the VPS, verify the same tags pull:

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "docker pull '$BACKEND_IMAGE' && docker pull '$FRONTEND_IMAGE'"
```

Required result:

- both images are tagged with the full release SHA;
- image digests are captured;
- VPS can pull both images before compose is changed.

## Runtime Bundle Preparation

Create a runtime bundle equivalent to the Actions workflow:

```bash
TARGET_ENV="production"
PUBLIC_URL="https://terrafusionmarket.com"
PUBLIC_HOST="terrafusionmarket.com"
APP_ROOT="/opt/terrafusion/production"
DEPLOYED_AT="$(date -u +%FT%TZ)"

rm -rf runtime edge-proxy emergency-evidence
mkdir -p runtime/docs/spec-lock runtime/config edge-proxy emergency-evidence

cp ops/proxy/Caddyfile runtime/Caddyfile
cp ops/prod/runtime-compose.template.yml runtime/runtime-compose.yml
cp -R docs/spec-lock/. runtime/docs/spec-lock/
cp sovereign.yaml runtime/sovereign.yaml
cp ops/edge-proxy/Caddyfile edge-proxy/Caddyfile
cp ops/edge-proxy/docker-compose.yml edge-proxy/docker-compose.yml

cat > runtime/release.env <<EOF
COMPOSE_PROJECT_NAME=terrafusion-${TARGET_ENV}
TF_RELEASE_SHA=${RELEASE_SHA}
TF_RELEASE_ENV=${TARGET_ENV}
TF_RELEASE_DEPLOYED_AT=${DEPLOYED_AT}
TF_PUBLIC_URL=${PUBLIC_URL}
TF_PUBLIC_HOST=${PUBLIC_HOST}
TF_BACKEND_IMAGE=${BACKEND_IMAGE}
TF_FRONTEND_IMAGE=${FRONTEND_IMAGE}
EOF
```

Do not write secrets into tracked files. Production secrets remain in
VPS-local `app.env` or approved secret stores.

## Production Preflight

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "APP_ROOT='$APP_ROOT' bash -s" <<'SSH'
set -euo pipefail
command -v docker >/dev/null
docker compose version >/dev/null
test -d "$APP_ROOT"
test -w "$APP_ROOT"
test -f "$APP_ROOT/app.env"
test -f "$APP_ROOT/runtime-compose.yml"
test -f "$APP_ROOT/release.env"
test -f "$APP_ROOT/current.sha"
test -f "$APP_ROOT/previous.sha"
cd "$APP_ROOT"
printf 'current_sha=%s\n' "$(cat current.sha)"
printf 'previous_sha=%s\n' "$(cat previous.sha)"
docker compose -f runtime-compose.yml --env-file release.env ps
SSH
```

Required result:

- Docker and Compose are available;
- production app root is writable;
- `current.sha` and `previous.sha` exist;
- rollback SHA is known before deploy.

## Database Backup Requirement

If the release includes schema repair or any code path that may migrate SQLite
state, capture a pre-release TerraFusion DB backup. Do not continue if backup
creation fails.

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "APP_ROOT='$APP_ROOT' RELEASE_SHA='$RELEASE_SHA' bash -s" <<'SSH'
set -euo pipefail
cd "$APP_ROOT"
install -d data/backups
python3 - <<'PY'
import os
import sqlite3
from datetime import datetime, timezone

root = os.environ["APP_ROOT"]
sha = os.environ["RELEASE_SHA"]
source = os.path.join(root, "data", "terrafusion.db")
stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
target = os.path.join(root, "data", "backups", f"terrafusion-pre-{sha}-{stamp}.db")

src = sqlite3.connect(source)
dst = sqlite3.connect(target)
with dst:
    src.backup(dst)
dst.close()
src.close()
print(target)
PY
SSH
```

## Manual Deploy Procedure

Only execute after authorization and all preflights pass.

```bash
scp -P "$DEPLOY_PORT" -r runtime/* "$DEPLOY_USER@$DEPLOY_HOST:$APP_ROOT/"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "docker network inspect terrafusion-edge >/dev/null 2>&1 || docker network create terrafusion-edge"

ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p /opt/terrafusion/edge-proxy"
scp -P "$DEPLOY_PORT" edge-proxy/* "$DEPLOY_USER@$DEPLOY_HOST:/opt/terrafusion/edge-proxy/"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "cd /opt/terrafusion/edge-proxy && docker compose up -d && docker compose exec -T edge caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>/dev/null || true"

ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "APP_ROOT='$APP_ROOT' RELEASE_SHA='$RELEASE_SHA' bash -s" <<'SSH'
set -euo pipefail
cd "$APP_ROOT"
install -d data docs/spec-lock
printf '%s\n' "$RELEASE_SHA" > requested.sha
if [ -f current.sha ]; then
  cp current.sha previous.sha
fi
docker compose -f runtime-compose.yml --env-file release.env config >/dev/null
docker compose -f runtime-compose.yml --env-file release.env pull
docker compose -f runtime-compose.yml --env-file release.env up -d
SSH
```

## Smoke Sequence

All smoke checks are live production checks. Stop on first failure.

### 1. Health and Release Header

```bash
curl -fsS -D emergency-evidence/curl_headers.txt "$PUBLIC_URL/health" -o /dev/null
grep -i '^x-release-sha:' emergency-evidence/curl_headers.txt
```

Required result:

- HTTP 200;
- `X-Release-Sha` equals `RELEASE_SHA`.

### 2. Public Shell Routes

```bash
for path in / /property /login; do
  curl -fsS -o /dev/null -w "${path} %{http_code}\n" "$PUBLIC_URL$path"
done
```

Required result:

- each route returns 2xx or intended 3xx;
- login does not route authenticated users to `/canon` by default.

### 3. Provisioned Auth

Use the approved production operator secret source. Do not paste credentials into
tracked files.

```bash
LOGIN_RESPONSE="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${TF_AUTH_BOOTSTRAP_EMAIL}\",\"password\":\"${TF_AUTH_BOOTSTRAP_PASSWORD}\"}" \
  "$PUBLIC_URL/api/auth/login")"

TOKEN="$(printf '%s' "$LOGIN_RESPONSE" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);process.stdout.write(j.token||j.Token||'')})")"
test -n "$TOKEN"
curl -fsS -H "Authorization: Bearer $TOKEN" "$PUBLIC_URL/api/auth/profile" > emergency-evidence/profile.json
```

Required result:

- login returns token;
- profile returns user id, email, roles, permissions, county/FIPS, state, and session validity.

### 4. Fixed Endpoint Smokes

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"June 10 production smoke","context":{"source":"emergency-release-smoke"}}' \
  "$PUBLIC_URL/api/pilot/invoke" > emergency-evidence/pilot-invoke.json

curl -fsS -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Explain June 10 production smoke","context":{"source":"emergency-release-smoke"}}' \
  "$PUBLIC_URL/api/pilot/explain" > emergency-evidence/pilot-explain.json

curl -fsS -H "Authorization: Bearer $TOKEN" \
  "$PUBLIC_URL/api/dais/queue/all" > emergency-evidence/dais-queue-all.json
```

Required result:

- `/api/pilot/invoke` does not return method mismatch;
- `/api/pilot/explain` accepts the JWT auth header;
- `/api/dais/queue/all` does not return 500;
- response payloads are archived as evidence.

### 5. Container and Log Evidence

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "cd '$APP_ROOT' && docker compose -f runtime-compose.yml --env-file release.env ps" \
  > emergency-evidence/compose_ps.txt

ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "cd '$APP_ROOT' && docker compose -f runtime-compose.yml --env-file release.env logs --no-color --tail=200 backend" \
  > emergency-evidence/logs_backend.txt

ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "cd '$APP_ROOT' && docker compose -f runtime-compose.yml --env-file release.env logs --no-color --tail=200 proxy" \
  > emergency-evidence/logs_proxy.txt
```

## Finalize SHA Only After Smokes Pass

Do not mark the release current until every required smoke above passes.

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "APP_ROOT='$APP_ROOT' RELEASE_SHA='$RELEASE_SHA' bash -s" <<'SSH'
set -euo pipefail
cd "$APP_ROOT"
test "$(cat requested.sha)" = "$RELEASE_SHA"
printf '%s\n' "$RELEASE_SHA" > current.sha
SSH
```

Then prove the invariant:

```bash
HEADER_SHA="$(awk 'BEGIN{IGNORECASE=1} /^x-release-sha:/ {print $2}' emergency-evidence/curl_headers.txt | tr -d '\r')"
test "$HEADER_SHA" = "$RELEASE_SHA"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "test \"\$(cat '$APP_ROOT/current.sha')\" = '$RELEASE_SHA'"
```

## Rollback Plan

Preferred rollback remains `.github/workflows/rollback-production.yml` once
GitHub Actions capacity is restored.

If the emergency lane must roll back before Actions is available:

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "APP_ROOT='$APP_ROOT' bash -s" <<'SSH'
set -euo pipefail
cd "$APP_ROOT"
ROLLBACK_SHA="$(cat previous.sha)"
PUBLIC_URL="${TF_PUBLIC_URL:-https://terrafusionmarket.com}"
PUBLIC_HOST="terrafusionmarket.com"
OWNER="bsvalues"
BACKEND_IMAGE="ghcr.io/${OWNER}/terrafusion-os-backend-internal:${ROLLBACK_SHA}"
FRONTEND_IMAGE="ghcr.io/${OWNER}/terrafusion-os-frontend-internal:${ROLLBACK_SHA}"

cat > release.env <<EOF
COMPOSE_PROJECT_NAME=terrafusion-production
TF_RELEASE_SHA=${ROLLBACK_SHA}
TF_RELEASE_ENV=production
TF_RELEASE_DEPLOYED_AT=$(date -u +%FT%TZ)
TF_PUBLIC_URL=${PUBLIC_URL}
TF_PUBLIC_HOST=${PUBLIC_HOST}
TF_BACKEND_IMAGE=${BACKEND_IMAGE}
TF_FRONTEND_IMAGE=${FRONTEND_IMAGE}
EOF

printf '%s\n' "$ROLLBACK_SHA" > requested.sha
docker compose -f runtime-compose.yml --env-file release.env config >/dev/null
docker compose -f runtime-compose.yml --env-file release.env pull
docker compose -f runtime-compose.yml --env-file release.env up -d
printf '%s\n' "$ROLLBACK_SHA" > current.sha
SSH
```

If a DB backup must be restored, stop the backend first and restore only the
backup captured for this exact release window. Record the restore path and reason
in the release receipt.

## Release Receipt Format

Every emergency manual release must create an untracked evidence directory and a
receipt with this shape:

```json
{
  "operation": "emergency_manual_release",
  "authorized": false,
  "authorizedBy": "",
  "authorizedAtUtc": "",
  "targetEnv": "production",
  "reason": "GitHub Actions budget outage",
  "releaseSha": "",
  "includedPrs": [],
  "previousProductionSha": "",
  "rollbackSha": "",
  "backendImage": "",
  "backendDigest": "",
  "frontendImage": "",
  "frontendDigest": "",
  "databaseBackupPath": "",
  "publicUrl": "https://terrafusionmarket.com",
  "healthStatus": null,
  "healthReleaseSha": "",
  "smokes": {
    "shellRoutes": false,
    "authLogin": false,
    "authProfile": false,
    "pilotInvoke": false,
    "pilotExplain": false,
    "daisQueueAll": false
  },
  "rollbackReady": false,
  "executedBy": "",
  "executedAtUtc": ""
}
```

For an executed release, `authorized` must be `true`; the template keeps it
`false` to make a prepared-but-not-executed receipt impossible to mistake for an
approved production event.

## Stop Conditions

Stop immediately and do not finalize `current.sha` if:

- `/health` does not return the exact release SHA;
- auth login or profile fails;
- `/api/pilot/invoke` still reports the old contract mismatch;
- `/api/pilot/explain` still rejects a valid JWT;
- `/api/dais/queue/all` still returns 500;
- backend logs show migration failure, startup crash, or unhandled auth errors;
- rollback SHA or rollback image pull cannot be proven.

## Reconciliation Requirement

After any emergency manual release, restore GitHub Actions capacity and run the
normal release or verification lane against the same SHA as soon as possible.
The manual receipt must be linked from the PR or release note. If the normal lane
later fails for the same SHA, production must be treated as in degraded release
state until remediated or rolled back.
