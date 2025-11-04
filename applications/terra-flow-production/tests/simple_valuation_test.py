"""Simple standalone test for the PropertyValuationAgent"""
import sys
import os
import datetime
from unittest.mock import MagicMock
import statistics

# Add the project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Create a bare minimum PropertyValuationAgent class without requiring the full application context
class PropertyValuationAgent:
    """Minimal PropertyValuationAgent for testing"""
    
    def __init__(self):
        self.knowledge_base = {
            "wa_neighborhoods": {
                "central_kennewick": 1.05,
                "west_richland": 1.10,
                "south_richland": 1.15,
                "central_pasco": 0.95,
                "finley": 0.90
            },
            "wa_market_trends": {
                "monthly_change": 0.006
            },
            "wa_view_adjustments": {
                "factors": {
                    "none": 1.00,
                    "territorial": 1.05,
                    "mountain": 1.10,
                    "river": 1.15,
                    "water": 1.20
                }
            }
        }
    
    def get_knowledge(self, category, key, default=None):
        """Get a value from the knowledge base"""
        if category in self.knowledge_base and key in self.knowledge_base[category]:
            return self.knowledge_base[category][key]
        return default
    
    def add_knowledge(self, category, key, value):
        """Add a value to the knowledge base"""
        if category not in self.knowledge_base:
            self.knowledge_base[category] = {}
        self.knowledge_base[category][key] = value
    
    def _get_neighborhood_adjustment_factor(self, subject_neighborhood, comp_neighborhood):
        """Calculate neighborhood adjustment factor"""
        if subject_neighborhood == comp_neighborhood:
            return 1.0
            
        # Check if we have neighborhood factor data in our knowledge base
        subject_factor = self.get_knowledge("wa_neighborhoods", subject_neighborhood, 1.0)
        comp_factor = self.get_knowledge("wa_neighborhoods", comp_neighborhood, 1.0)
        
        if subject_factor and comp_factor:
            # Calculate relative difference in neighborhood values
            return subject_factor / comp_factor
            
        # Default adjustment for different neighborhoods
        return 0.95
    
    def _get_time_adjustment_factor(self, subject_date, comp_sale_date):
        """Calculate time adjustment factor"""
        if not comp_sale_date or not subject_date:
            return 1.0
            
        # Calculate months between dates
        months_diff = ((subject_date.year - comp_sale_date.year) * 12 + 
                      subject_date.month - comp_sale_date.month)
                      
        # No adjustment for sales within 3 months
        if abs(months_diff) <= 3:
            return 1.0
            
        # Get monthly market trend from knowledge base or use default
        monthly_trend = self.get_knowledge("wa_market_trends", "monthly_change", 0.005)
        
        # Calculate cumulative adjustment
        adjustment = (1 + monthly_trend) ** months_diff
        
        return adjustment
    
    def _get_view_adjustment_factor(self, subject_property, comp_property):
        """Calculate view adjustment factor"""
        subject_view_type = subject_property.get("view_type", "none")
        comp_view_type = comp_property.get("view_type", "none")
        
        # If the view types are different, use predefined adjustments
        if subject_view_type != comp_view_type:
            view_adjustments = self.get_knowledge("wa_view_adjustments", "factors", {})
            subject_factor = view_adjustments.get(subject_view_type, 1.0)
            comp_factor = view_adjustments.get(comp_view_type, 1.0)
            return subject_factor / comp_factor
        
        # Otherwise use rating difference
        subject_view_rating = subject_property.get("view_rating", 0)
        comp_view_rating = comp_property.get("view_rating", 0)
        rating_diff = subject_view_rating - comp_view_rating
        return 1.0 + (rating_diff * 0.02)
    
    def _calculate_confidence_score(self, adjusted_comps):
        """Calculate a confidence score for the valuation"""
        if not adjusted_comps:
            return 0.0
            
        # Base factors affecting confidence
        num_comps = len(adjusted_comps)
        
        # 1. Number of comparables factor
        if num_comps >= 5:
            num_factor = 1.0
        elif num_comps >= 3:
            num_factor = 0.8
        elif num_comps >= 1:
            num_factor = 0.5
        else:
            return 0.0
            
        # 2. Adjustment size factor
        total_adj_percent = sum(abs(comp.get("total_adjustment_percent", 0)) 
                              for comp in adjusted_comps)
        avg_adj_percent = total_adj_percent / num_comps if num_comps > 0 else 100
        
        if avg_adj_percent <= 10:
            adj_factor = 1.0
        elif avg_adj_percent <= 15:
            adj_factor = 0.9
        elif avg_adj_percent <= 25:
            adj_factor = 0.7
        else:
            adj_factor = 0.5
            
        # 3. Sale date recency factor
        sale_dates = []
        for comp in adjusted_comps:
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(comp["sale_date"], "%Y-%m-%d").date()
                    sale_dates.append(sale_date)
                except (ValueError, TypeError):
                    pass
                    
        # Calculate average months since sale
        today = datetime.date.today()
        if sale_dates:
            months_diffs = [((today.year - date.year) * 12 + today.month - date.month) 
                            for date in sale_dates]
            avg_months = sum(months_diffs) / len(months_diffs)
            
            if avg_months <= 6:
                time_factor = 1.0
            elif avg_months <= 12:
                time_factor = 0.9
            elif avg_months <= 24:
                time_factor = 0.7
            else:
                time_factor = 0.5
        else:
            time_factor = 0.7
            
        # 4. Value consistency factor
        if num_comps >= 3:
            values = [comp.get("adjusted_price", 0) for comp in adjusted_comps]
            median_value = statistics.median(values) if values else 0
            
            if median_value > 0:
                deviations = [abs(val - median_value) for val in values]
                avg_deviation = sum(deviations) / len(deviations) if deviations else 0
                cod = (avg_deviation / median_value) * 100 if median_value > 0 else 0
                
                if cod <= 10:
                    consistency_factor = 1.0
                elif cod <= 15:
                    consistency_factor = 0.9
                elif cod <= 20:
                    consistency_factor = 0.8
                else:
                    consistency_factor = 0.6
            else:
                consistency_factor = 0.6
        else:
            consistency_factor = 0.7
            
        # 5. Quality of comparables factor
        high_reliability_count = sum(1 for comp in adjusted_comps 
                                 if comp.get("reliability", "") == "high")
        quality_factor = high_reliability_count / num_comps if num_comps > 0 else 0
        
        # Combine all factors
        confidence_score = (
            num_factor * 0.15 +
            adj_factor * 0.25 +
            time_factor * 0.20 +
            consistency_factor * 0.25 +
            quality_factor * 0.15
        )
        
        return min(max(confidence_score, 0.0), 1.0)

