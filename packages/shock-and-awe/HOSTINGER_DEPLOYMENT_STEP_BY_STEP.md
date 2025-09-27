# 🚀 Complete Hostinger Deployment Guide for Beginners

## Deploying TerraFusion Shock & Awe to terrafusionmarket.io

### Prerequisites Checklist

- [ ] Hostinger hosting account (shared, premium, or business plan)
- [ ] Domain terrafusionmarket.io configured in Hostinger
- [ ] Access to Hostinger control panel (hPanel)
- [ ] The deployment package: `terrafusion-shock-awe-hostinger.zip`

---

## Step 1: Access Your Hostinger Control Panel

1. **Login to Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Enter your email and password
   - Click "Sign In"

2. **Navigate to Your Website**:
   - You'll see a dashboard with your hosting plans
   - Find the plan that has `terrafusionmarket.io`
   - Click "Manage" next to that plan

---

## Step 2: Access File Manager

1. **Find File Manager**:
   - In the hosting control panel, look for "File Manager"
   - It's usually in the "Files" section
   - Click "File Manager"

2. **Navigate to Your Domain**:
   - You'll see a folder structure
   - Look for `public_html` folder and double-click it
   - If you have multiple domains, look for `terrafusionmarket.io` folder
   - This is where your website files go

---

## Step 3: Upload the Deployment Package

1. **Upload the ZIP file**:
   - In File Manager, click the "Upload" button (usually at the top)
   - Click "Select Files" or drag and drop
   - Choose `terrafusion-shock-awe-hostinger.zip` from your computer
   - Wait for upload to complete (may take 1-2 minutes)

2. **Extract the ZIP file**:
   - Right-click on `terrafusion-shock-awe-hostinger.zip`
   - Select "Extract" or "Unzip"
   - Choose "Extract to current directory"
   - Wait for extraction to complete
   - You can now delete the ZIP file (right-click → Delete)

---

## Step 4: Create MySQL Database

1. **Go to Database Section**:
   - In your Hostinger control panel, find "MySQL Databases"
   - It's usually in the "Databases" section
   - Click "MySQL Databases"

2. **Create New Database**:
   - Click "Create Database"
   - Database Name: `terrafusion_shock_awe`
   - Click "Create"
   - **Write down these details**:
     ```
     Database Name: [your_username]_terrafusion_shock_awe
     Username: [your_username]
     Password: [your_database_password]
     Host: localhost
     ```

3. **Import Database Schema**:
   - Click "phpMyAdmin" next to your new database
   - In phpMyAdmin, click your database name on the left
   - Click "Import" tab at the top
   - Click "Choose File" and select `database/schema.sql` from the extracted
     files
   - Click "Go" to import
   - You should see "Import has been successfully finished"

---

## Step 5: Configure Database Connection

1. **Edit Database Configuration**:
   - Back in File Manager, navigate to the `config` folder
   - Find `database.php` file
   - Right-click and select "Edit"

2. **Update Database Credentials**:
   ```php
   <?php
   // Replace these with your actual database details
   $host = 'localhost';
   $dbname = 'your_username_terrafusion_shock_awe';  // Replace with actual name
   $username = 'your_username';                       // Replace with actual username
   $password = 'your_database_password';              // Replace with actual password
   ```

   - Click "Save Changes"

---

## Step 6: Test Your Website

1. **Visit Your Website**:
   - Open a web browser
   - Go to `https://terrafusionmarket.io`
   - You should see the TerraFusion Shock & Awe interface

2. **Test Government Module**:
   - Try clicking on different government entities
   - Check if data loads from the database
   - Verify the transcendent modules are accessible

---

## Step 7: Troubleshooting Common Issues

### Issue: "Database Connection Error"

**Solution**:

- Check database credentials in `config/database.php`
- Verify database name includes your username prefix
- Ensure database user has proper permissions

### Issue: "404 Not Found" for API calls

**Solution**:

- Check that `.htaccess` file is in the root directory
- Verify mod_rewrite is enabled (contact Hostinger support)

### Issue: "500 Internal Server Error"

**Solution**:

- Check file permissions (should be 644 for files, 755 for folders)
- Look at error logs in Hostinger control panel
- Verify PHP version is 7.4 or higher

### Issue: Website shows Hostinger default page

**Solution**:

- Ensure files are in the correct directory (`public_html`)
- Check that `index.html` exists in the root
- Clear browser cache and try again

---

## Step 8: Optional Enhancements

### Enable HTTPS (SSL)

1. In Hostinger control panel, find "SSL/TLS"
2. Enable "Let's Encrypt SSL" for terrafusionmarket.io
3. Wait 10-15 minutes for activation

### Set Up Email (if needed)

1. Go to "Email Accounts" in control panel
2. Create email addresses like admin@terrafusionmarket.io

### Monitor Performance

1. Use "Analytics" in Hostinger control panel
2. Monitor visitor statistics and performance

---

## Quick Reference: File Structure

After deployment, your website should have this structure:

```
public_html/
├── index.html                 # Main website entry
├── api/                       # PHP API endpoints
│   ├── government.php
│   ├── consciousness.php
│   └── deployment.php
├── assets/                    # CSS, JS, images
│   ├── css/
│   ├── js/
│   └── images/
├── config/                    # Configuration files
│   └── database.php
├── database/                  # Database setup
│   ├── schema.sql
│   └── seed-data.sql
└── .htaccess                 # URL routing rules
```

---

## Support Contacts

If you encounter issues:

1. **Hostinger Support**:
   - 24/7 live chat in control panel
   - Knowledge base: https://support.hostinger.com

2. **TerraFusion Technical Issues**:
   - Check error logs in Hostinger control panel
   - Review browser console for JavaScript errors

---

## Success Checklist

- [ ] Website loads at terrafusionmarket.io
- [ ] Government entities display correctly
- [ ] Database connection working
- [ ] Transcendent modules accessible
- [ ] No 404 or 500 errors
- [ ] Mobile-responsive design working
- [ ] SSL certificate active (padlock icon)

**Congratulations! Your TerraFusion Shock & Awe system is now live!**

---

_Need help? Each step includes troubleshooting tips. Take your time and don't
hesitate to contact Hostinger support if needed._
