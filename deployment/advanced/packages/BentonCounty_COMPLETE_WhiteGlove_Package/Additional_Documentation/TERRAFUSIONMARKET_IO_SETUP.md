# 🌐 TerraFusionMarket.io Complete Setup Guide

## Your Assets:

- **Domain**: `terrafusionmarket.io` (owned by you, registered at Hostinger)
- **GitHub Repo**: `github.com/bsvalues/terrafusion-market` (for hosting website
  files)

## How They Work Together:

```
[terrafusionmarket.io] → [DNS at Hostinger] → [GitHub Pages] → [Your Website]
```

---

## Step 1: Push Website to GitHub

```bash
cd /mnt/e/TerraFusion_Tauri_Master_Workspace/terrafusion-market-deploy
git push -u origin main
```

## Step 2: Enable GitHub Pages

1. Go to: https://github.com/bsvalues/terrafusion-market/settings/pages
2. Under "Source", select "Deploy from a branch"
3. Select "main" branch and "/ (root)" folder
4. Click "Save"
5. GitHub will give you a URL: `https://bsvalues.github.io/terrafusion-market`

## Step 3: Configure DNS at Hostinger

Log into your Hostinger account and add these DNS records:

### For apex domain (terrafusionmarket.io):

```
Type: A
Name: @
Value: 185.199.108.153
TTL: 14400

Type: A
Name: @
Value: 185.199.109.153
TTL: 14400

Type: A
Name: @
Value: 185.199.110.153
TTL: 14400

Type: A
Name: @
Value: 185.199.111.153
TTL: 14400
```

### For www subdomain (www.terrafusionmarket.io):

```
Type: CNAME
Name: www
Value: bsvalues.github.io
TTL: 14400
```

## Step 4: Verify Custom Domain in GitHub

1. Go back to: https://github.com/bsvalues/terrafusion-market/settings/pages
2. Under "Custom domain", enter: `terrafusionmarket.io`
3. Click "Save"
4. Check "Enforce HTTPS" (may take a few minutes to become available)

## Step 5: Wait for DNS Propagation

- DNS changes can take 10 minutes to 48 hours to propagate
- Usually works within 1-2 hours

## Final Result:

✅ **https://terrafusionmarket.io** - Your professional domain showing your
website ✅ **https://www.terrafusionmarket.io** - Also works with www ✅ **Free
hosting** via GitHub Pages ✅ **Free SSL certificate** from GitHub ✅ **Global
CDN** for fast loading

---

## Quick Status Check:

After setup, these should all work:

- [ ] https://bsvalues.github.io/terrafusion-market (GitHub Pages URL)
- [ ] https://terrafusionmarket.io (Your custom domain)
- [ ] https://www.terrafusionmarket.io (WWW version)

---

## Updating Your Website:

Whenever you want to update the website:

```bash
cd /mnt/e/TerraFusion_Tauri_Master_Workspace/terrafusion-market-deploy
# Edit your files
git add .
git commit -m "Update website"
git push
```

Changes will automatically appear on terrafusionmarket.io within minutes!

---

## Troubleshooting:

**"Page not found" error?**

- Make sure you pushed to GitHub first
- Check GitHub Pages is enabled
- Verify CNAME file exists in your repository

**Domain not working?**

- DNS can take up to 48 hours (usually much faster)
- Verify DNS records in Hostinger are correct
- Check custom domain setting in GitHub Pages

**SSL certificate error?**

- GitHub automatically provides SSL
- May take up to 24 hours after domain setup
- Make sure "Enforce HTTPS" is checked in GitHub Pages settings
