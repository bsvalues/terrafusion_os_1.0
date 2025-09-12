#!/bin/bash

echo "🚀 TerraFusion County Demo System - Launch Script"
echo "================================================="

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

# Create output directories
echo "📁 Creating output directories..."
mkdir -p county_demos
mkdir -p generated_reports
mkdir -p demo_presentations

echo ""
echo "🎯 TerraFusion County Demo System Ready!"
echo ""
echo "Available Commands:"
echo "==================="
echo ""
echo "1. 🔍 SCRAPE COUNTY DATA:"
echo "   python demo_generator.py"
echo ""
echo "2. 📊 LAUNCH DEMO DASHBOARD:"
echo "   streamlit run demo_dashboard_generator.py"
echo ""
echo "3. 🏗️ BUILD RUST SCRAPER (Advanced):"
echo "   cargo run --release"
echo ""
echo "4. 🎨 GENERATE PRESENTATION MATERIALS:"
echo "   python presentation_generator.py [county_name]"
echo ""

# Check if county demos exist
if [ -d "county_demos" ] && [ "$(ls -A county_demos)" ]; then
    echo "✅ Existing county demos found:"
    ls -la county_demos/
else
    echo "⚠️  No county demos found. Run data scraping first:"
    echo "   python demo_generator.py"
fi

echo ""
echo "🏛️ Counties Ready for Demo:"
echo "• Walla Walla County, WA"
echo "• Cowlitz County, WA" 
echo "• Yakima County, WA"
echo "• Island County, WA"
echo ""
echo "📞 For sales demonstrations: sales@terrafusion.io"
echo "🌐 Website: terrafusionmarket.io"
echo ""

# Offer to run the scraper immediately
read -p "🤖 Would you like to scrape county data now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Starting county data scraping..."
    python demo_generator.py
    
    echo ""
    read -p "📊 Launch demo dashboard? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Launching TerraFusion Demo Dashboard..."
        streamlit run demo_dashboard_generator.py
    fi
fi

echo ""
echo "🏆 TerraFusion County Demo System - Ready for Government Sales!"

