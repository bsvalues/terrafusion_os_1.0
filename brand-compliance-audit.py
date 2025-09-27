#!/usr/bin/env python3
"""
TerraFusion Brand Compliance Audit Tool
Comprehensive audit of all portals for brand consistency and professional presentation.
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

class TerraFusionBrandAuditor:
    def __init__(self):
        self.brand_config = {
            "colors": {
                "primary": "#0099ff",
                "primary_dark": "#0077cc", 
                "accent": "#00ffaa",
                "accent_dark": "#00cc88",
                "transcend": "#00ffee",
                "dark": "#0b1020",
                "dark_lighter": "#1a1f3a",
                "light": "#ffffff",
                "gray": "#888888",
                "gray_light": "#cccccc",
                "error": "#ff3333",
                "success": "#00ff88",
                "warning": "#ffaa00",
                "clarity": "#e0f7ff"
            },
            "taglines": [
                "Government. Transcended.",
                "Turn Complexity into Clarity",
                "Every user, every action, every day: simplicity, mastery, and confidence—delivered without compromise"
            ],
            "typography": {
                "primary_font": "'Segoe UI'",
                "system_fonts": "system-ui, -apple-system, sans-serif"
            },
            "required_elements": [
                "responsive design",
                "accessibility features", 
                "government styling",
                "professional presentation",
                "brand colors",
                "consistent navigation"
            ]
        }
        
        self.portals = []
        self.audit_results = {}
        
    def find_portals(self) -> List[str]:
        """Find all HTML portal files in the workspace"""
        portal_patterns = [
            "*.html",
            "*portal*.html", 
            "*dashboard*.html",
            "*terrafusion*.html"
        ]
        
        portals = []
        workspace_root = Path("/workspaces/terrafusion_os_1.0")
        
        for pattern in portal_patterns:
            for file_path in workspace_root.glob(pattern):
                if file_path.is_file() and file_path.suffix == '.html':
                    portals.append(str(file_path))
                    
        return portals
        
    def audit_portal(self, portal_path: str) -> Dict:
        """Audit a single portal for brand compliance"""
        try:
            with open(portal_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {"error": f"Could not read file: {e}", "score": 0}
            
        audit = {
            "path": portal_path,
            "name": os.path.basename(portal_path),
            "score": 0,
            "max_score": 100,
            "issues": [],
            "compliance_areas": {}
        }
        
        # Check brand colors (20 points)
        color_score = self.check_brand_colors(content, audit)
        
        # Check taglines and messaging (15 points)
        messaging_score = self.check_messaging(content, audit)
        
        # Check typography (10 points)
        typography_score = self.check_typography(content, audit)
        
        # Check responsive design (15 points)
        responsive_score = self.check_responsive_design(content, audit)
        
        # Check professional elements (20 points)
        professional_score = self.check_professional_elements(content, audit)
        
        # Check navigation consistency (10 points)
        navigation_score = self.check_navigation(content, audit)
        
        # Check accessibility (10 points)
        accessibility_score = self.check_accessibility(content, audit)
        
        audit["score"] = (color_score + messaging_score + typography_score + 
                         responsive_score + professional_score + navigation_score + 
                         accessibility_score)
        
        audit["compliance_percentage"] = round((audit["score"] / audit["max_score"]) * 100, 1)
        
        return audit
        
    def check_brand_colors(self, content: str, audit: Dict) -> int:
        """Check for proper brand color usage"""
        score = 0
        required_colors = ["#0099ff", "#00ffaa", "#00ffee", "#0b1020"]
        
        colors_found = []
        for color in required_colors:
            if color in content:
                colors_found.append(color)
                score += 5
                
        audit["compliance_areas"]["colors"] = {
            "score": score,
            "max_score": 20,
            "found": colors_found,
            "missing": [c for c in required_colors if c not in colors_found]
        }
        
        if score < 15:
            audit["issues"].append(f"Missing key brand colors: {audit['compliance_areas']['colors']['missing']}")
            
        return score
        
    def check_messaging(self, content: str, audit: Dict) -> int:
        """Check for proper taglines and messaging"""
        score = 0
        taglines_found = []
        
        for tagline in self.brand_config["taglines"]:
            if tagline in content:
                taglines_found.append(tagline)
                score += 5
                
        audit["compliance_areas"]["messaging"] = {
            "score": score,
            "max_score": 15,
            "taglines_found": taglines_found
        }
        
        if not taglines_found:
            audit["issues"].append("No brand taglines found")
        elif len(taglines_found) < 2:
            audit["issues"].append("Insufficient brand messaging")
            
        return score
        
    def check_typography(self, content: str, audit: Dict) -> int:
        """Check typography consistency"""
        score = 0
        
        if "'Segoe UI'" in content or "Segoe UI" in content:
            score += 5
        if "system-ui" in content:
            score += 3
        if "sans-serif" in content:
            score += 2
            
        audit["compliance_areas"]["typography"] = {
            "score": score,
            "max_score": 10
        }
        
        if score < 5:
            audit["issues"].append("Typography not using brand fonts")
            
        return score
        
    def check_responsive_design(self, content: str, audit: Dict) -> int:
        """Check responsive design implementation"""
        score = 0
        
        responsive_indicators = [
            "viewport",
            "@media",
            "grid-template-columns",
            "flex",
            "responsive"
        ]
        
        found_indicators = []
        for indicator in responsive_indicators:
            if indicator in content:
                found_indicators.append(indicator)
                score += 3
                
        audit["compliance_areas"]["responsive"] = {
            "score": min(score, 15),
            "max_score": 15,
            "indicators_found": found_indicators
        }
        
        if score < 9:
            audit["issues"].append("Limited responsive design implementation")
            
        return min(score, 15)
        
    def check_professional_elements(self, content: str, audit: Dict) -> int:
        """Check professional presentation elements"""
        score = 0
        
        professional_elements = [
            "gradient",
            "animation",
            "transition",
            "box-shadow",
            "border-radius",
            "hover",
            "transform"
        ]
        
        found_elements = []
        for element in professional_elements:
            if element in content:
                found_elements.append(element)
                score += 3
                
        audit["compliance_areas"]["professional"] = {
            "score": min(score, 20),
            "max_score": 20,
            "elements_found": found_elements
        }
        
        if score < 12:
            audit["issues"].append("Lacks professional visual elements")
            
        return min(score, 20)
        
    def check_navigation(self, content: str, audit: Dict) -> int:
        """Check navigation consistency"""
        score = 0
        
        nav_elements = ["nav", "menu", "header", "navbar"]
        nav_found = any(element in content.lower() for element in nav_elements)
        
        if nav_found:
            score += 5
            
        if "TerraFusion" in content:
            score += 3
            
        if any(tagline in content for tagline in self.brand_config["taglines"]):
            score += 2
            
        audit["compliance_areas"]["navigation"] = {
            "score": score,
            "max_score": 10,
            "has_navigation": nav_found
        }
        
        if score < 5:
            audit["issues"].append("Navigation elements missing or inconsistent")
            
        return score
        
    def check_accessibility(self, content: str, audit: Dict) -> int:
        """Check accessibility features"""
        score = 0
        
        accessibility_features = [
            'alt="',
            'aria-',
            'role=',
            'tabindex',
            'lang=',
            'title='
        ]
        
        found_features = []
        for feature in accessibility_features:
            if feature in content:
                found_features.append(feature)
                score += 2
                
        audit["compliance_areas"]["accessibility"] = {
            "score": min(score, 10),
            "max_score": 10,
            "features_found": found_features
        }
        
        if score < 4:
            audit["issues"].append("Limited accessibility features")
            
        return min(score, 10)
        
    def generate_report(self) -> str:
        """Generate comprehensive audit report"""
        total_portals = len(self.audit_results)
        if total_portals == 0:
            return "No portals found for audit."
            
        # Calculate overall statistics
        total_score = sum(result["score"] for result in self.audit_results.values())
        max_possible = sum(result["max_score"] for result in self.audit_results.values())
        overall_compliance = round((total_score / max_possible) * 100, 1)
        
        # Count compliance levels
        excellent = sum(1 for r in self.audit_results.values() if r["compliance_percentage"] >= 90)
        good = sum(1 for r in self.audit_results.values() if 70 <= r["compliance_percentage"] < 90)
        needs_improvement = sum(1 for r in self.audit_results.values() if 50 <= r["compliance_percentage"] < 70)
        poor = sum(1 for r in self.audit_results.values() if r["compliance_percentage"] < 50)
        
        report = f"""
