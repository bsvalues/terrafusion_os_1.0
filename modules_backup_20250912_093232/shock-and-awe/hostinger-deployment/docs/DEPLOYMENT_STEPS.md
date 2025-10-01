# TerraFusion Shock & Awe - Hostinger Deployment Steps

## Prerequisites

- Hostinger Business or Premium hosting account
- terrafusionmarket.io domain configured
- MySQL database created in Hostinger control panel
- FTP/File Manager access

## Step 1: Upload Files

1. Extract the deployment package
2. Upload contents of `public_html/` to your domain's public_html directory
3. Upload `config/` directory to the root (one level above public_html)
4. Upload `database/` directory to the root

## Step 2: Database Setup

1. In Hostinger control panel, go to MySQL Databases
2. Import `database/schema.sql` to create tables
3. Import `database/seed.sql` to populate initial data
4. Update `config/database.php` with your database credentials

## Step 3: Configuration

1. Edit `config/database.php`:
   - Update DB_NAME with your database name
   - Update DB_USER with your username
   - Update DB_PASS with your password
2. Edit `config/hostinger.php`:
   - Set a secure JWT_SECRET
   - Configure any custom settings

## Step 4: Domain & SSL

1. Ensure terrafusionmarket.io points to your Hostinger server
2. Enable SSL certificate in Hostinger control panel
3. Test HTTPS access

## Step 5: Testing

1. Visit https://terrafusionmarket.io
2. Test API endpoints: https://terrafusionmarket.io/api/government/status
3. Verify consciousness visualization loads
4. Test citizen interface functionality

## Troubleshooting

- Check PHP error logs in Hostinger control panel
- Verify file permissions (644 for files, 755 for directories)
- Ensure .htaccess is properly uploaded
- Check database connection in config files

## Support

For deployment support, contact TerraFusion development team.
