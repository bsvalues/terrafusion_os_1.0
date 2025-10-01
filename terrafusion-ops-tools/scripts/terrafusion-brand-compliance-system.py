#!/usr/bin/env python3

"""
TerraFusion Brand Compliance System
MIT/PhD Level Production Interface Validation & Brand Asset Integration
Ensures all modules follow official TerraFusion "Transcendence DNA" guidelines
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import hashlib
import base64
from jinja2 import Template
import subprocess
import re
from bs4 import BeautifulSoup
import cssutils
import yaml

class BrandComplianceLevel(Enum):
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    SUBSTANTIALLY_COMPLIANT = "substantially_compliant"
    FULLY_COMPLIANT = "fully_compliant"
    TRANSCENDENCE_CERTIFIED = "transcendence_certified"

class BrandElement(Enum):
    COLOR_PALETTE = "color_palette"
    TYPOGRAPHY = "typography"
    MICROCOPY = "microcopy"
    VISUAL_EFFECTS = "visual_effects"
    LAYOUT_STRUCTURE = "layout_structure"
    COMPONENT_DESIGN = "component_design"
    INTERACTION_PATTERNS = "interaction_patterns"
    ACCESSIBILITY = "accessibility"
    RESPONSIVENESS = "responsiveness"
    PWA_COMPLIANCE = "pwa_compliance"

class ModuleType(Enum):
    CORE_MODULE = "core_module"
    TIER_1_MODULE = "tier_1_module"
    TIER_2_MODULE = "tier_2_module"
    TIER_3_MODULE = "tier_3_module"
    EXTERNAL_MODULE = "external_module"

@dataclass
class BrandValidationRule:
    rule_id: str
    element: BrandElement
    title: str
    description: str
    validation_method: str
    expected_values: List[str]
    critical: bool
    weight: float

@dataclass
class ModuleBrandAssessment:
    module_name: str
    module_type: ModuleType
    module_path: str
    compliance_level: BrandComplianceLevel
    overall_score: float
    element_scores: Dict[str, float]
    violations: List[str]
    recommendations: List[str]
    assessed_at: datetime
    next_assessment_due: datetime

@dataclass
class TerraFusionBrandStandard:
    # Official TerraFusion "Transcendence DNA"
    essence: str = "Government. Transcended."
    tagline: str = "Government. Transcended."
    slogan: str = "Turn Complexity into Clarity."
    motto: str = "We do it right the first time."
    
    # Color Palette
    primary_color: str = "#0099ff"
    primary_dark: str = "#0077cc"
    accent_color: str = "#00ffaa"
    accent_dark: str = "#00cc88"
    transcend_color: str = "#00ffee"
    dark_color: str = "#0b1020"
    dark_lighter: str = "#1a1f3a"
    light_color: str = "#ffffff"
    
    # Microcopy Standards
    loading_messages: List[str] = None
    confirmation_messages: List[str] = None
    error_messages: List[str] = None
    
    def __post_init__(self):
        if self.loading_messages is None:
            self.loading_messages = [
                "Preparing transcendence…",
                "Advancing county intelligence…",
                "Orchestrating clarity…",
                "Elevating government operations…",
                "Transforming complexity…"
            ]
        if self.confirmation_messages is None:
            self.confirmation_messages = [
                "Transcendence complete.",
                "Your path is clear.",
                "All systems: Ready.",
                "Clarity achieved.",
                "Excellence delivered."
            ]
        if self.error_messages is None:
            self.error_messages = [
                "Let's clear the path—together.",
                "We anticipate, we adapt, we solve.",
                "Support is standing by your side.",
                "This isn't a setback, it's a setup for clarity.",
                "We're here to help you transcend this."
            ]

class TerraFusionBrandComplianceSystem:
    def __init__(self):
        self.session_id = f"brand_compliance_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, db=0)
        
        # Brand standards
        self.brand_standard = TerraFusionBrandStandard()
        
        # Configuration
        self.validation_rules = {}
        self.module_assessments = {}
        self.brand_violations = {}
        
        # File paths
        self.project_root = Path('/workspaces/terrafusion_os_1.0')
        self.brand_assets_dir = self.project_root / 'Brand_Assets'
        self.modules_dir = self.project_root / 'modules'
        self.reports_dir = Path('./reports/brand_compliance')
        self.templates_dir = Path('./templates/brand')
        
        # Create directories
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize system
        self.init_brand_compliance_tables()
        self.load_brand_validation_rules()
        self.load_brand_assets()
        
    def init_brand_compliance_tables(self):
        """Initialize brand compliance database tables"""
        cur = self.db_conn.cursor()
        
        # Brand validation rules table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS brand_validation_rules (
                id SERIAL PRIMARY KEY,
                rule_id VARCHAR(100) UNIQUE NOT NULL,
                element VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                validation_method VARCHAR(100),
                expected_values JSONB,
                critical BOOLEAN DEFAULT FALSE,
                weight FLOAT DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Module brand assessments table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS module_brand_assessments (
                id SERIAL PRIMARY KEY,
                module_name VARCHAR(100) NOT NULL,
                module_type VARCHAR(50),
                module_path TEXT,
                compliance_level VARCHAR(50) NOT NULL,
                overall_score FLOAT DEFAULT 0,
                element_scores JSONB,
                violations JSONB,
                recommendations JSONB,
                assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                next_assessment_due TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Brand compliance history table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS brand_compliance_history (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(100),
                module_name VARCHAR(100),
                compliance_level VARCHAR(50),
                score FLOAT,
                violations_count INTEGER,
                assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.db_conn.commit()
        cur.close()
        
    def load_brand_validation_rules(self):
        """Load comprehensive brand validation rules"""
        
        # Color Palette Rules
        self.validation_rules['color_primary'] = BrandValidationRule(
            rule_id='color_primary',
            element=BrandElement.COLOR_PALETTE,
            title='Primary Color Compliance',
            description='Validates use of official TerraFusion primary color #0099ff',
            validation_method='css_color_analysis',
            expected_values=['#0099ff', 'rgb(0, 153, 255)', 'var(--tf-primary)'],
            critical=True,
            weight=2.0
        )
        
        self.validation_rules['color_accent'] = BrandValidationRule(
            rule_id='color_accent',
            element=BrandElement.COLOR_PALETTE,
            title='Accent Color Compliance',
            description='Validates use of official TerraFusion accent color #00ffaa',
            validation_method='css_color_analysis',
            expected_values=['#00ffaa', 'rgb(0, 255, 170)', 'var(--tf-accent)'],
            critical=True,
            weight=2.0
        )
        
        self.validation_rules['color_transcend'] = BrandValidationRule(
            rule_id='color_transcend',
            element=BrandElement.COLOR_PALETTE,
            title='Transcendence Color Usage',
            description='Validates proper use of transcendence color #00ffee for special elements',
            validation_method='css_color_analysis',
            expected_values=['#00ffee', 'rgb(0, 255, 238)', 'var(--tf-transcend)'],
            critical=False,
            weight=1.5
        )
        
        # Typography Rules
        self.validation_rules['font_primary'] = BrandValidationRule(
            rule_id='font_primary',
            element=BrandElement.TYPOGRAPHY,
            title='Primary Font Family',
            description='Validates use of official TerraFusion font stack',
            validation_method='css_font_analysis',
            expected_values=['Segoe UI', 'system-ui', 'var(--tf-font-primary)'],
            critical=True,
            weight=1.5
        )
        
        # Microcopy Rules
        self.validation_rules['microcopy_loading'] = BrandValidationRule(
            rule_id='microcopy_loading',
            element=BrandElement.MICROCOPY,
            title='Loading Message Compliance',
            description='Validates use of official TerraFusion loading messages',
            validation_method='text_content_analysis',
            expected_values=self.brand_standard.loading_messages,
            critical=False,
            weight=1.0
        )
        
        self.validation_rules['microcopy_confirmation'] = BrandValidationRule(
            rule_id='microcopy_confirmation',
            element=BrandElement.MICROCOPY,
            title='Confirmation Message Compliance',
            description='Validates use of official TerraFusion confirmation messages',
            validation_method='text_content_analysis',
            expected_values=self.brand_standard.confirmation_messages,
            critical=False,
            weight=1.0
        )
        
        # Visual Effects Rules
        self.validation_rules['transcendence_glow'] = BrandValidationRule(
            rule_id='transcendence_glow',
            element=BrandElement.VISUAL_EFFECTS,
            title='Transcendence Glow Effect',
            description='Validates proper implementation of transcendence glow effects',
            validation_method='css_effect_analysis',
            expected_values=['box-shadow.*rgba\\(0, 153, 255', 'filter.*drop-shadow'],
            critical=False,
            weight=1.0
        )
        
        # PWA Compliance Rules
        self.validation_rules['pwa_manifest'] = BrandValidationRule(
            rule_id='pwa_manifest',
            element=BrandElement.PWA_COMPLIANCE,
            title='PWA Manifest Compliance',
            description='Validates PWA manifest includes TerraFusion branding',
            validation_method='manifest_analysis',
            expected_values=['TerraFusion', 'Government. Transcended.'],
            critical=True,
            weight=2.0
        )
        
        # Layout Structure Rules
        self.validation_rules['header_structure'] = BrandValidationRule(
            rule_id='header_structure',
            element=BrandElement.LAYOUT_STRUCTURE,
            title='Header Layout Compliance',
            description='Validates header follows TerraFusion layout standards',
            validation_method='html_structure_analysis',
            expected_values=['app-header', 'header-left', 'header-center', 'header-right'],
            critical=True,
            weight=1.5
        )
        
        # Component Design Rules
        self.validation_rules['button_design'] = BrandValidationRule(
            rule_id='button_design',
            element=BrandElement.COMPONENT_DESIGN,
            title='Button Design Compliance',
            description='Validates buttons follow TerraFusion design standards',
            validation_method='component_analysis',
            expected_values=['tf-btn', 'tf-btn-primary', 'tf-btn-accent'],
            critical=True,
            weight=1.5
        )
        
    def load_brand_assets(self):
        """Load official TerraFusion brand assets"""
        try:
            # Load brand configuration
            brand_config_path = self.brand_assets_dir / 'tf-brand-config.json'
            if brand_config_path.exists():
                with open(brand_config_path, 'r') as f:
                    self.brand_config = json.load(f)
                self.logger.info("Loaded brand configuration")
            
            # Load brand CSS
            brand_css_path = self.brand_assets_dir / 'tf-pwa-css.css'
            if brand_css_path.exists():
                with open(brand_css_path, 'r') as f:
                    self.brand_css = f.read()
                self.logger.info("Loaded brand CSS template")
                
            # Load PWA template
            pwa_template_path = self.brand_assets_dir / 'tf-pwa-index.html'
            if pwa_template_path.exists():
                with open(pwa_template_path, 'r') as f:
                    self.pwa_template = f.read()
                self.logger.info("Loaded PWA template")
                
        except Exception as e:
            self.logger.error(f"Error loading brand assets: {e}")
    
    async def run_comprehensive_brand_audit(self):
        """Run comprehensive brand compliance audit across all modules"""
        print("🎨 Starting TerraFusion Brand Compliance Audit...")
        print("🚀 Validating 'Transcendence DNA' Implementation")
        print("=" * 80)
        
        audit_results = {
            'total_modules': 0,
            'compliant_modules': 0,
            'partially_compliant_modules': 0,
            'non_compliant_modules': 0,
            'overall_brand_score': 0,
            'critical_violations': 0,
            'module_assessments': [],
            'recommendations': []
        }
        
        # 1. Discover all modules
        modules = await self.discover_modules()
        print(f"📦 Discovered {len(modules)} modules for brand compliance audit")
        
        # 2. Audit each module
        for module in modules:
            print(f"\n🔍 Auditing module: {module['name']}")
            assessment = await self.audit_module_brand_compliance(module)
            audit_results['module_assessments'].append(assessment)
            
            # Update counters
            if assessment.compliance_level == BrandComplianceLevel.TRANSCENDENCE_CERTIFIED:
                audit_results['compliant_modules'] += 1
            elif assessment.compliance_level in [BrandComplianceLevel.FULLY_COMPLIANT, BrandComplianceLevel.SUBSTANTIALLY_COMPLIANT]:
                audit_results['partially_compliant_modules'] += 1
            else:
                audit_results['non_compliant_modules'] += 1
                
            # Count critical violations
            critical_violations = [v for v in assessment.violations if 'CRITICAL' in v]
            audit_results['critical_violations'] += len(critical_violations)
        
        # 3. Calculate overall metrics
        audit_results['total_modules'] = len(modules)
        if audit_results['total_modules'] > 0:
            total_score = sum(a.overall_score for a in audit_results['module_assessments'])
            audit_results['overall_brand_score'] = total_score / audit_results['total_modules']
        
        # 4. Generate system-wide recommendations
        audit_results['recommendations'] = await self.generate_system_recommendations(audit_results)
        
        # 5. Save comprehensive results
        await self.save_brand_audit_results(audit_results)
        
        # 6. Generate brand compliance report
        await self.generate_brand_compliance_report(audit_results)
        
        return audit_results
    
    async def discover_modules(self):
        """Discover all TerraFusion modules for brand compliance audit"""
        modules = []
        
        # Core modules discovery
        if self.modules_dir.exists():
            for module_dir in self.modules_dir.iterdir():
                if module_dir.is_dir() and not module_dir.name.startswith('.'):
                    module_info = {
                        'name': module_dir.name,
                        'path': str(module_dir),
                        'type': await self.determine_module_type(module_dir)
                    }
                    modules.append(module_info)
        
        # Additional module locations
        additional_paths = [
            self.project_root / 'apps',
            self.project_root / 'frontend' / 'modules',
            self.project_root / 'backend' / 'modules'
        ]
        
        for path in additional_paths:
            if path.exists():
                for module_dir in path.iterdir():
                    if module_dir.is_dir() and not module_dir.name.startswith('.'):
                        module_info = {
                            'name': f"{path.name}_{module_dir.name}",
                            'path': str(module_dir),
                            'type': await self.determine_module_type(module_dir)
                        }
                        modules.append(module_info)
        
        return modules
    
    async def determine_module_type(self, module_dir):
        """Determine the type/tier of a module"""
        module_name = module_dir.name.lower()
        
        # Tier 1 - Core Government Modules
        tier1_modules = ['ai-swarm', 'government-edition', 'costforge-ai', 'terra-fusion-sync']
        if any(t1 in module_name for t1 in tier1_modules):
            return ModuleType.TIER_1_MODULE
            
        # Tier 2 - Essential Operations
        tier2_modules = ['terra-collections', 'unified-system', 'gispro', 'terra-flow']
        if any(t2 in module_name for t2 in tier2_modules):
            return ModuleType.TIER_2_MODULE
            
        # Tier 3 - Extended Features
        tier3_modules = ['commercial-suite', 'shock-and-awe', 'advanced-analytics']
        if any(t3 in module_name for t3 in tier3_modules):
            return ModuleType.TIER_3_MODULE
            
        # Core modules
        core_modules = ['core', 'kernel', 'shell', 'api']
        if any(core in module_name for core in core_modules):
            return ModuleType.CORE_MODULE
            
        return ModuleType.EXTERNAL_MODULE
    
    async def audit_module_brand_compliance(self, module):
        """Audit individual module for brand compliance"""
        module_path = Path(module['path'])
        assessment = ModuleBrandAssessment(
            module_name=module['name'],
            module_type=module['type'],
            module_path=module['path'],
            compliance_level=BrandComplianceLevel.NON_COMPLIANT,
            overall_score=0.0,
            element_scores={},
            violations=[],
            recommendations=[],
            assessed_at=datetime.now(),
            next_assessment_due=datetime.now() + timedelta(days=30)
        )
        
        # Find relevant files for brand compliance audit
        html_files = list(module_path.glob('**/*.html'))
        css_files = list(module_path.glob('**/*.css'))
        js_files = list(module_path.glob('**/*.js'))
        json_files = list(module_path.glob('**/*.json'))
        
        total_score = 0.0
        total_weight = 0.0
        
        # Audit each brand element
        for rule_id, rule in self.validation_rules.items():
            element_score = await self.validate_brand_element(
                rule, html_files, css_files, js_files, json_files
            )
            
            assessment.element_scores[rule_id] = element_score
            total_score += element_score * rule.weight
            total_weight += rule.weight
            
            # Check for violations
            if element_score < 50.0 and rule.critical:
                assessment.violations.append(f"CRITICAL: {rule.title} - Score: {element_score:.1f}%")
            elif element_score < 70.0:
                assessment.violations.append(f"WARNING: {rule.title} - Score: {element_score:.1f}%")
        
        # Calculate overall score
        if total_weight > 0:
            assessment.overall_score = total_score / total_weight
        
        # Determine compliance level
        if assessment.overall_score >= 95.0 and len([v for v in assessment.violations if 'CRITICAL' in v]) == 0:
            assessment.compliance_level = BrandComplianceLevel.TRANSCENDENCE_CERTIFIED
        elif assessment.overall_score >= 85.0:
            assessment.compliance_level = BrandComplianceLevel.FULLY_COMPLIANT
        elif assessment.overall_score >= 70.0:
            assessment.compliance_level = BrandComplianceLevel.SUBSTANTIALLY_COMPLIANT
        elif assessment.overall_score >= 50.0:
            assessment.compliance_level = BrandComplianceLevel.PARTIALLY_COMPLIANT
        else:
            assessment.compliance_level = BrandComplianceLevel.NON_COMPLIANT
        
        # Generate recommendations
        assessment.recommendations = await self.generate_module_recommendations(assessment)
        
        return assessment
    
    async def validate_brand_element(self, rule, html_files, css_files, js_files, json_files):
        """Validate specific brand element according to rule"""
        score = 0.0
        
        try:
            if rule.validation_method == 'css_color_analysis':
                score = await self.validate_css_colors(rule, css_files)
            elif rule.validation_method == 'css_font_analysis':
                score = await self.validate_css_fonts(rule, css_files)
            elif rule.validation_method == 'text_content_analysis':
                score = await self.validate_text_content(rule, html_files, js_files)
            elif rule.validation_method == 'css_effect_analysis':
                score = await self.validate_css_effects(rule, css_files)
            elif rule.validation_method == 'manifest_analysis':
                score = await self.validate_manifests(rule, json_files)
            elif rule.validation_method == 'html_structure_analysis':
                score = await self.validate_html_structure(rule, html_files)
            elif rule.validation_method == 'component_analysis':
                score = await self.validate_components(rule, html_files, css_files)
        except Exception as e:
            self.logger.error(f"Error validating {rule.rule_id}: {e}")
            score = 0.0
        
        return min(100.0, max(0.0, score))
    
    async def validate_css_colors(self, rule, css_files):
        """Validate CSS color usage"""
        if not css_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for css_file in css_files:
            try:
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_content = f.read()
                
                file_score = 0.0
                for expected_value in rule.expected_values:
                    if expected_value.lower() in css_content.lower():
                        file_score += 20.0  # Up to 100% if all expected values found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not read CSS file {css_file}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def validate_css_fonts(self, rule, css_files):
        """Validate CSS font usage"""
        if not css_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for css_file in css_files:
            try:
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_content = f.read()
                
                file_score = 0.0
                for expected_value in rule.expected_values:
                    if expected_value in css_content:
                        file_score += 33.33  # Up to 100% if all expected values found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not read CSS file {css_file}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def validate_text_content(self, rule, html_files, js_files):
        """Validate text content and microcopy"""
        all_files = html_files + js_files
        if not all_files:
            return 0.0
        
        total_score = 0.0
        matches_found = 0
        
        for file_path in all_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                for expected_value in rule.expected_values:
                    if expected_value in content:
                        matches_found += 1
                        total_score += 10.0  # Each match adds to score
                        
            except Exception as e:
                self.logger.warning(f"Could not read file {file_path}: {e}")
        
        # Score based on how many expected messages were found
        expected_count = len(rule.expected_values)
        if expected_count > 0:
            coverage_ratio = min(1.0, matches_found / expected_count)
            return coverage_ratio * 100.0
        
        return 0.0
    
    async def validate_css_effects(self, rule, css_files):
        """Validate CSS visual effects"""
        if not css_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for css_file in css_files:
            try:
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_content = f.read()
                
                file_score = 0.0
                for expected_pattern in rule.expected_values:
                    if re.search(expected_pattern, css_content, re.IGNORECASE):
                        file_score += 50.0  # Each effect pattern found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not read CSS file {css_file}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def validate_manifests(self, rule, json_files):
        """Validate PWA manifests and configuration files"""
        manifest_files = [f for f in json_files if 'manifest' in f.name.lower()]
        
        if not manifest_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for manifest_file in manifest_files:
            try:
                with open(manifest_file, 'r', encoding='utf-8') as f:
                    manifest_content = f.read()
                
                file_score = 0.0
                for expected_value in rule.expected_values:
                    if expected_value in manifest_content:
                        file_score += 50.0  # Each expected value found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not read manifest file {manifest_file}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def validate_html_structure(self, rule, html_files):
        """Validate HTML structure compliance"""
        if not html_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                soup = BeautifulSoup(html_content, 'html.parser')
                file_score = 0.0
                
                for expected_class in rule.expected_values:
                    elements = soup.find_all(class_=expected_class)
                    if elements:
                        file_score += 25.0  # Each expected structure element found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not parse HTML file {html_file}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def validate_components(self, rule, html_files, css_files):
        """Validate component design compliance"""
        all_files = html_files + css_files
        if not all_files:
            return 0.0
        
        total_score = 0.0
        file_count = 0
        
        for file_path in all_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                file_score = 0.0
                for expected_class in rule.expected_values:
                    if expected_class in content:
                        file_score += 33.33  # Each expected component class found
                
                total_score += min(100.0, file_score)
                file_count += 1
                
            except Exception as e:
                self.logger.warning(f"Could not read file {file_path}: {e}")
        
        return total_score / file_count if file_count > 0 else 0.0
    
    async def generate_module_recommendations(self, assessment):
        """Generate recommendations for improving module brand compliance"""
        recommendations = []
        
        # Critical violations
        critical_violations = [v for v in assessment.violations if 'CRITICAL' in v]
        if critical_violations:
            recommendations.append("🚨 URGENT: Address critical brand violations immediately")
            recommendations.append("📘 Reference: /Brand_Assets/tf-brand-guidelines.md")
            recommendations.append("🎨 Template: /Brand_Assets/tf-pwa-index.html")
        
        # Low scores in specific areas
        for element, score in assessment.element_scores.items():
            if score < 50.0:
                if 'color' in element:
                    recommendations.append(f"🎨 Implement official TerraFusion color palette for {element}")
                elif 'font' in element:
                    recommendations.append(f"📝 Apply official TerraFusion typography standards for {element}")
                elif 'microcopy' in element:
                    recommendations.append(f"💬 Use official TerraFusion microcopy messages for {element}")
                elif 'pwa' in element:
                    recommendations.append(f"📱 Ensure PWA compliance with TerraFusion standards for {element}")
        
        # Overall compliance level recommendations
        if assessment.compliance_level == BrandComplianceLevel.NON_COMPLIANT:
            recommendations.append("🔄 Complete brand overhaul required - implement TerraFusion Transcendence DNA")
        elif assessment.compliance_level == BrandComplianceLevel.PARTIALLY_COMPLIANT:
            recommendations.append("⚡ Enhance brand consistency - focus on critical elements first")
        elif assessment.compliance_level == BrandComplianceLevel.SUBSTANTIALLY_COMPLIANT:
            recommendations.append("✨ Minor adjustments needed for full Transcendence certification")
        
        return recommendations
    
    async def generate_system_recommendations(self, audit_results):
        """Generate system-wide brand compliance recommendations"""
        recommendations = []
        
        total_modules = audit_results['total_modules']
        compliant_ratio = audit_results['compliant_modules'] / total_modules if total_modules > 0 else 0
        
        if compliant_ratio < 0.3:
            recommendations.append("🚨 CRITICAL: System-wide brand implementation required")
            recommendations.append("📋 Priority: Implement TerraFusion brand assets across all modules")
            recommendations.append("🎯 Target: Achieve 80%+ module compliance within 30 days")
        elif compliant_ratio < 0.7:
            recommendations.append("⚡ Accelerate brand compliance implementation")
            recommendations.append("🔄 Focus on Tier 1 and Core modules first")
        else:
            recommendations.append("🎉 Excellent brand compliance - maintain standards")
            recommendations.append("🚀 Optimize remaining modules for Transcendence certification")
        
        if audit_results['critical_violations'] > 0:
            recommendations.append(f"⚠️  Address {audit_results['critical_violations']} critical brand violations")
        
        recommendations.append("📊 Establish continuous brand compliance monitoring")
        recommendations.append("🎓 Provide team training on TerraFusion Transcendence DNA")
        
        return recommendations
    
    async def save_brand_audit_results(self, audit_results):
        """Save brand audit results to database"""
        try:
            cur = self.db_conn.cursor()
            
            for assessment in audit_results['module_assessments']:
                cur.execute("""
                    INSERT INTO module_brand_assessments 
                    (module_name, module_type, module_path, compliance_level, overall_score, 
                     element_scores, violations, recommendations, assessed_at, next_assessment_due)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (module_name) DO UPDATE SET
                        compliance_level = EXCLUDED.compliance_level,
                        overall_score = EXCLUDED.overall_score,
                        element_scores = EXCLUDED.element_scores,
                        violations = EXCLUDED.violations,
                        recommendations = EXCLUDED.recommendations,
                        assessed_at = EXCLUDED.assessed_at,
                        next_assessment_due = EXCLUDED.next_assessment_due
                """, (
                    assessment.module_name,
                    assessment.module_type.value,
                    assessment.module_path,
                    assessment.compliance_level.value,
                    assessment.overall_score,
                    json.dumps(assessment.element_scores),
                    json.dumps(assessment.violations),
                    json.dumps(assessment.recommendations),
                    assessment.assessed_at,
                    assessment.next_assessment_due
                ))
                
                # Save to history
                cur.execute("""
                    INSERT INTO brand_compliance_history 
                    (session_id, module_name, compliance_level, score, violations_count, assessed_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    self.session_id,
                    assessment.module_name,
                    assessment.compliance_level.value,
                    assessment.overall_score,
                    len(assessment.violations),
                    assessment.assessed_at
                ))
            
            self.db_conn.commit()
            cur.close()
            
        except Exception as e:
            self.logger.error(f"Error saving brand audit results: {e}")
    
    async def generate_brand_compliance_report(self, audit_results):
        """Generate comprehensive brand compliance report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = self.reports_dir / f"terrafusion_brand_compliance_report_{timestamp}.md"
        
        try:
            with open(report_path, 'w') as f:
                f.write("# TerraFusion Brand Compliance Report\n\n")
                f.write("## Executive Summary\n\n")
                f.write(f"**Assessment Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"**Session ID:** {self.session_id}\n")
                f.write(f"**Total Modules Audited:** {audit_results['total_modules']}\n")
                f.write(f"**Overall Brand Score:** {audit_results['overall_brand_score']:.1f}%\n\n")
                
                f.write("### Compliance Distribution\n\n")
                f.write(f"- ✅ **Transcendence Certified:** {audit_results['compliant_modules']} modules\n")
                f.write(f"- ⚡ **Partially Compliant:** {audit_results['partially_compliant_modules']} modules\n")
                f.write(f"- ❌ **Non-Compliant:** {audit_results['non_compliant_modules']} modules\n")
                f.write(f"- 🚨 **Critical Violations:** {audit_results['critical_violations']}\n\n")
                
                f.write("## Module Assessment Details\n\n")
                for assessment in audit_results['module_assessments']:
                    f.write(f"### {assessment.module_name}\n\n")
                    f.write(f"- **Type:** {assessment.module_type.value}\n")
                    f.write(f"- **Compliance Level:** {assessment.compliance_level.value}\n")
                    f.write(f"- **Overall Score:** {assessment.overall_score:.1f}%\n")
                    f.write(f"- **Violations:** {len(assessment.violations)}\n")
                    f.write(f"- **Path:** `{assessment.module_path}`\n\n")
                    
                    if assessment.violations:
                        f.write("**Violations:**\n")
                        for violation in assessment.violations:
                            f.write(f"- {violation}\n")
                        f.write("\n")
                    
                    if assessment.recommendations:
                        f.write("**Recommendations:**\n")
                        for rec in assessment.recommendations:
                            f.write(f"- {rec}\n")
                        f.write("\n")
                
                f.write("## System-Wide Recommendations\n\n")
                for rec in audit_results['recommendations']:
                    f.write(f"- {rec}\n")
                
                f.write("\n## TerraFusion Brand Standards Reference\n\n")
                f.write("### Official Brand Elements\n\n")
                f.write(f"- **Essence:** {self.brand_standard.essence}\n")
                f.write(f"- **Tagline:** {self.brand_standard.tagline}\n")
                f.write(f"- **Slogan:** {self.brand_standard.slogan}\n")
                f.write(f"- **Motto:** {self.brand_standard.motto}\n\n")
                
                f.write("### Color Palette\n\n")
                f.write(f"- **Primary:** {self.brand_standard.primary_color}\n")
                f.write(f"- **Accent:** {self.brand_standard.accent_color}\n")
                f.write(f"- **Transcend:** {self.brand_standard.transcend_color}\n")
                f.write(f"- **Dark:** {self.brand_standard.dark_color}\n\n")
                
                f.write("### Implementation Resources\n\n")
                f.write("- 📘 **Brand Guidelines:** `/Brand_Assets/tf-brand-guidelines.md`\n")
                f.write("- 🎨 **CSS Template:** `/Brand_Assets/tf-pwa-css.css`\n")
                f.write("- 📱 **PWA Template:** `/Brand_Assets/tf-pwa-index.html`\n")
                f.write("- ⚙️  **Brand Config:** `/Brand_Assets/tf-brand-config.json`\n")
                
            print(f"📊 Brand compliance report generated: {report_path}")
            
        except Exception as e:
            self.logger.error(f"Error generating brand compliance report: {e}")

async def main():
    """Main execution function"""
    try:
        system = TerraFusionBrandComplianceSystem()
        audit_results = await system.run_comprehensive_brand_audit()
        
        print("\n" + "=" * 80)
        print("🎨 TERRAFUSION BRAND COMPLIANCE AUDIT COMPLETE")
        print("=" * 80)
        print(f"📊 Overall Brand Score: {audit_results['overall_brand_score']:.1f}%")
        print(f"✅ Compliant Modules: {audit_results['compliant_modules']}")
        print(f"⚡ Partially Compliant: {audit_results['partially_compliant_modules']}")
        print(f"❌ Non-Compliant: {audit_results['non_compliant_modules']}")
        print(f"🚨 Critical Violations: {audit_results['critical_violations']}")
        
        if audit_results['overall_brand_score'] >= 90.0:
            print("\n🚀 TRANSCENDENCE STATUS: Government. Transcended.")
        elif audit_results['overall_brand_score'] >= 75.0:
            print("\n⚡ STATUS: Approaching Transcendence")
        else:
            print("\n🔄 STATUS: Brand Implementation Required")
            
        print("\n📋 Next Steps:")
        for rec in audit_results['recommendations'][:5]:  # Show top 5 recommendations
            print(f"  • {rec}")
            
    except Exception as e:
        print(f"❌ Brand compliance audit failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)