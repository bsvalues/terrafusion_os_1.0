"""
Unit tests for PropertyValuationAgent valuation methods

This module contains comprehensive tests for the property valuation functionality
implemented in the PropertyValuationAgent, with a focus on Washington State standards.
"""

import unittest
import datetime
from unittest.mock import patch, MagicMock
from typing import Dict, Any, List

import sys
import os
import logging

# Disable logging for cleaner test output
logging.basicConfig(level=logging.CRITICAL)

# Add the project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.agents.property_valuation_agent import PropertyValuationAgent


class TestPropertyValuationMethods(unittest.TestCase):
    """Test suite for PropertyValuationAgent valuation methods"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a PropertyValuationAgent instance
        self.agent = PropertyValuationAgent()
        
        # Sample subject property for tests
        self.subject_property = {
            "property_id": "SUBJECT001",
            "property_type": "residential",
            "neighborhood": "central_kennewick",
            "building_area": 2000,
            "year_built": 2005,
            "quality_grade": "average",
            "bedrooms": 3,
            "bathrooms": 2,
            "lot_size": 8500,
            "view_type": "none",
            "view_rating": 0,
            "assessment_date": "2025-01-01"
        }
        
        # Sample comparable properties for tests
        self.comparable_properties = [
            {
                "property_id": "COMP001",
                "property_type": "residential",
                "neighborhood": "central_kennewick",
                "building_area": 1900,
                "year_built": 2000,
                "quality_grade": "average",
                "bedrooms": 3,
                "bathrooms": 2,
                "sale_price": 350000,
                "sale_date": "2024-09-15",
                "lot_size": 8000,
                "view_type": "none",
                "view_rating": 0
            },
            {
                "property_id": "COMP002",
                "property_type": "residential",
                "neighborhood": "west_richland",
                "building_area": 2200,
                "year_built": 2008,
                "quality_grade": "good",
                "bedrooms": 4,
                "bathrooms": 2.5,
                "sale_price": 425000,
                "sale_date": "2024-06-22",
                "lot_size": 9500,
                "view_type": "mountain",
                "view_rating": 2
            },
            {
                "property_id": "COMP003",
                "property_type": "residential",
                "neighborhood": "central_pasco",
                "building_area": 1800,
                "year_built": 1995,
                "quality_grade": "average",
                "bedrooms": 3,
                "bathrooms": 1.5,
                "sale_price": 310000,
                "sale_date": "2024-11-05",
                "lot_size": 7200,
                "view_type": "none",
                "view_rating": 0
            }
        ]
        
    def test_neighborhood_adjustment_factor(self):
        """Test neighborhood adjustment factor calculation"""
        # Same neighborhood should have no adjustment
        factor = self.agent._get_neighborhood_adjustment_factor(
            "central_kennewick", "central_kennewick"
        )
        self.assertEqual(factor, 1.0)
        
        # Different neighborhoods should have adjustment based on factors
        factor = self.agent._get_neighborhood_adjustment_factor(
            "central_kennewick", "west_richland"
        )
        self.assertNotEqual(factor, 1.0)
        self.assertLess(factor, 1.0)  # west_richland has higher factor
        
    def test_time_adjustment_factor(self):
        """Test time adjustment factor calculation"""
        assessment_date = datetime.date(2025, 1, 1)
        
        # Recent sale (within 3 months) should have no adjustment
        recent_sale = datetime.date(2024, 11, 15)
        factor = self.agent._get_time_adjustment_factor(assessment_date, recent_sale)
        self.assertEqual(factor, 1.0)
        
        # Older sale should have adjustment
        older_sale = datetime.date(2024, 6, 15)
        factor = self.agent._get_time_adjustment_factor(assessment_date, older_sale)
        self.assertGreater(factor, 1.0)  # Positive time adjustment
        
    def test_view_adjustment_factor(self):
        """Test view adjustment factor calculation"""
        # Same view type and rating should have no adjustment
        subject = {"view_type": "none", "view_rating": 0}
        comp = {"view_type": "none", "view_rating": 0}
        factor = self.agent._get_view_adjustment_factor(subject, comp)
        self.assertEqual(factor, 1.0)
        
        # Different view type should have adjustment
        subject = {"view_type": "mountain", "view_rating": 2}
        comp = {"view_type": "none", "view_rating": 0}
        factor = self.agent._get_view_adjustment_factor(subject, comp)
        self.assertGreater(factor, 1.0)  # Mountain view worth more
        
    @patch('mcp.agents.property_valuation_agent.PropertyValuationAgent._find_comparable_properties')
    def test_sales_comparison_approach(self, mock_find_comps):
        """Test the complete sales comparison approach"""
        # Mock the comparable properties
        mock_find_comps.return_value = self.comparable_properties
        
        # Run the sales comparison approach
        result = self.agent._sales_comparison_approach(self.subject_property)
        
        # Verify the result structure
        self.assertEqual(result["approach"], "sales_comparison")
        self.assertIsNotNone(result["value"])
        self.assertEqual(result["comparable_count"], 3)
        self.assertIsInstance(result["adjusted_comparables"], list)
        self.assertIsInstance(result["confidence_score"], float)
        
        # Check adjustments were applied to comparables
        adjusted_comps = result["adjusted_comparables"]
        for comp in adjusted_comps:
            self.assertIn("adjusted_price", comp)
            self.assertIn("adjustments", comp)
            self.assertIn("total_adjustment", comp)
            self.assertIn("total_adjustment_percent", comp)
            self.assertIn("reliability", comp)
        
    def test_adjust_comparables(self):
        """Test comparable adjustments"""
        adjusted_comps = self.agent._adjust_comparables(
            self.subject_property, self.comparable_properties
        )
        
        # Should have same number of comparables
        self.assertEqual(len(adjusted_comps), len(self.comparable_properties))
        
        # Each comp should have adjustments
        for comp in adjusted_comps:
            self.assertIn("adjusted_price", comp)
            self.assertIn("adjustments", comp)
            
            # Should have adjustment details
            adjustments = comp["adjustments"]
            adjustment_types = [adj["type"] for adj in adjustments]
            
            # Check expected adjustment types based on our test data
            if comp["neighborhood"] != self.subject_property["neighborhood"]:
                self.assertIn("neighborhood", adjustment_types)
                
            if comp["building_area"] != self.subject_property["building_area"]:
                self.assertIn("size", adjustment_types)
                
            if comp["quality_grade"] != self.subject_property["quality_grade"]:
                self.assertIn("quality", adjustment_types)
        
    def test_reconcile_comparable_values(self):
        """Test value reconciliation"""
        # Create sample adjusted comps
        adjusted_comps = [
            {
                "adjusted_price": 360000,
                "reliability": "high",
                "total_adjustment_percent": 5.0,
                "sale_date": "2024-11-01"
            },
            {
                "adjusted_price": 390000,
                "reliability": "high",
                "total_adjustment_percent": 8.0,
                "sale_date": "2024-10-15"
            },
            {
                "adjusted_price": 340000,
                "reliability": "low",
                "total_adjustment_percent": 26.0,
                "sale_date": "2024-06-01"
            }
        ]
        
        # Reconcile values
        reconciled_value = self.agent._reconcile_comparable_values(adjusted_comps)
        
        # Verify reconciled value is reasonable
        self.assertGreater(reconciled_value, 350000)
        self.assertLess(reconciled_value, 400000)
        self.assertEqual(reconciled_value % 100, 0)  # Should be rounded to nearest hundred
        
    def test_calculate_confidence_score(self):
        """Test confidence score calculation"""
        # High confidence scenario - multiple similar comps
        high_confidence_comps = [
            {
                "adjusted_price": 360000,
                "reliability": "high",
                "total_adjustment_percent": 5.0,
                "sale_date": "2024-11-01"
            },
            {
                "adjusted_price": 365000,
                "reliability": "high",
                "total_adjustment_percent": 7.0,
                "sale_date": "2024-10-15"
            },
            {
                "adjusted_price": 358000,
                "reliability": "high",
                "total_adjustment_percent": 6.0,
                "sale_date": "2024-11-15"
            }
        ]
        
        high_score = self.agent._calculate_confidence_score(high_confidence_comps)
        
        # Low confidence scenario - few dissimilar comps
        low_confidence_comps = [
            {
                "adjusted_price": 360000,
                "reliability": "low",
                "total_adjustment_percent": 30.0,
                "sale_date": "2024-06-01"
            }
        ]
        
        low_score = self.agent._calculate_confidence_score(low_confidence_comps)
        
        # Verify scores
        self.assertGreater(high_score, 0.7)  # High confidence
        self.assertLess(low_score, 0.6)      # Low confidence
        self.assertGreater(high_score, low_score)  # High should be greater than low
    
    @patch('mcp.agents.property_valuation_agent.PropertyValuationAgent._find_comparable_properties')
    def test_sales_comparison_with_no_comps(self, mock_find_comps):
        """Test sales comparison when no comparables are found"""
        # Mock finding no comparables
        mock_find_comps.return_value = []
        
        # Run the sales comparison approach
        result = self.agent._sales_comparison_approach(self.subject_property)
        
        # Should still return a result with default values
        self.assertEqual(result["comparable_count"], 0)
        self.assertEqual(result["value"], 0)
        self.assertEqual(len(result["adjusted_comparables"]), 0)


if __name__ == "__main__":
    unittest.main()