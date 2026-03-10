#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-staging}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_BASE="${APP_BASE:-/opt/terrafusion}"
APP_ROOT="${APP_ROOT:-${APP_BASE}/${ENV_NAME}}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release ufw

install -d -m 0755 /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

CODENAME="$(. /etc/os-release && printf '%s' "$VERSION_CODENAME")"
ARCH="$(dpkg --print-architecture)"

cat > /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi

usermod -aG docker "$DEPLOY_USER"

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_ROOT"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_ROOT/data"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_ROOT/docs/spec-lock"
install -d -m 0700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/${DEPLOY_USER}/.ssh"

if [ ! -f "$APP_ROOT/app.env" ]; then
  install -m 0600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /dev/null "$APP_ROOT/app.env"
fi

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat <<EOF
Bootstrap complete.

Environment: ${ENV_NAME}
Deploy user: ${DEPLOY_USER}
App root: ${APP_ROOT}

Next steps:
1. Add your SSH public key to /home/${DEPLOY_USER}/.ssh/authorized_keys
2. Populate ${APP_ROOT}/app.env with runtime secrets
3. Run: sudo -u ${DEPLOY_USER} docker login ghcr.io
4. Point DNS at this host and wait for public resolution
5. Configure GitHub environment values:
   DEPLOY_HOST, DEPLOY_PORT, DEPLOY_USER, PUBLIC_URL, APP_ROOT
6. Configure GitHub environment secret:
   DEPLOY_SSH_KEY
EOF
