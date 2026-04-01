"""
GAMA Property Agent Test Script
Demonstrates the core functionality of the AI-powered property analysis system
"""

import json
import random
import math
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any

class PropertyAgent:
    """
    AI-powered property analysis agent that combines traditional valuation
    methods with sacred geometry principles for enhanced accuracy
    """
    
    def __init__(self):
        self.phi = (1 + math.sqrt(5)) / 2  # Golden ratio
        self.model_version = "1.2.3"
        self.confidence_threshold = 0.75
        
    def analyze_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive property analysis using AI and sacred geometry
        """
        print(f"🏠 Analyzing property: {property_data.get('address', 'Unknown')}")
        print(f"📊 Using GAMA Agent v{self.model_version}")
        
        # Basic valuation
        base_value = self._calculate_base_value(property_data)
        
        # Sacred geometry adjustments
        geometry_factor = self._calculate_geometry_factor(property_data)
        
        # Market conditions
        market_factor = self._analyze_market_conditions(property_data)
        
        # AI confidence scoring
        confidence = self._calculate_confidence(property_data)
        
        # Final valuation
        estimated_value = base_value * geometry_factor * market_factor
        
        # Generate recommendations
        recommendations = self._generate_recommendations(property_data, confidence)
        
        analysis_result = {
            'property_id': property_data.get('id', 'unknown'),
            'address': property_data.get('address', 'Unknown'),
            'estimated_value': round(estimated_value),
            'base_value': round(base_value),
            'geometry_factor': round(geometry_factor, 3),
            'market_factor': round(market_factor, 3),
            'confidence_score': round(confidence, 2),
            'analysis_date': datetime.now().isoformat(),
            'recommendations': recommendations,
            'risk_assessment': self._assess_risk(property_data, confidence),
            'comparable_properties': self._find_comparables(property_data)
        }
        
        return analysis_result
    
    def _calculate_base_value(self, property_data: Dict[str, Any]) -> float:
        """Calculate base property value using traditional methods"""
        size = property_data.get('size_sqft', 2000)
        bedrooms = property_data.get('bedrooms', 3)
        bathrooms = property_data.get('bathrooms', 2)
        year_built = property_data.get('year_built', 2010)
        
        # Base price per square foot
        price_per_sqft = 150
        
        # Adjustments
        bedroom_value = bedrooms * 25000
        bathroom_value = bathrooms * 15000
        age_adjustment = max(0, (2024 - year_built) * -1000)
        
        base_value = (size * price_per_sqft) + bedroom_value + bathroom_value + age_adjustment
        
        return max(base_value, 100000)  # Minimum value
    
    def _calculate_geometry_factor(self, property_data: Dict[str, Any]) -> float:
        """Apply sacred geometry principles to valuation"""
        size = property_data.get('size_sqft', 2000)
        lot_size = property_data.get('lot_size_sqft', 8000)
        
        # Golden ratio analysis
        ratio = size / lot_size if lot_size > 0 else 0.25
        golden_deviation = abs(ratio - (1 / self.phi))
        
        # Fibonacci sequence alignment
        fib_alignment = self._check_fibonacci_alignment(size)
        
        # Sacred geometry bonus/penalty
        geometry_factor = 1.0
        
        if golden_deviation < 0.1:
            geometry_factor += 0.05  # Golden ratio bonus
            
        if fib_alignment:
            geometry_factor += 0.03  # Fibonacci alignment bonus
            
        # Geometric harmony assessment
        harmony_score = self._assess_geometric_harmony(property_data)
        geometry_factor += (harmony_score - 0.5) * 0.1
        
        return max(0.8, min(1.2, geometry_factor))
    
    def _check_fibonacci_alignment(self, size: int) -> bool:
        """Check if property size aligns with Fibonacci sequence"""
        fib_sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584]
        
        # Scale up Fibonacci numbers
        scaled_fib = [f * 10 for f in fib_sequence]
        
        # Check if size is close to any Fibonacci number
        for fib_num in scaled_fib:
            if abs(size - fib_num) / fib_num < 0.1:
                return True
                
        return False
    
    def _assess_geometric_harmony(self, property_data: Dict[str, Any]) -> float:
        """Assess the geometric harmony of the property"""
        # Simulate geometric harmony analysis
        # In a real implementation, this would analyze floor plans, room ratios, etc.
        
        bedrooms = property_data.get('bedrooms', 3)
        bathrooms = property_data.get('bathrooms', 2)
        
        # Simple harmony metric based on room ratios
        room_ratio = bedrooms / max(bathrooms, 1)
        
        # Ideal ratio is close to golden ratio
        harmony = 1 - abs(room_ratio - self.phi) / self.phi
        
        return max(0, min(1, harmony))
    
    def _analyze_market_conditions(self, property_data: Dict[str, Any]) -> float:
        """Analyze current market conditions"""
        location = property_data.get('location_type', 'suburban').lower()
        
        # Market multipliers by location
        location_factors = {
            'urban': 1.15,
            'suburban': 1.0,
            'rural': 0.85,
            'waterfront': 1.25,
            'downtown': 1.2
        }
        
        base_factor = location_factors.get(location, 1.0)
        
        # Simulate market trends (in real implementation, this would use actual market data)
        market_trend = random.uniform(0.95, 1.1)  # ±10% market variation
        
        return base_factor * market_trend
    
    def _calculate_confidence(self, property_data: Dict[str, Any]) -> float:
        """Calculate AI confidence score"""
        # Factors affecting confidence
        data_completeness = len([v for v in property_data.values() if v is not None]) / len(property_data)
        
        # Recent comparable sales (simulated)
        comparable_count = random.randint(5, 25)
        comparable_factor = min(1.0, comparable_count / 15)
        
        # Market stability (simulated)
        market_stability = random.uniform(0.7, 0.95)
        
        confidence = (data_completeness * 0.4 + comparable_factor * 0.3 + market_stability * 0.3)
        
        return min(0.99, max(0.5, confidence))
    
    def _generate_recommendations(self, property_data: Dict[str, Any], confidence: float) -> List[str]:
        """Generate AI-powered recommendations"""
        recommendations = []
        
        year_built = property_data.get('year_built', 2010)
        size = property_data.get('size_sqft', 2000)
        
        if year_built < 2000:
            recommendations.append("Consider energy efficiency upgrades to increase value")
            
        if size < 1500:
            recommendations.append("Property size below market average - consider expansion opportunities")
        elif size > 3000:
            recommendations.append("Large property size is a market advantage")
            
        if confidence > 0.8:
            recommendations.append("High confidence analysis - favorable for investment decisions")
        elif confidence < 0.7:
            recommendations.append("Lower confidence due to limited data - gather more comparables")
            
        # Sacred geometry recommendations
        geometry_factor = self._calculate_geometry_factor(property_data)
        if geometry_factor > 1.05:
            recommendations.append("Property exhibits excellent geometric harmony - premium positioning")
        elif geometry_factor < 0.95:
            recommendations.append("Consider architectural improvements to enhance geometric balance")
            
        recommendations.append("Market timing appears favorable based on current trends")
        
        return recommendations
    
    def _assess_risk(self, property_data: Dict[str, Any], confidence: float) -> Dict[str, Any]:
        """Assess investment risk factors"""
        year_built = property_data.get('year_built', 2010)
        location = property_data.get('location_type', 'suburban')
        
        # Risk factors
        age_risk = max(0, (2024 - year_built - 20) * 2)  # Higher risk for older properties
        location_risk = {'urban': 15, 'suburban': 10, 'rural': 25, 'waterfront': 20}.get(location.lower(), 15)
        confidence_risk = (1 - confidence) * 30
        
        total_risk = min(100, age_risk + location_risk + confidence_risk)
        
        risk_level = "Low" if total_risk < 20 else "Medium" if total_risk < 40 else "High"
        
        return {
            'total_risk_score': round(total_risk, 1),
            'risk_level': risk_level,
            'age_risk': round(age_risk, 1),
            'location_risk': round(location_risk, 1),
            'confidence_risk': round(confidence_risk, 1)
        }
    
    def _find_comparables(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find comparable properties (simulated)"""
        base_value = self._calculate_base_value(property_data)
        
        comparables = []
        for i in range(random.randint(3, 8)):
            # Generate similar properties
            comp_value = base_value * random.uniform(0.85, 1.15)
            days_ago = random.randint(30, 180)
            sale_date = datetime.now() - timedelta(days=days_ago)
            
            comparable = {
                'address': f"{random.randint(100, 999)} {random.choice(['Oak', 'Pine', 'Maple', 'Cedar'])} {random.choice(['St', 'Ave', 'Dr', 'Ln'])}",
                'sale_price': round(comp_value),
                'sale_date': sale_date.strftime('%Y-%m-%d'),
                'days_ago': days_ago,
                'similarity_score': round(random.uniform(0.75, 0.95), 2)
            }
            comparables.append(comparable)
            
        return sorted(comparables, key=lambda x: x['similarity_score'], reverse=True)

