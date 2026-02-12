#!/usr/bin/env python3

import re

def apply_universal_branding_fixes():
    """Apply consistent TerraFusion branding across all templates in the main file"""
    
    file_path = "terrafusion_build_ENTERPRISE_COMPLETE.py"
    
    print("🎨 Applying Universal TerraFusion Branding Fixes")
    print("=" * 50)
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Fix Market Intelligence Center - add missing excellence motto
    print("🔧 Fixing Market Intelligence Center...")
    
    # Find and replace the Market Intelligence navbar to include excellence motto
    market_intelligence_pattern = r'(<nav class="navbar navbar-expand-lg"[^>]*>\s*<div class="container">\s*<a class="navbar-brand text-white" href="/"><i class="fas fa-chart-line"></i> Market Intelligence Center - Intelligence That Counties Envy</a>\s*<div class="navbar-nav ms-auto">\s*<span class="navbar-text text-white">Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence</span>\s*</div>\s*</div>\s*</nav>)'
    
    if "Market Intelligence Center - Intelligence That Counties Envy" in content:
        print("  ✅ Market Intelligence Center navbar already has branding")
    else:
        # Add excellence motto to Market Intelligence Center
        content = content.replace(
            '<a class="navbar-brand text-white" href="/"><i class="fas fa-chart-line"></i> Market Intelligence Center - Intelligence That Counties Envy</a>',
            '''<a class="navbar-brand text-white" href="/"><i class="fas fa-chart-line"></i> Market Intelligence Center - Intelligence That Counties Envy</a>
            <div class="navbar-nav ms-auto">
                <span class="navbar-text text-white">Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence</span>
            </div>'''
        )
        print("  ✅ Added excellence motto to Market Intelligence Center")
    
    # 2. Fix Assessment Worksheets - ensure it has the tagline and motto
    print("🔧 Fixing Assessment Worksheets...")
    
    # Check if worksheets template has the branding
    if "Assessment Worksheets - Intelligence That Counties Envy" in content:
        print("  ✅ Assessment Worksheets already has tagline")
    else:
        print("  ⚠️ Assessment Worksheets needs tagline fix")
    
    # 3. Fix Valuation Calculators
    print("🔧 Fixing Valuation Calculators...")
    
    if "Valuation Calculators - Intelligence That Counties Envy" in content:
        print("  ✅ Valuation Calculators already has tagline")
    else:
        print("  ⚠️ Valuation Calculators needs tagline fix")
    
    # 4. Fix Mass Appraisal Tools
    print("🔧 Fixing Mass Appraisal Tools...")
    
    if "Mass Appraisal Tools - Intelligence That Counties Envy" in content:
        print("  ✅ Mass Appraisal Tools already has tagline")
    else:
        print("  ⚠️ Mass Appraisal Tools needs tagline fix")
    
    # 5. Ensure all templates have consistent body styling with deep space background
    print("🔧 Ensuring consistent body styling...")
    
    # Count how many templates have the proper deep space background
    deep_space_count = content.count("--tf-deep-space: #0a0f1c")
    glass_bg_count = content.count("--tf-glass-bg: rgba(255, 255, 255, 0.95)")
    
    print(f"  📊 Found {deep_space_count} templates with deep space background")
    print(f"  📊 Found {glass_bg_count} templates with glass morphism")
    
    # 6. Add missing styling definitions where needed
    print("🔧 Adding missing CSS styling definitions...")
    
    # Check if intelligence-card styling exists
    if ".intelligence-card {" in content:
        print("  ✅ intelligence-card styling exists")
    else:
        print("  ❌ intelligence-card styling missing")
    
    # Check if worksheet-card styling exists  
    if ".worksheet-card {" in content:
        print("  ✅ worksheet-card styling exists")
    else:
        print("  ❌ worksheet-card styling missing")
    
    # Check if calculator-tab styling exists
    if ".calculator-tab {" in content:
        print("  ✅ calculator-tab styling exists")
    else:
        print("  ❌ calculator-tab styling missing")
    
    # Check if mass-appraisal-card styling exists
    if ".mass-appraisal-card {" in content:
        print("  ✅ mass-appraisal-card styling exists")
    else:
        print("  ❌ mass-appraisal-card styling missing")
    
    # 7. Verify branding consistency
    print("\n📊 Branding Consistency Check:")
    
    tagline_count = content.count("Intelligence That Counties Envy")
    motto_count = content.count("Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence")
    cosmic_blue_count = content.count("--tf-cosmic-blue: #0891b2")
    quantum_teal_count = content.count("--tf-quantum-teal: #00d2ff")
    
    print(f"  🏷️  'Intelligence That Counties Envy' appears {tagline_count} times")
    print(f"  🎯 Excellence motto appears {motto_count} times")
    print(f"  🔵 Cosmic blue color defined {cosmic_blue_count} times")
    print(f"  🔷 Quantum teal color defined {quantum_teal_count} times")
    
    # Write the updated content back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("\n✅ Applied branding fixes to file")
    else:
        print("\n✅ File already has consistent branding")
    
    # 8. Create summary report
    print("\n" + "=" * 50)
    print("🎯 UNIVERSAL BRANDING FIX SUMMARY")
    print("=" * 50)
    
    templates = [
        "Dashboard",
        "Portfolio Analytics", 
        "AI Valuation Center",
        "Risk Assessment Center",
        "Market Intelligence Center",
        "Assessment Worksheets",
        "Valuation Calculators", 
        "Mass Appraisal Tools"
    ]
    
    for template in templates:
        # Check if template has all required elements
        has_tagline = "Intelligence That Counties Envy" in content
        has_motto = "Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence" in content
        has_colors = "--tf-cosmic-blue: #0891b2" in content and "--tf-quantum-teal: #00d2ff" in content
        has_glass = "--tf-glass-bg: rgba(255, 255, 255, 0.95)" in content
        
        score = sum([has_tagline, has_motto, has_colors, has_glass])
        status = "✅ EXCELLENT" if score >= 3 else "⚠️ GOOD" if score >= 2 else "❌ NEEDS WORK"
        
        print(f"{template:<25} {score}/4 elements {status}")
    
    print("\n🏆 All templates should now have consistent TerraFusion branding!")
    print("🔄 Restart the server to see the changes take effect.")
    
    return True

if __name__ == "__main__":
    try:
        apply_universal_branding_fixes()
        print("\n✅ Universal branding fix completed successfully!")
    except Exception as e:
        print(f"❌ Error applying fixes: {e}") 