#!/usr/bin/env python3
"""
TerraFusion Enhanced Cost Calculation Engine
Marshall & Swift Methodology Implementation
Benton County Specific Factors - 2025
"""

import json
import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class EnhancedCostEngine:
    """
    Advanced cost calculation engine implementing Marshall & Swift methodology
    with Benton County specific regional factors and AI enhancements
    """
    
    def __init__(self):
        self.load_cost_factors()
        self.current_year = datetime.now().year
        
    def load_cost_factors(self):
        """Load cost factors from JSON configuration"""
        try:
            with open('data/factors-2025.json', 'r') as f:
                self.factors = json.load(f)
            logger.info("Cost factors loaded successfully")
        except FileNotFoundError:
            logger.warning("Cost factors file not found, using defaults")
            self.factors = self._get_default_factors()
    
    def _get_default_factors(self) -> Dict:
        """Default cost factors if file not available"""
        return {
            "version": "2025.1",
            "factors": {
                "buildingTypes": [
                    {"code": "RES", "name": "Residential", "baseCost": 285.00},
                    {"code": "COM", "name": "Commercial", "baseCost": 320.00},
                    {"code": "IND", "name": "Industrial", "baseCost": 180.00},
                    {"code": "AGR", "name": "Agricultural", "baseCost": 120.00},
                    {"code": "MUL", "name": "Multi-family", "baseCost": 260.00}
                ],
                "regions": [
                    {"code": "BC-NORTH", "name": "North Benton County", "factor": 1.10},
                    {"code": "BC-CENTRAL", "name": "Central Benton County", "factor": 1.00},
                    {"code": "BC-SOUTH", "name": "South Benton County", "factor": 0.95}
                ],
                "quality": [
                    {"level": "ECONOMY", "factor": 0.85},
                    {"level": "STANDARD", "factor": 1.00},
                    {"level": "CUSTOM", "factor": 1.15},
                    {"level": "PREMIUM", "factor": 1.30},
                    {"level": "LUXURY", "factor": 1.50}
                ],
                "condition": [
                    {"level": "POOR", "factor": 0.70},
                    {"level": "FAIR", "factor": 0.85},
                    {"level": "AVERAGE", "factor": 1.00},
                    {"level": "GOOD", "factor": 1.10},
                    {"level": "EXCELLENT", "factor": 1.20}
                ],
                "age": [
                    {"range": "0-5", "factor": 1.00},
                    {"range": "6-10", "factor": 0.95},
                    {"range": "11-20", "factor": 0.90},
                    {"range": "21-30", "factor": 0.85},
                    {"range": "31-50", "factor": 0.80},
                    {"range": "51+", "factor": 0.75}
                ]
            }
        }
    
    def calculate_replacement_cost_new(self, property_data: Dict) -> Dict:
        """
        Calculate Replacement Cost New (RCN) using enhanced Marshall & Swift methodology
        
        Args:
            property_data: Dictionary containing property characteristics
            
        Returns:
            Dictionary with detailed cost breakdown and final RCN value
        """
        try:
            # Extract property characteristics
            building_type = property_data.get('building_type', 'RES')
            square_footage = float(property_data.get('square_footage', 0))
            year_built = int(property_data.get('year_built', 2000))
            region = property_data.get('region', 'BC-CENTRAL')
            quality = property_data.get('quality', 'STANDARD')
            condition = property_data.get('condition', 'AVERAGE')
            complexity = property_data.get('complexity', 'STANDARD')
            
            # Step 1: Get base cost per square foot
            base_cost_psf = self._get_base_cost(building_type)
            base_cost_total = base_cost_psf * square_footage
            
            # Step 2: Apply regional factor
            regional_factor = self._get_regional_factor(region)
            regional_adjusted_cost = base_cost_total * regional_factor
            
            # Step 3: Apply quality factor
            quality_factor = self._get_quality_factor(quality)
            quality_adjusted_cost = regional_adjusted_cost * quality_factor
            
            # Step 4: Apply complexity factor
            complexity_factor = self._get_complexity_factor(complexity)
            complexity_adjusted_cost = quality_adjusted_cost * complexity_factor
            
            # Step 5: Apply condition factor
            condition_factor = self._get_condition_factor(condition)
            condition_adjusted_cost = complexity_adjusted_cost * condition_factor
            
            # Step 6: Apply age depreciation
            age_factor = self._get_age_factor(year_built)
            final_rcn = condition_adjusted_cost * age_factor
            
            # Step 7: Calculate confidence score
            confidence_score = self._calculate_confidence_score(property_data)
            
            # Detailed breakdown
            breakdown = {
                'base_cost_psf': round(base_cost_psf, 2),
                'base_cost_total': round(base_cost_total, 2),
                'regional_factor': round(regional_factor, 3),
                'regional_adjusted_cost': round(regional_adjusted_cost, 2),
                'quality_factor': round(quality_factor, 3),
                'quality_adjusted_cost': round(quality_adjusted_cost, 2),
                'complexity_factor': round(complexity_factor, 3),
                'complexity_adjusted_cost': round(complexity_adjusted_cost, 2),
                'condition_factor': round(condition_factor, 3),
                'condition_adjusted_cost': round(condition_adjusted_cost, 2),
                'age_factor': round(age_factor, 3),
                'final_rcn': round(final_rcn, 2),
                'confidence_score': round(confidence_score, 1)
            }
            
            return {
                'success': True,
                'replacement_cost_new': round(final_rcn, 2),
                'cost_per_sqft': round(final_rcn / square_footage, 2),
                'breakdown': breakdown,
                'methodology': 'Enhanced Marshall & Swift with Benton County Factors',
                'calculation_date': datetime.now().isoformat(),
                'factors_version': self.factors.get('version', '2025.1')
            }
            
        except Exception as e:
            logger.error(f"Error calculating RCN: {e}")
            return {
                'success': False,
                'error': str(e),
                'replacement_cost_new': 0
            }
    
    def _get_base_cost(self, building_type: str) -> float:
        """Get base cost per square foot for building type"""
        for bt in self.factors['factors']['buildingTypes']:
            if bt['code'] == building_type:
                return bt['baseCost']
        return 285.00  # Default residential
    
    def _get_regional_factor(self, region: str) -> float:
        """Get regional adjustment factor"""
        for r in self.factors['factors']['regions']:
            if r['code'] == region:
                return r['factor']
        return 1.00  # Default central
    
    def _get_quality_factor(self, quality: str) -> float:
        """Get quality adjustment factor"""
        for q in self.factors['factors']['quality']:
            if q['level'] == quality:
                return q['factor']
        return 1.00  # Default standard
    
    def _get_condition_factor(self, condition: str) -> float:
        """Get condition adjustment factor"""
        for c in self.factors['factors']['condition']:
            if c['level'] == condition:
                return c['factor']
        return 1.00  # Default average
    
    def _get_complexity_factor(self, complexity: str) -> float:
        """Get complexity adjustment factor"""
        complexity_factors = {
            'SIMPLE': 0.90,
            'STANDARD': 1.00,
            'MODERATE': 1.10,
            'COMPLEX': 1.25,
            'VERY_COMPLEX': 1.40
        }
        return complexity_factors.get(complexity, 1.00)
    
    def _get_age_factor(self, year_built: int) -> float:
        """Calculate age depreciation factor"""
        age = self.current_year - year_built
        
        for age_range in self.factors['factors']['age']:
            range_str = age_range['range']
            if range_str == '51+':
                if age >= 51:
                    return age_range['factor']
            else:
                min_age, max_age = map(int, range_str.split('-'))
                if min_age <= age <= max_age:
                    return age_range['factor']
        
        return 0.75  # Default for very old buildings
    
    def _calculate_confidence_score(self, property_data: Dict) -> float:
        """Calculate confidence score based on data quality"""
        score = 100.0
        
        # Reduce score for missing data
        required_fields = ['square_footage', 'year_built', 'building_type']
        for field in required_fields:
            if not property_data.get(field):
                score -= 10.0
        
        # Reduce score for very old or unusual properties
        year_built = property_data.get('year_built', 2000)
        age = self.current_year - year_built
        if age > 75:
            score -= 15.0
        elif age > 50:
            score -= 10.0
        
        # Reduce score for very large or small properties
        sqft = property_data.get('square_footage', 0)
        if sqft > 10000 or sqft < 500:
            score -= 10.0
        
        return max(score, 60.0)  # Minimum 60% confidence
    
    def get_comparable_properties(self, property_data: Dict, limit: int = 5) -> List[Dict]:
        """
        Find comparable properties for cost validation
        """
        # This would typically query a database of recent construction
        # For now, return sample comparables
        base_sqft = property_data.get('square_footage', 2000)
        building_type = property_data.get('building_type', 'RES')
        
        comparables = []
        for i in range(limit):
            comp_sqft = base_sqft + (i - 2) * 200  # Vary by +/- 400 sqft
            comp_data = property_data.copy()
            comp_data['square_footage'] = comp_sqft
            
            rcn_result = self.calculate_replacement_cost_new(comp_data)
            
            comparables.append({
                'property_id': f'COMP-{i+1:03d}',
                'square_footage': comp_sqft,
                'replacement_cost_new': rcn_result['replacement_cost_new'],
                'cost_per_sqft': rcn_result['cost_per_sqft'],
                'similarity_score': max(85 - abs(i-2) * 5, 70)
            })
        
        return comparables
    
    def generate_cost_report(self, property_data: Dict) -> Dict:
        """
        Generate comprehensive cost analysis report
        """
        rcn_result = self.calculate_replacement_cost_new(property_data)
        comparables = self.get_comparable_properties(property_data)
        
        # Calculate market statistics
        comp_costs = [c['cost_per_sqft'] for c in comparables]
        avg_cost_psf = sum(comp_costs) / len(comp_costs)
        
        return {
            'property_analysis': rcn_result,
            'comparable_properties': comparables,
            'market_statistics': {
                'average_cost_per_sqft': round(avg_cost_psf, 2),
                'cost_range_low': round(min(comp_costs), 2),
                'cost_range_high': round(max(comp_costs), 2),
                'market_position': 'Average' if abs(rcn_result['cost_per_sqft'] - avg_cost_psf) < 10 else 'Above Average' if rcn_result['cost_per_sqft'] > avg_cost_psf else 'Below Average'
            },
            'report_metadata': {
                'generated_date': datetime.now().isoformat(),
                'methodology': 'Enhanced Marshall & Swift with Benton County Regional Factors',
                'analyst': 'TerraFusion AI Cost Engine',
                'version': self.factors.get('version', '2025.1')
            }
        }

# Initialize global cost engine instance
cost_engine = EnhancedCostEngine()

def calculate_enhanced_rcn(property_data: Dict) -> Dict:
    """Convenience function for external use"""
    return cost_engine.calculate_replacement_cost_new(property_data)

def generate_cost_report(property_data: Dict) -> Dict:
    """Convenience function for generating reports"""
    return cost_engine.generate_cost_report(property_data)

if __name__ == "__main__":
    # Test the cost engine
    test_property = {
        'building_type': 'RES',
        'square_footage': 2500,
        'year_built': 2010,
        'region': 'BC-CENTRAL',
        'quality': 'STANDARD',
        'condition': 'GOOD',
        'complexity': 'STANDARD'
    }
    
    result = calculate_enhanced_rcn(test_property)
    print(json.dumps(result, indent=2))
    
    report = generate_cost_report(test_property)
    print("\nFull Report:")
    print(json.dumps(report, indent=2)) 