🎯 TERRAFUSION BRAND COMPLIANCE AUDIT REPORT
============================================

📊 OVERALL STATISTICS:
• Total Portals Audited: {total_portals}
• Overall Compliance Rate: {overall_compliance}%
• Total Issues Found: {sum(len(r['issues']) for r in self.audit_results.values())}

📈 COMPLIANCE BREAKDOWN:
• Excellent (90%+): {excellent} portals ({round(excellent/total_portals*100,1)}%)
• Good (70-89%): {good} portals ({round(good/total_portals*100,1)}%)
• Needs Improvement (50-69%): {needs_improvement} portals ({round(needs_improvement/total_portals*100,1)}%)
• Poor (<50%): {poor} portals ({round(poor/total_portals*100,1)}%)

🔍 DETAILED PORTAL ANALYSIS:
"""
        
        # Sort portals by compliance score (highest first)
        sorted_results = sorted(self.audit_results.items(), 
                              key=lambda x: x[1]["compliance_percentage"], 
                              reverse=True)
        
        for portal_path, result in sorted_results:
            status_emoji = "✅" if result["compliance_percentage"] >= 90 else \
                          "⚠️" if result["compliance_percentage"] >= 70 else \
                          "❌" if result["compliance_percentage"] >= 50 else "🚨"
                          
            report += f"""
{status_emoji} {result['name']}
   Compliance: {result['compliance_percentage']}% ({result['score']}/{result['max_score']})
   Issues: {len(result['issues'])}
