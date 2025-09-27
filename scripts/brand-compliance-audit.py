#!/usr/bin/env python3
"""
TerraFusion Brand Compliance Audit Tool
=======================================

Ensures all portals conform to tf-brand-config.json standards
Government. Transcended. - Brand consistency verification
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple

class TerraFusionBrandAudit:
    def __init__(self):
        self.brand_config = self.load_brand_config()
        self.portal_files = self.find_portal_files()
        self.compliance_issues = []
        
    def load_brand_config(self) -> Dict[str, Any]:
        """Load TerraFusion brand configuration"""
        brand_path = Path("/workspaces/terrafusion_os_1.0/Brand_Assets/tf-brand-config.json")
        with open(brand_path, 'r') as f:
            return json.load(f)
    
    def find_portal_files(self) -> List[Path]:
        """Find all portal HTML files"""
        portal_files = []
        base_path = Path("/workspaces/terrafusion_os_1.0")
        
        # Find HTML files that are portals
        patterns = [
            "*-portal.html",
            "*-management-portal.html", 
            "terrafusion-*.html",
            "TERRAFUSION_*.html"
        ]
        
        for pattern in patterns:
            portal_files.extend(base_path.glob(pattern))
            
        return portal_files
    
    def audit_portal_colors(self, portal_content: str, portal_name: str) -> List[str]:
        """Audit color compliance in portal"""
        issues = []
        brand_colors = self.brand_config['brand']['colors']
        
        # Expected CSS variables
        expected_colors = {
            '--tf-primary': brand_colors['primary'],
            '--tf-primary-dark': brand_colors['primaryDark'],
            '--tf-accent': brand_colors['accent'],
            '--tf-accent-dark': brand_colors['accentDark'],
            '--tf-transcend': brand_colors['transcend'],
            '--tf-dark': brand_colors['dark'],
            '--tf-dark-lighter': brand_colors['darkLighter'],
            '--tf-light': brand_colors['light'],
            '--tf-gray': brand_colors['gray'],
            '--tf-gray-light': brand_colors['grayLight'],
            '--tf-error': brand_colors['error'],
            '--tf-success': brand_colors['success'],
            '--tf-warning': brand_colors['warning'],
            '--tf-clarity': brand_colors['clarity']
        }
        
        # Check if CSS variables are defined
        for var_name, expected_value in expected_colors.items():
            if var_name not in portal_content:
                issues.append(f"❌ {portal_name}: Missing CSS variable {var_name}")
            elif f"{var_name}: {expected_value}" not in portal_content:
                issues.append(f"⚠️ {portal_name}: Incorrect value for {var_name} (should be {expected_value})")
        
        return issues
    
    def audit_portal_messaging(self, portal_content: str, portal_name: str) -> List[str]:
        """Audit brand messaging compliance"""
        issues = []
        brand = self.brand_config['brand']
        
        # Check for brand elements
        brand_elements = {
            'tagline': brand['tagline'],  # "Government. Transcended."
            'slogan': brand['slogan'],    # "Turn Complexity into Clarity."
            'motto': brand['motto']       # "We do it right the first time."
        }
        
        # Check if tagline appears
        if brand['tagline'] not in portal_content:
            issues.append(f"⚠️ {portal_name}: Missing brand tagline '{brand['tagline']}'")
        
        # Check for transcendence microcopy
        transcendence_words = ['transcend', 'clarity', 'excellence', 'transform']
        found_words = []
        for word in transcendence_words:
            if word.lower() in portal_content.lower():
                found_words.append(word)
        
        if len(found_words) < 2:
            issues.append(f"⚠️ {portal_name}: Insufficient brand language (found: {found_words})")
        
        return issues
    
    def audit_portal_animations(self, portal_content: str, portal_name: str) -> List[str]:
        """Audit animation compliance"""
        issues = []
        
        # Expected brand animations
        expected_animations = [
            'transcendPulse',
            'clarityFade', 
            'intelligenceRipple'
        ]
        
        animations_found = []
        for animation in expected_animations:
            if animation in portal_content:
                animations_found.append(animation)
        
        if len(animations_found) == 0:
            issues.append(f"⚠️ {portal_name}: No brand animations found (should use transcendPulse, clarityFade, or intelligenceRipple)")
        
        return issues
    
    def audit_portal_icons(self, portal_content: str, portal_name: str) -> List[str]:
        """Audit iconography compliance"""
        issues = []
        brand_icons = self.brand_config['brand']['ui_patterns']['iconography']['primaryIcons']
        
        # Look for emoji usage (should align with brand)
        found_emojis = re.findall(r'[😀-🿿]', portal_content)
        
        # Check if service-appropriate emojis are used
        if not found_emojis:
            issues.append(f"⚠️ {portal_name}: No visual icons/emojis found for enhanced UX")
        
        return issues
    
    def generate_compliance_report(self) -> str:
        """Generate comprehensive compliance report"""
        print("🔍 Starting TerraFusion Brand Compliance Audit...")
        print(f"📋 Auditing {len(self.portal_files)} portal files...")
        
        total_issues = 0
        compliant_portals = 0
        
        report = []
        report.append("🏛️ TERRAFUSION BRAND COMPLIANCE AUDIT REPORT")
        report.append("=" * 60)
        report.append(f"Brand Standard: {self.brand_config['brand']['tagline']}")
        report.append(f"Audit Date: {os.popen('date').read().strip()}")
        report.append("")
        
        for portal_file in self.portal_files:
            portal_name = portal_file.name
            
            try:
                with open(portal_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Run all audits
                color_issues = self.audit_portal_colors(content, portal_name)
                messaging_issues = self.audit_portal_messaging(content, portal_name)
                animation_issues = self.audit_portal_animations(content, portal_name)
                icon_issues = self.audit_portal_icons(content, portal_name)
                
                portal_issues = color_issues + messaging_issues + animation_issues + icon_issues
                total_issues += len(portal_issues)
                
                if len(portal_issues) == 0:
                    compliant_portals += 1
                    report.append(f"✅ {portal_name} - FULLY COMPLIANT")
                else:
                    report.append(f"🔧 {portal_name} - {len(portal_issues)} issues found:")
                    for issue in portal_issues:
                        report.append(f"    {issue}")
                
                report.append("")
                
            except Exception as e:
                report.append(f"❌ {portal_name} - Error reading file: {e}")
                report.append("")
        
        # Summary
        report.append("📊 COMPLIANCE SUMMARY")
        report.append("-" * 30)
        report.append(f"Total Portals Audited: {len(self.portal_files)}")
        report.append(f"Fully Compliant: {compliant_portals}")
        report.append(f"Needs Attention: {len(self.portal_files) - compliant_portals}")
        report.append(f"Total Issues Found: {total_issues}")
        
        compliance_rate = (compliant_portals / len(self.portal_files)) * 100 if self.portal_files else 0
        report.append(f"Compliance Rate: {compliance_rate:.1f}%")
        
        if compliance_rate >= 90:
            report.append("🏆 EXCELLENT - Brand standards maintained")
        elif compliance_rate >= 75:
            report.append("✅ GOOD - Minor improvements needed")
        elif compliance_rate >= 50:
            report.append("⚠️ MODERATE - Significant brand alignment required")
        else:
            report.append("🚨 CRITICAL - Major brand compliance issues")
        
        report.append("")
        report.append("💡 RECOMMENDED ACTIONS:")
        report.append("1. Update color variables to match tf-brand-config.json")
        report.append("2. Include brand tagline 'Government. Transcended.'")
        report.append("3. Add transcendPulse/clarityFade animations")
        report.append("4. Use consistent microcopy and messaging")
        report.append("5. Maintain professional government styling")
        
        return "\n".join(report)
    
    def fix_portal_branding(self, portal_file: Path) -> bool:
        """Automatically fix basic branding issues"""
        try:
            with open(portal_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix color variables if missing
            brand_colors = self.brand_config['brand']['colors']
            color_vars = f"""
        /* TerraFusion Brand Colors */
        :root {{
            --tf-primary: {brand_colors['primary']};
            --tf-primary-dark: {brand_colors['primaryDark']};
            --tf-accent: {brand_colors['accent']};
            --tf-accent-dark: {brand_colors['accentDark']};
            --tf-transcend: {brand_colors['transcend']};
            --tf-dark: {brand_colors['dark']};
            --tf-dark-lighter: {brand_colors['darkLighter']};
            --tf-light: {brand_colors['light']};
            --tf-gray: {brand_colors['gray']};
            --tf-gray-light: {brand_colors['grayLight']};
            --tf-error: {brand_colors['error']};
            --tf-success: {brand_colors['success']};
            --tf-warning: {brand_colors['warning']};
            --tf-clarity: {brand_colors['clarity']};
        }}"""
            
            # Update color variables
            if ":root {" in content and "--tf-primary:" not in content:
                content = content.replace(":root {", color_vars.strip() + "\n\n        ", 1)
            
            # Add brand tagline if missing
            tagline = self.brand_config['brand']['tagline']
            if tagline not in content and "<title>" in content:
                content = content.replace(" | ", f" | {tagline} | ", 1)
            
            # Save if changes made
            if content != original_content:
                with open(portal_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error fixing {portal_file.name}: {e}")
            return False

def main():
    """Run brand compliance audit"""
    auditor = TerraFusionBrandAudit()
    
    # Generate and display report
    report = auditor.generate_compliance_report()
    print(report)
    
    # Save report to file
    report_path = Path("/workspaces/terrafusion_os_1.0/Brand_Assets/compliance_report.txt")
    with open(report_path, 'w') as f:
        f.write(report)
    
    print(f"\n📄 Full report saved to: {report_path}")
    
    # Offer to auto-fix issues
    user_input = input("\n🔧 Auto-fix basic branding issues? (y/n): ")
    if user_input.lower() == 'y':
        print("\n🔄 Applying automatic brand fixes...")
        fixed_count = 0
        for portal_file in auditor.portal_files:
            if auditor.fix_portal_branding(portal_file):
                print(f"✅ Fixed branding in {portal_file.name}")
                fixed_count += 1
        
        print(f"\n✨ Auto-fixed {fixed_count} portal files")
        print("🎯 Re-run audit to verify improvements")

if __name__ == "__main__":
    main()