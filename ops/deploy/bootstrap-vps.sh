#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# TerraFusion OS — VPS Bootstrap Script (one-shot)
# Run as root on a fresh Ubuntu 22.04+ VPS.
#
# Usage:
#   ssh root@<VPS_IP> 'bash -s' < ops/deploy/bootstrap-vps.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

echo "╔══════════════════════════════════════════════╗"
echo "║  TerraFusion OS — VPS Bootstrap              ║"
echo "╚══════════════════════════════════════════════╝"

# ── 1. System packages ──────────────────────────────────────────
echo "» Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

echo "» Installing prerequisites..."
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban unattended-upgrades

# ── 2. Docker Engine ────────────────────────────────────────────
echo "» Installing Docker Engine..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable --now docker

# ── 3. Deploy user ──────────────────────────────────────────────
echo "» Creating deploy user..."
if ! id deploy &>/dev/null; then
  useradd -m -s /bin/bash -G docker deploy
fi

# SSH key directory for deploy user (GitHub Actions will use this)
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ACTION REQUIRED: Add your deploy SSH public key to:    ║"
echo "║  /home/deploy/.ssh/authorized_keys                      ║"
echo "║                                                         ║"
echo "║  Generate a key pair locally:                            ║"
echo "║    ssh-keygen -t ed25519 -f ~/.ssh/tf-deploy -N ''      ║"
echo "║                                                         ║"
echo "║  Then paste the PUBLIC key into authorized_keys:         ║"
echo "║    echo 'ssh-ed25519 AAAA...' >> \\                      ║"
echo "║      /home/deploy/.ssh/authorized_keys                  ║"
echo "║                                                         ║"
echo "║  The PRIVATE key goes into GitHub repo secret:           ║"
echo "║    STAGING_SSH_KEY                                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 4. Firewall ─────────────────────────────────────────────────
echo "» Configuring firewall (UFW)..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# ── 5. Application directory ────────────────────────────────────
echo "» Creating application directory..."
mkdir -p /opt/terrafusion
chown deploy:deploy /opt/terrafusion

# Create data directories
mkdir -p /opt/terrafusion/data/postgres
mkdir -p /opt/terrafusion/data/grafana
mkdir -p /opt/terrafusion/data/prometheus
mkdir -p /opt/terrafusion/logs
chown -R deploy:deploy /opt/terrafusion

# ── 6. Caddy (automatic HTTPS) ──────────────────────────────────
echo "» Installing Caddy..."
apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq
apt-get install -y -qq caddy

# Stop default caddy — we'll run it via Docker Compose instead
systemctl stop caddy
systemctl disable caddy

# ── 7. Hardening ────────────────────────────────────────────────
echo "» Applying basic hardening..."

# Disable root password login (key-only)
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd

# Enable automatic security updates
dpkg-reconfigure -plow unattended-upgrades 2>/dev/null || true

# ── 8. Docker login to GHCR ─────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  OPTIONAL: Log deploy user into GHCR for private images ║"
echo "║                                                         ║"
echo "║  su - deploy                                            ║"
echo "║  echo '<GITHUB_PAT>' | docker login ghcr.io \\           ║"
echo "║    -u bsvalues --password-stdin                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Done ─────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ VPS Bootstrap Complete                              ║"
echo "║                                                         ║"
echo "║  Next steps:                                            ║"
echo "║  1. Add deploy SSH public key (see above)               ║"
echo "║  2. Point DNS: staging.terrafusionmarket.com → this IP  ║"
echo "║  3. Copy compose + Caddyfile to /opt/terrafusion/       ║"
echo "║  4. Create .env from .env.staging.example               ║"
echo "║  5. docker compose up -d                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