"""
            
            if result['issues']:
                for issue in result['issues'][:3]:  # Show top 3 issues
                    report += f"   • {issue}\n"
                if len(result['issues']) > 3:
                    report += f"   • ... and {len(result['issues']) - 3} more issues\n"
                    
        report += f"""
🎨 BRAND COMPLIANCE AREAS:
• Color Usage: {sum(r['compliance_areas'].get('colors', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 20} points
• Messaging: {sum(r['compliance_areas'].get('messaging', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 15} points  
• Typography: {sum(r['compliance_areas'].get('typography', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 10} points
• Responsive Design: {sum(r['compliance_areas'].get('responsive', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 15} points
• Professional Elements: {sum(r['compliance_areas'].get('professional', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 20} points
• Navigation: {sum(r['compliance_areas'].get('navigation', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 10} points
• Accessibility: {sum(r['compliance_areas'].get('accessibility', {}).get('score', 0) for r in self.audit_results.values())}/{total_portals * 10} points

💡 RECOMMENDATIONS:
"""
        
        if overall_compliance < 80:
            report += "• Implement systematic brand standards across all portals\n"
        if poor > 0:
            report += f"• Urgent: {poor} portals need immediate brand compliance updates\n"
        if needs_improvement > 0:
            report += f"• Priority: {needs_improvement} portals require brand enhancement\n"
            
        report += """• Standardize color usage across all government modules
• Implement consistent navigation patterns
• Enhance responsive design for mobile compatibility
• Add professional visual elements and animations
• Improve accessibility features government-wide

🚀 NEXT STEPS:
1. Update non-compliant portals with brand standards
2. Implement automated brand compliance checking
3. Create brand style guide for developers
4. Regular compliance audits (monthly recommended)

Government. Transcended. • Turn Complexity into Clarity.
"""
        
        return report
        
    def run_audit(self) -> str:
        """Run complete brand compliance audit"""
        print("🎯 Starting TerraFusion Brand Compliance Audit...")
        
        # Find all portals
        self.portals = self.find_portals()
        print(f"📊 Found {len(self.portals)} portals to audit")
        
        if not self.portals:
            return "No HTML portals found in workspace."
            
        # Audit each portal
        for portal_path in self.portals:
            print(f"🔍 Auditing: {os.path.basename(portal_path)}")
            self.audit_results[portal_path] = self.audit_portal(portal_path)
            
        # Generate and return report
        report = self.generate_report()
        
        # Save detailed results
        with open("/workspaces/terrafusion_os_1.0/brand-compliance-results.json", 'w') as f:
            json.dump(self.audit_results, f, indent=2)
            
        print("✅ Audit complete! Results saved to brand-compliance-results.json")
        return report

def main():
    """Main execution function"""
    auditor = TerraFusionBrandAuditor()
    report = auditor.run_audit()
    print(report)
    
    # Also save report to file
    with open("/workspaces/terrafusion_os_1.0/brand-compliance-report.txt", 'w') as f:
        f.write(report)
    
    print("\n📋 Full report saved to: brand-compliance-report.txt")

if __name__ == "__main__":
    main()