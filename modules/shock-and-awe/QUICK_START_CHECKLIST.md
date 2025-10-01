# ✅ Quick Start Deployment Checklist

## Before You Start

Print this checklist and check off each step as you complete it.

### What You Need

- [ ] Hostinger hosting account login details
- [ ] Access to https://hpanel.hostinger.com
- [ ] The file: `terrafusion-shock-awe-hostinger.zip` (312KB)
- [ ] 30-45 minutes of time
- [ ] Notepad to write down database details

---

## Phase 1: Login & Upload (10 minutes)

### Step 1: Login to Hostinger

- [ ] Go to https://hpanel.hostinger.com
- [ ] Enter your email and password
- [ ] Click on "Manage" for terrafusionmarket.io

### Step 2: Upload Files

- [ ] Click "File Manager"
- [ ] Go to `public_html` folder
- [ ] Click "Upload" button
- [ ] Select `terrafusion-shock-awe-hostinger.zip`
- [ ] Wait for upload (1-2 minutes)
- [ ] Right-click ZIP file → "Extract"
- [ ] Delete the ZIP file after extraction

---

## Phase 2: Database Setup (15 minutes)

### Step 3: Create Database

- [ ] Go back to control panel main page
- [ ] Click "MySQL Databases"
- [ ] Click "Create Database"
- [ ] Name it: `terrafusion_shock_awe`
- [ ] Click "Create"

### Step 4: Write Down Database Details

**IMPORTANT**: Write these details on paper:

```
Database Name: ________________________________
Username: _____________________________________
Password: _____________________________________
Host: localhost
```

### Step 5: Import Database

- [ ] Click "phpMyAdmin" next to your database
- [ ] Click your database name on the left side
- [ ] Click "Import" tab
- [ ] Click "Choose File"
- [ ] Select `database/schema.sql` from extracted files
- [ ] Click "Go"
- [ ] See "Import successful" message

---

## Phase 3: Configuration (10 minutes)

### Step 6: Update Database Settings

- [ ] Back to File Manager
- [ ] Open `config` folder
- [ ] Right-click `database.php` → "Edit"
- [ ] Replace the 4 database values with what you wrote down
- [ ] Click "Save Changes"

---

## Phase 4: Testing (10 minutes)

### Step 7: Test Your Website

- [ ] Open new browser tab
- [ ] Go to: https://terrafusionmarket.io
- [ ] Website loads without errors
- [ ] Click on "Benton County" to test database
- [ ] Try different government modules
- [ ] Check mobile view (resize browser)

---

## 🎉 Success Criteria

Your deployment is successful when:

- [ ] Website loads at terrafusionmarket.io
- [ ] No "Database Connection Error"
- [ ] Government entities show data
- [ ] Green padlock (SSL) in browser
- [ ] No 404 or 500 errors

---

## 🚨 If Something Goes Wrong

### Website shows default Hostinger page:

→ Files might be in wrong folder. Put them in `public_html`

### "Database Connection Error":

→ Check database details in `config/database.php` match what you wrote down

### "404 Not Found":

→ Make sure `index.html` is in `public_html` folder

### Still need help?

→ Contact Hostinger 24/7 support chat in your control panel

---

**Total Time: 30-45 minutes** **Difficulty: Beginner Friendly**

_Take breaks between phases if needed. No rush!_
