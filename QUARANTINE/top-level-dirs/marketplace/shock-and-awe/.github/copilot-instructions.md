# Shock-and-Awe – Hostinger Web Deployment Guide for AI Agents

## Purpose
- This project deploys as a static web package to Hostinger for terrafusionmarket.io. Do NOT generate desktop/Tauri flows for deployment.
- Core is a static landing/demo site (index.html) plus JS under `js/`, styles in `styles/`, and assets in `assets/`.

## Architecture
- Front-of-site: `index.html` with multiple vanilla JS modules under `js/` (e.g., `costforge-wizard.js`, `quantum-viz.js`).
- Static routing: `.htaccess` enforces HTTPS, cache headers, and SPA-style fallback to `index.html`.
- Optional code (not used for Hostinger runtime): React/Three components in `src/`. Tauri desktop code has been removed from this repo and must not be reintroduced.
- Future backend: `src/services/TerraFusionAPIClient.ts` targets a REST API when available; no Node server runs on Hostinger.

## Build & Deploy (Windows PowerShell)
- Install deps: `npm install`
- Build Hostinger package: `npm run build:production` (creates `dist/` by copying required static files)
- Package for drag-and-drop: `npm run package:deployment` (creates `terrafusion-deployment.tar.gz` from `dist/`)
- Deploy via FTP:
	- Windows PowerShell: `pwsh -File ./deploy-hostinger.ps1` (prompts for credentials)
	- WSL/Git Bash: `./deploy-ftp.sh` or `./deploy-hostinger.sh` (expects `dist/`)

## What the static build includes (dist/)
- Root files: `index.html`, `404.html`, `500.html`, `robots.txt`, `sitemap.xml`, `manifest.json`, `sw.js`, `.htaccess`, `clean-modules.js`.
- Folders: `assets/`, `js/`, `styles/`.
- If you add new top-level static files, update `scripts/build-static.cjs` or place them under those folders.

## Conventions
- Static-first: Prefer plain JS modules under `js/` for features surfaced on terrafusionmarket.io.
- Paths: Use root-relative or simple relative paths (e.g., `js/...`) referenced in `index.html`.
- SPA routing: Direct URL hits route via `.htaccess` to `index.html`. Create anchors/hash routes (`/#demo`) instead of separate HTML pages.
- Do not introduce Node/Express servers for Hostinger; use client-side fetch to external APIs only.

## Integration Points
- HTTP client: `src/services/TerraFusionAPIClient.ts` resolves API base from `window.__TERRAFUSION_API__` or `VITE_API_BASE`. For Hostinger, prefer absolute HTTPS API URLs.
- Desktop-only code: Tauri and related hooks have been removed. Do not use Tauri IPC (`invoke(...)`) in web-only code paths.

## Common Gotchas
- Build mismatch: Vite’s `vite build` is not used for Hostinger. Use `npm run build:production` which copies static assets exactly as referenced by `index.html`.
- Missing files: If `robots.txt`, `sw.js`, or `.htaccess` are absent on the live site, ensure they exist in repo root and are copied by the static build.
- PHP/Server code: Not required; avoid generating backend code for Hostinger unless explicitly requested.

## Examples
- Add a new JS module for the landing page: place `js/my-feature.js`, then include `<script src="js/my-feature.js"></script>` in `index.html` and rerun `npm run build:production`.
- Update SEO: edit `sitemap.xml`, `robots.txt`, and `<meta>` tags in `index.html`; rebuild and deploy.

## Commands quick ref
- `npm run build:production` → produce Hostinger-ready `dist/`
- `npm run package:deployment` → create `terrafusion-deployment.tar.gz`
- `npm run validate:deployment` → run production readiness checks
- `npm run deploy:hostinger:ps` → deploy to Hostinger via FTP (Windows)
- Deploy (manual): upload/extract the tarball to `public_html` in Hostinger File Manager

Notes for agents: Prioritize static web changes and Hostinger deployment flow. Do not propose Tauri packaging or containerization for this project’s production site.