def run_property_analysis():
    """Run comprehensive property analysis demonstration"""
    print("🚀 GAMA Property Agent Analysis System")
    print("=" * 50)
    
    # Initialize the agent
    agent = PropertyAgent()
    
    # Sample property data
    test_properties = [
        {
            'id': 'PROP_001',
            'address': '123 Golden Ratio Drive',
            'size_sqft': 1597,  # Fibonacci number
            'lot_size_sqft': 8000,
            'bedrooms': 3,
            'bathrooms': 2,
            'year_built': 2015,
            'location_type': 'suburban'
        },
        {
            'id': 'PROP_002', 
            'address': '456 Sacred Geometry Lane',
            'size_sqft': 2400,
            'lot_size_sqft': 10000,
            'bedrooms': 4,
            'bathrooms': 3,
            'year_built': 2008,
            'location_type': 'urban'
        },
        {
            'id': 'PROP_003',
            'address': '789 Fibonacci Circle',
            'size_sqft': 2584,  # Fibonacci number
            'lot_size_sqft': 12000,
            'bedrooms': 5,
            'bathrooms': 4,
            'year_built': 2020,
            'location_type': 'waterfront'
        }
    ]
    
    # Analyze each property
    for i, property_data in enumerate(test_properties, 1):
        print(f"\n📋 ANALYSIS {i}/3")
        print("-" * 30)
        
        try:
            analysis = agent.analyze_property(property_data)
            
            # Display results
            print(f"🏠 Property: {analysis['address']}")
            print(f"💰 Estimated Value: ${analysis['estimated_value']:,}")
            print(f"📊 Base Value: ${analysis['base_value']:,}")
            print(f"🔮 Geometry Factor: {analysis['geometry_factor']}")
            print(f"📈 Market Factor: {analysis['market_factor']}")
            print(f"🎯 Confidence: {analysis['confidence_score']:.1%}")
            print(f"⚠️  Risk Level: {analysis['risk_assessment']['risk_level']} ({analysis['risk_assessment']['total_risk_score']}%)")
            
            print(f"\n💡 Recommendations:")
            for rec in analysis['recommendations']:
                print(f"   • {rec}")
                
            print(f"\n🏘️  Comparable Properties ({len(analysis['comparable_properties'])}):")
            for comp in analysis['comparable_properties'][:3]:  # Show top 3
                print(f"   • {comp['address']}: ${comp['sale_price']:,} ({comp['days_ago']} days ago)")
                
            time.sleep(0.5)  # Small delay for better output readability
                
        except Exception as e:
            print(f"❌ Error analyzing property: {str(e)}")
            
        print("\n" + "="*50)
    
    print("\n✅ Analysis Complete!")
    print("🔬 GAMA combines traditional valuation with sacred geometry")
    print("🤖 AI-powered insights for superior property assessment")
    print("\n🌟 Key Features Demonstrated:")
    print("   • Sacred geometry integration (Golden ratio & Fibonacci)")
    print("   • AI confidence scoring")
    print("   • Market condition analysis")
    print("   • Risk assessment algorithms")
    print("   • Comparable property matching")
    print("   • Intelligent recommendations")

if __name__ == "__main__":
    run_property_analysis()
