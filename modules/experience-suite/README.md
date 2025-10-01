# Experience Suite v5 — cert-manager, Helmfile ALL, County Themes, MSW

**What’s new:**
- cert-manager **ClusterIssuers** (staging/prod) and **Certificate** for `app.terrafusion.gov`
- **Helmfile** deploys: cert-manager, Kong, kube-prometheus-stack, Grafana, TerraFusion umbrella
- County theming tokens → produces `tokens-benton.css` / `tokens-yakima.css` + runtime loader
- **MSW harness** for offline UI development

## Quickstart
```bash
# 1) Install & run (assumes kube context set to EKS)
chmod +x enable-v5.sh
./enable-v5.sh

# 2) Build county tokens
npx style-dictionary build --config tools/style-dictionary/v5.config.json

# 3) Enable MSW locally
npm i -D msw
npx msw init public --save
# start dev using ui/src/main.dev.tsx
```
Confirm TLS:
```bash
kubectl describe certificate tf-app-cert -n default
kubectl describe ingress tf-app
```