# Run simple tests
def run_tests():
    """Run simple tests for the PropertyValuationAgent"""
    print("Running simple PropertyValuationAgent tests...")
    
    # Create agent
    agent = PropertyValuationAgent()
    
    # Test neighborhood adjustment factor
    factor = agent._get_neighborhood_adjustment_factor("central_kennewick", "central_kennewick")
    print(f"Neighborhood adjustment (same): {factor}")
    assert factor == 1.0, "Same neighborhood should have no adjustment"
    
    factor = agent._get_neighborhood_adjustment_factor("central_kennewick", "west_richland") 
    print(f"Neighborhood adjustment (different): {factor}")
    assert factor != 1.0, "Different neighborhoods should have adjustment"
    assert factor < 1.0, "Central Kennewick should have lower factor than West Richland"
    
    # Test time adjustment factor
    assessment_date = datetime.date(2025, 1, 1)
    recent_sale = datetime.date(2024, 11, 15)
    factor = agent._get_time_adjustment_factor(assessment_date, recent_sale)
    print(f"Time adjustment (recent): {factor}")
    assert factor == 1.0, "Recent sale should have no time adjustment"
    
    older_sale = datetime.date(2024, 6, 15)
    factor = agent._get_time_adjustment_factor(assessment_date, older_sale)
    print(f"Time adjustment (older): {factor}")
    assert factor > 1.0, "Older sale should have positive time adjustment"
    
    # Test view adjustment factor
    subject = {"view_type": "none", "view_rating": 0}
    comp = {"view_type": "none", "view_rating": 0}
    factor = agent._get_view_adjustment_factor(subject, comp)
    print(f"View adjustment (same): {factor}")
    assert factor == 1.0, "Same view should have no adjustment"
    
    subject = {"view_type": "mountain", "view_rating": 2}
    comp = {"view_type": "none", "view_rating": 0}
    factor = agent._get_view_adjustment_factor(subject, comp)
    print(f"View adjustment (different): {factor}")
    assert factor > 1.0, "Better view should have positive adjustment"
    
    # Test confidence score calculation
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
    
    score = agent._calculate_confidence_score(high_confidence_comps)
    print(f"Confidence score (high): {score}")
    assert score > 0.7, "High quality comps should have high confidence score"
    
    low_confidence_comps = [
        {
            "adjusted_price": 360000,
            "reliability": "low",
            "total_adjustment_percent": 30.0,
            "sale_date": "2024-06-01"
        }
    ]
    
    score = agent._calculate_confidence_score(low_confidence_comps)
    print(f"Confidence score (low): {score}")
    assert score < 0.6, "Low quality comps should have low confidence score"
    
    print("All tests passed!")

if __name__ == "__main__":
    run_tests()