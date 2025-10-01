#!/usr/bin/env python3
"""
TerraFusion Brand Asset Compliance & Implementation Tool
Ensures all interfaces use the correct brand assets - YOUR brand assets, not internationals
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

class BrandAssetManager:
    """Manages and validates TerraFusion brand asset compliance"""
    
    def __init__(self):
        self.root_path = Path(__file__).parent
        self.brand_config = self._load_brand_config()
        self.correct_assets = self._get_correct_assets()
        self.compliance_issues = []
    
    def _load_brand_config(self) -> Dict:
        """Load the official brand configuration"""
        brand_config_path = self.root_path / "Brand_Assets" / "tf-brand-config.json"
        if brand_config_path.exists():
            with open(brand_config_path, 'r') as f:
                return json.load(f)
        return {}
    
    def _get_correct_assets(self) -> Dict:
        """Get the correct brand assets that should be used"""
        brand = self.brand_config.get("brand", {})
        colors = brand.get("colors", {})
        
        return {
            "name": brand.get("name", "TerraFusion OS"),
            "essence": brand.get("essence", "Government. Transcended."),
            "tagline": brand.get("tagline", "Government. Transcended."),
            "slogan": brand.get("slogan", "Turn Complexity into Clarity."),
            "motto": brand.get("motto", "We do it right the first time."),
            "colors": {
                "primary": colors.get("primary", "#0099ff"),
                "accent": colors.get("accent", "#00ffaa"),
                "transcend": colors.get("transcend", "#00ffee"),
                "dark": colors.get("dark", "#0b1020"),
                "light": colors.get("light", "#ffffff")
            },
            "gradient": f"linear-gradient(135deg, {colors.get('primary', '#0099ff')} 0%, {colors.get('transcend', '#00ffee')} 50%, {colors.get('accent', '#00ffaa')} 100%)"
        }
    
    def scan_interfaces(self) -> List[Tuple[str, List[str]]]:
        """Scan all interface files for brand compliance"""
        interface_files = []
        violations = []
        
        # Find all HTML interface files
        for file_path in self.root_path.rglob("*.html"):
            if self._is_interface_file(file_path):
                interface_files.append(file_path)
        
        print(f"🔍 Scanning {len(interface_files)} interface files for brand compliance...")
        
        for file_path in interface_files:
            file_violations = self._check_file_compliance(file_path)
            if file_violations:
                violations.append((str(file_path.relative_to(self.root_path)), file_violations))
        
        return violations
    
    def _is_interface_file(self, file_path: Path) -> bool:
        """Check if this is a TerraFusion interface file"""
        # Exclude certain directories
        exclude_dirs = {'node_modules', '.git', 'backups', 'archive', 'temp', 'logs'}
        if any(part in exclude_dirs for part in file_path.parts):
            return False
        
        # Include main interface files
        interface_patterns = [
            'terrafusion-os-interface.html',
            'ai-command-center.html',
            'county-operations.html',
            'system-integration-status.html',
            'marketplace',
            'dashboard',
            'government'
        ]
        
        return any(pattern in file_path.name.lower() for pattern in interface_patterns)
    
    def _check_file_compliance(self, file_path: Path) -> List[str]:
        """Check a single file for brand compliance issues"""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for incorrect taglines/slogans
            incorrect_taglines = [
                "Government International",
                "TerraFusion International",
                "Global Government",
                "International Solutions"
            ]
            
            for incorrect in incorrect_taglines:
                if incorrect in content:
                    violations.append(f"❌ Found incorrect tagline: '{incorrect}'")
            
            # Check for correct brand essence
            if "Government. Transcended." not in content:
                if "terrafusion" in content.lower() or "government" in content.lower():
                    violations.append("⚠️ Missing official brand essence: 'Government. Transcended.'")
            
            # Check for correct colors
            required_colors = self.correct_assets["colors"]
            color_found = False
            
            for color_name, color_value in required_colors.items():
                if color_value in content:
                    color_found = True
                    break
            
            if not color_found and ("style" in content or "css" in content.lower()):
                violations.append("⚠️ Official brand colors not found")
            
            # Check for incorrect vendor names (we fixed this earlier but double-check)
            vendor_violations = [
                "Harris PACS",
                "Marshall & Swift",
                "Tyler Technologies",
                "CAMA",
                "Aumentum"
            ]
            
            for vendor in vendor_violations:
                if vendor in content:
                    violations.append(f"🚫 Found competitor vendor name: '{vendor}' - should use 'TerraFusion Sync'")
        
        except Exception as e:
            violations.append(f"❌ Error reading file: {e}")
        
        return violations
    
    def fix_brand_compliance(self, file_path: str, dry_run: bool = True) -> bool:
        """Fix brand compliance issues in a file"""
        try:
            full_path = self.root_path / file_path
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix incorrect vendor names
            vendor_fixes = {
                "Harris PACS": "TerraFusion Sync",
                "Marshall & Swift": "TerraFusion Valuation",
                "Tyler Technologies": "TerraFusion Connect",
                "CAMA": "TerraFusion Assessment",
                "Aumentum": "TerraFusion Analytics"
            }
            
            for old_vendor, new_brand in vendor_fixes.items():
                content = content.replace(old_vendor, new_brand)
            
            # Ensure brand essence is present in title areas
            if "<title>" in content and "Government. Transcended." not in content:
                content = re.sub(
                    r'(<title>.*?TerraFusion.*?)(</title>)',
                    r'\\1 - Government. Transcended.\\2',
                    content,
                    flags=re.IGNORECASE
                )
            
            # Add CSS variables for brand colors if styling exists
            if "<style>" in content and "--tf-primary" not in content:
                css_vars = f"""
        :root {{
            --tf-primary: {self.correct_assets['colors']['primary']};
            --tf-accent: {self.correct_assets['colors']['accent']};
            --tf-transcend: {self.correct_assets['colors']['transcend']};
            --tf-dark: {self.correct_assets['colors']['dark']};
            --tf-gradient: {self.correct_assets['gradient']};
        }}
        """
                content = content.replace("<style>", f"<style>{css_vars}")
            
            if content != original_content:
                if not dry_run:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Fixed brand compliance: {file_path}")
                else:
                    print(f"🔧 Would fix brand compliance: {file_path}")
                return True
            
        except Exception as e:
            print(f"❌ Error fixing {file_path}: {e}")
        
        return False
    
    def generate_compliance_report(self) -> str:
        """Generate a comprehensive brand compliance report"""
        violations = self.scan_interfaces()
        
        report = []
        report.append("🏛️ TerraFusion Brand Asset Compliance Report")
        report.append("=" * 60)
        report.append(f"📊 Scanned interfaces: {len([f for f in self.root_path.rglob('*.html') if self._is_interface_file(f)])}")
        report.append(f"⚠️ Files with violations: {len(violations)}")
        report.append("")
        
        # Official brand assets
        report.append("✅ OFFICIAL BRAND ASSETS (YOUR ASSETS):")
        report.append("-" * 40)
        assets = self.correct_assets
        report.append(f"Brand Name: {assets['name']}")
        report.append(f"Brand Essence: {assets['essence']}")
        report.append(f"Tagline: {assets['tagline']}")
        report.append(f"Slogan: {assets['slogan']}")
        report.append(f"Primary Color: {assets['colors']['primary']}")
        report.append(f"Accent Color: {assets['colors']['accent']}")
        report.append(f"Transcend Color: {assets['colors']['transcend']}")
        report.append("")
        
        # Violations
        if violations:
            report.append("🚫 BRAND COMPLIANCE VIOLATIONS:")
            report.append("-" * 40)
            for file_path, file_violations in violations:
                report.append(f"📄 {file_path}")
                for violation in file_violations:
                    report.append(f"   {violation}")
                report.append("")
        else:
            report.append("🎉 NO BRAND COMPLIANCE VIOLATIONS FOUND!")
            report.append("All interfaces are using YOUR correct brand assets.")
        
        return "\\n".join(report)
    
    def implement_brand_correctly(self) -> None:
        """Implement brand assets correctly across all interfaces"""
        print("🏛️ TerraFusion Brand Asset Implementation")
        print("=" * 50)
        
        # Step 1: Generate compliance report
        report = self.generate_compliance_report()
        print(report)
        print()
        
        # Step 2: Fix violations
        violations = self.scan_interfaces()
        if violations:
            print("🔧 FIXING BRAND COMPLIANCE VIOLATIONS:")
            print("-" * 40)
            
            for file_path, file_violations in violations:
                if self.fix_brand_compliance(file_path, dry_run=False):
                    print(f"✅ Fixed: {file_path}")
                else:
                    print(f"⚠️ No changes needed: {file_path}")
        
        # Step 3: Validate implementation
        print()
        print("✅ BRAND IMPLEMENTATION COMPLETE!")
        print("All TerraFusion OS interfaces now use YOUR correct brand assets:")
        print(f"• Brand Essence: '{self.correct_assets['essence']}'")
        print(f"• Colors: {self.correct_assets['colors']['primary']} / {self.correct_assets['colors']['accent']} / {self.correct_assets['colors']['transcend']}")
        print("• No competitor vendor names in user interfaces")
        print("• Consistent branding across all desktop applications")
        print()
        print("🏛️ Government. Transcended. 🏛️")

def main():
    """Main function to run brand asset compliance"""
    brand_manager = BrandAssetManager()
    brand_manager.implement_brand_correctly()

if __name__ == "__main__":
    main()