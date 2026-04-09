#!/bin/bash
# Benton County FTP Data Import Script
# This script fetches and imports authentic Benton County property data
# from the ftp.spatialest.com FTP server.

echo "=========================================================="
echo "Benton County Data Import Process - Live Authentic Data"
echo "=========================================================="
echo ""

# Step 1: Fetch data from FTP server
echo "Step 1: Fetching data from Benton County FTP server..."
python3 scripts/fetch-benton-county-data.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch data from FTP server."
    exit 1
fi
echo "FTP data fetch completed."
echo ""

# Step 2: Import data into the database
echo "Step 2: Importing Benton County property data..."
node scripts/import-benton-county-data.js
if [ $? -ne 0 ]; then
    echo "Error: Failed to import data into the database."
    exit 1
fi
echo "Data import completed."
echo ""

# Step 3: Test future value prediction with real Benton County data
echo "Step 3: Testing future value prediction with Benton County data..."
npx tsx scripts/import-benton-county-ftp-data.js
echo ""

echo "=========================================================="
echo "Benton County data import process completed."
echo "Application now using authentic Benton County property data."
echo "=========================================================="