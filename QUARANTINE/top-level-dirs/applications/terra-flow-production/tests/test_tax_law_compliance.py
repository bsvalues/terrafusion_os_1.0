"""
Unit tests for TaxLawComplianceAgent compliance checks

This module contains comprehensive tests for the tax law compliance checking
functionality implemented in the TaxLawComplianceAgent.
"""

import unittest
import datetime
import sys
import os
from typing import Dict, Any
from unittest.mock import patch, MagicMock

# Add the project root to the path so we can import the modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the agent
from mcp.agents.tax_law_compliance_agent import TaxLawComplianceAgent

class TestTaxLawComplianceChecks(unittest.TestCase):
    """Test suite for TaxLawComplianceAgent compliance checks"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create the agent
        self.agent = TaxLawComplianceAgent()
        
        # Test property data with compliant values
        self.compliant_property = {
            "property_id": "TEST-12345",
            "assessed_value": 250000,
            "market_value": 250000,  # 1.0 ratio
            "classification": "residential",
            "property_type": "single_family",
            "building_type": "single_family",
            "land_area": 8000,
            "land_area_unit": "sqft",
            "building_area": 2000,
            "zoning": "R1",
            "use_code": "101",
            "has_residence": True,
            "agricultural_use": False,
            "timber_use": False,
            "historic_designation": False,
            "exemptions": [],
            "last_valuation_date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "last_inspection_date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "assessment_year": datetime.datetime.now().year,
            "current_use": False,
            "documentation": ["valuation_worksheet", "property_characteristics", "sales_data"]
        }
        
        # Non-compliant property for testing failure cases
        self.non_compliant_property = {
            "property_id": "TEST-54321",
            "assessed_value": 200000,
            "market_value": 250000,  # 0.8 ratio
            "classification": "commercial",  # Mismatch with building_type
            "property_type": "residential",
            "building_type": "single_family", 
            "land_area": 8000,
            "land_area_unit": "sqft",
            "zoning": "R1",
            "use_code": "101",
            "has_residence": True,
            "agricultural_use": False,
            "timber_use": False,
            "historic_designation": False,
            "exemptions": [
                {
                    "type": "senior_disabled",
                    "year": datetime.datetime.now().year,
                    "amount": 50000,
                    "documents": []  # Missing required documents
                }
            ],
            "last_valuation_date": (datetime.datetime.now() - datetime.timedelta(days=750)).strftime("%Y-%m-%d"),  # 2 years old
            "last_inspection_date": (datetime.datetime.now() - datetime.timedelta(days=2500)).strftime("%Y-%m-%d"),  # 7 years old
            "assessment_year": datetime.datetime.now().year,
            "current_use": False,
            "documentation": []  # Missing documentation
        }
    
    def test_assessment_ratio_compliance(self):
        """Test assessment ratio compliance check for compliant property"""
        result = self.agent._check_assessment_ratio(self.compliant_property)
        self.assertTrue(result["compliant"])
        self.assertAlmostEqual(result["actual_ratio"], 1.0)
    
    def test_assessment_ratio_non_compliance(self):
        """Test assessment ratio compliance check for non-compliant property"""
        result = self.agent._check_assessment_ratio(self.non_compliant_property)
        self.assertFalse(result["compliant"])
        self.assertAlmostEqual(result["actual_ratio"], 0.8)
    
    def test_property_classification_compliance(self):
        """Test property classification compliance check for compliant property"""
        result = self.agent._check_property_classification(self.compliant_property)
        self.assertTrue(result["compliant"])
    
    def test_property_classification_non_compliance(self):
        """Test property classification compliance check for non-compliant property"""
        result = self.agent._check_property_classification(self.non_compliant_property)
        self.assertFalse(result["compliant"])
        self.assertEqual(result["classification"], "commercial")
        self.assertEqual(result["expected_classification"], "Residential")
        
    def test_exemption_compliance_no_exemptions(self):
        """Test exemption compliance when no exemptions are present"""
        result = self.agent._check_exemption_compliance(self.compliant_property)
        self.assertTrue(result["compliant"])
        
    def test_exemption_compliance_with_issues(self):
        """Test exemption compliance with issues"""
        # Add the required criterion fields for senior_disabled
        self.non_compliant_property["owner_age"] = 65
        self.non_compliant_property["income"] = 35000
        self.non_compliant_property["primary_residence"] = True
        self.non_compliant_property["ownership_years"] = 5
        
        result = self.agent._check_exemption_compliance(self.non_compliant_property)
        self.assertFalse(result["compliant"])
        
    def test_annual_revaluation_compliance(self):
        """Test annual revaluation compliance for compliant property"""
        result = self.agent._check_annual_revaluation_compliance(self.compliant_property)
        self.assertTrue(result["compliant"])
        
    def test_annual_revaluation_non_compliance(self):
        """Test annual revaluation compliance for non-compliant property"""
        result = self.agent._check_annual_revaluation_compliance(self.non_compliant_property)
        self.assertFalse(result["compliant"])
        
    def test_full_compliance_check_compliant(self):
        """Test full compliance check for compliant property"""
        result = self.agent._process_compliance_check({"assessment_data": self.compliant_property})
        self.assertEqual(result["status"], "success")
        self.assertTrue(result["compliant"])
        self.assertEqual(len(result["issues"]), 0)
        
    def test_full_compliance_check_non_compliant(self):
        """Test full compliance check for non-compliant property"""
        result = self.agent._process_compliance_check({"assessment_data": self.non_compliant_property})
        self.assertEqual(result["status"], "success")
        self.assertFalse(result["compliant"])
        self.assertTrue(len(result["issues"]) > 0)
        
    def test_edge_case_missing_market_value(self):
        """Test edge case with missing market value"""
        property_data = self.compliant_property.copy()
        property_data["market_value"] = 0
        result = self.agent._check_assessment_ratio(property_data)
        self.assertFalse(result["compliant"])
        self.assertEqual(result["severity"], "high")
        
    def test_edge_case_special_valuation(self):
        """Test edge case with special valuation method"""
        property_data = self.compliant_property.copy()
        property_data["assessed_value"] = 100000  # Intentionally different from market value
        property_data["market_value"] = 250000
        property_data["valuation_method"] = "current_use"
        result = self.agent._check_assessment_ratio(property_data)
        self.assertTrue(result["compliant"])  # Should be compliant due to special method
        
    def test_edge_case_no_valuation_date(self):
        """Test edge case with no valuation date"""
        property_data = self.compliant_property.copy()
        property_data.pop("last_valuation_date")
        property_data.pop("last_inspection_date", None)
        result = self.agent._check_annual_revaluation_compliance(property_data)
        self.assertFalse(result["compliant"])
        self.assertEqual(result["severity"], "high")

if __name__ == '__main__':
    unittest.main()