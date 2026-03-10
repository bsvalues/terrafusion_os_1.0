# Hostinger Control Plane -- External Infra Truth Surface

## Purpose
Record the authoritative external infrastructure state required to close the ops/evidence lane for TerraFusion OS 1.0.

This document contains **no secrets**. Store secrets only in:
- Hostinger account vault / password manager
- VPS-local `/opt/terrafusion/<env>/app.env`
- GitHub Environment Secrets

## Canonical Baselines
- Protected main (release candidate): 864d651a8b49ec1b2dc2cbca137091dbc1c3b29b
- Engineering remediation baseline: 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c

## Domains (Authoritative)
- Staging: https://staging.terrafusionmarket.com
- Production: https://terrafusionmarket.com

## DNS Control Plane
- DNS provider for terrafusionmarket.com: (Hostinger / Cloudflare / other)
- Date/time verified: (UTC timestamp)
- Verification method: nslookup/dig from local machine + screenshot or panel note

### Required DNS Records
- A: staging -> <STAGING_VPS_IPV4>
- A: @ (root) -> <PROD_VPS_IPV4> (defer until production provisioning)

## Staging VPS (Hostinger)
- VPS name/id: (from Hostinger panel)
- IPv4: <STAGING_VPS_IPV4>
- OS: Ubuntu 22.04 LTS
- Provider firewall open: 22/tcp, 80/tcp, 443/tcp
- Server firewall (ufw) open: 22/tcp, 80/tcp, 443/tcp
- APP_ROOT: /opt/terrafusion/staging

## GHCR Pull Auth (Staging)
- Configured on VPS (deploy user): yes/no
- Method: `docker login ghcr.io` with least-privilege token
- Date/time verified: (UTC)

## GitHub Environments
### staging
Variables:
- DEPLOY_HOST = <STAGING_VPS_IPV4>
- DEPLOY_PORT = 22
- DEPLOY_USER = deploy
- PUBLIC_URL = https://staging.terrafusionmarket.com
- APP_ROOT = /opt/terrafusion/staging

Secrets:
- DEPLOY_SSH_KEY = (stored in GitHub only)

## Lane Closure Evidence Index
- Deploy seed 24531f37a... artifact: (link or artifact name)
- Deploy 864d651a8... artifact: (link or artifact name)
- Rollback artifact: (link or artifact name)
- Redeploy 864d651a8... artifact: (link or artifact name)

## Notes
- Hostinger MCP is optional discovery only; config is local-only and not committed.
- Production is not approved until staging deploy + rollback + observability proofs exist.
