# 🔧 FIX 403 FORBIDDEN ERROR ON HOSTINGER

## Quick Fix Steps:

### 1. File Permissions (MOST COMMON ISSUE)
In Hostinger File Manager or FTP:
```
Files: Set to 644
Folders: Set to 755
```

**How to fix in hPanel:**
1. Go to File Manager
2. Select all files → Right-click → Permissions
3. Set to **644** for files
4. Select all folders → Set to **755**

### 2. Upload These Fixed Files:
```
.htaccess (updated version)
index.php (fallback file)
index.html (your main app)
marketplace-launcher.html
```

### 3. Check public_html Structure:
```
public_html/
├── .htaccess              ← MUST BE HERE
├── index.html             ← MUST BE HERE
├── index.php              ← FALLBACK
├── marketplace-launcher.html
└── modules/
```

### 4. Clear Everything First:
```bash
# In File Manager:
1. Delete all files in public_html
2. Delete .htaccess (if exists)
3. Upload fresh files
```

### 5. Hostinger-Specific Settings:
In hPanel → PHP Configuration:
- PHP Version: 7.4 or higher
- Display Errors: Off

### 6. Alternative .htaccess (If Still 403):
```apache
# Minimal version - use if main one fails
DirectoryIndex index.html index.php
Options +FollowSymLinks -Indexes

<Files .htaccess>
    Order allow,deny
    Deny from all
</Files>
```

### 7. Check Domain Settings:
- Domain must point to `public_html`
- Not to a subdirectory

### 8. If STILL Getting 403:

**Option A - Use index.php as main:**
Rename `index.html` to `main.html`
Create `index.php`:
```php
<?php
include('main.html');
?>
```

**Option B - Contact Hostinger:**
Use live chat and say: "Getting 403 error on HTML files in public_html"

### 9. Test URL Directly:
Try accessing:
- `yourdomain.com/index.html` (with extension)
- If this works, it's an .htaccess issue

### 10. Nuclear Option:
1. Delete `.htaccess` completely
2. Just upload HTML files
3. Access with full filename: `yourdomain.com/index.html`

## Common Hostinger Issues:
- ✅ ModSecurity blocking files → Disable in hPanel
- ✅ Cloudflare caching old 403 → Clear Cloudflare cache  
- ✅ Wrong PHP version → Use 7.4+
- ✅ IP blocking → Check Security → IP Manager

## Files Needed:
1. `.htaccess` (fixed version)
2. `index.php` (fallback)
3. `index.html` (main app)
4. `marketplace-launcher.html`

Upload ALL of these to fix the 403 error!