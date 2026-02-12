"""
Valuation Service Test Module

This script allows testing of the valuation services with sample data.
"""

import json
import datetime
from mcp.valuation import (
    current_use_service,
    historic_property_service,
    senior_exemption_service
)

def test_current_use_valuation():
    """Test current use valuation"""
    print("Testing Current Use Valuation Service")
    print("=====================================")
    
    # Test cases
    test_cases = [
        {
            "name": "High productivity irrigated farmland",
            "soil_type": 1,
            "acres": 100,
            "irrigated": True
        },
        {
            "name": "Medium productivity non-irrigated farmland",
            "soil_type": 3,
            "acres": 50,
            "irrigated": False
        },
        {
            "name": "Low productivity farmland",
            "soil_type": 7,
            "acres": 200,
            "irrigated": False
        }
    ]
    
    # Run test cases
    for test_case in test_cases:
        print(f"\nTest Case: {test_case['name']}")
        result = current_use_service.calculate_farm_land_value(
            soil_type=test_case["soil_type"],
            acres=test_case["acres"],
            irrigated=test_case["irrigated"]
        )
        
        print(f"Soil Type: {test_case['soil_type']}")
        print(f"Acres: {test_case['acres']}")
        print(f"Irrigated: {test_case['irrigated']}")
        print(f"Result: {'Success' if result['success'] else 'Failed'}")
        
        if result.get("success"):
            print(f"Value: ${result['value']:,.2f}")
            print(f"Value per Acre: ${result['value_per_acre']:,.2f}")
            print(f"Farm Type: {result['farm_type']}")
            print(f"Capitalization Rate: {result['cap_rate']:.4f}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    
    # Test Open Space Valuation
    print("\nTest Case: Open Space with Public Benefit Rating")
    open_space_result = current_use_service.calculate_open_space_value(
        assessed_value=500000,
        ratings={
            "public_access": "limited",
            "public_benefit": "high",
            "preservation_value": "significant",
            "proximity_to_urban_area": "within_1_mile"
        }
    )
    
    print(f"Assessed Value: $500,000")
    print(f"Public Access: limited")
    print(f"Public Benefit: high")
    print(f"Preservation Value: significant")
    print(f"Proximity to Urban Area: within_1_mile")
    print(f"Result: {'Success' if open_space_result['success'] else 'Failed'}")
    
    if open_space_result.get("success"):
        print(f"Value: ${open_space_result['value']:,.2f}")
        print(f"Rating Points: {open_space_result['rating_points']}")
        print(f"Reduction Percent: {open_space_result['reduction_percent']}%")
    else:
        print(f"Error: {open_space_result.get('error', 'Unknown error')}")
    
    # Test Timber Land Valuation
    print("\nTest Case: Timber Land Valuation")
    timber_result = current_use_service.calculate_timber_land_value(
        soil_productivity=2,
        acres=75
    )
    
    print(f"Soil Productivity: 2")
    print(f"Acres: 75")
    print(f"Result: {'Success' if timber_result['success'] else 'Failed'}")
    
    if timber_result.get("success"):
        print(f"Value: ${timber_result['value']:,.2f}")
        print(f"Value per Acre: ${timber_result['value_per_acre']:,.2f}")
        print(f"Land Grade: {timber_result['land_grade']}")
    else:
        print(f"Error: {timber_result.get('error', 'Unknown error')}")

def test_historic_property_valuation():
    """Test historic property special valuation"""
    print("\nTesting Historic Property Special Valuation Service")
    print("==================================================")
    
    # Test cases
    test_cases = [
        {
            "name": "Recently rehabilitated historic building",
            "property_value": 750000,
            "rehabilitation_costs": 250000,
            "rehabilitation_date": datetime.datetime.now() - datetime.timedelta(days=180),
            "historic_register": "national_register"
        },
        {
            "name": "Historic property with minimum qualifying rehabilitation",
            "property_value": 500000,
            "rehabilitation_costs": 125000,  # Exactly 25%
            "rehabilitation_date": datetime.datetime.now() - datetime.timedelta(days=365),
            "historic_register": "washington_heritage_register"
        },
        {
            "name": "Historic property with insufficient rehabilitation",
            "property_value": 600000,
            "rehabilitation_costs": 120000,  # Less than 25%
            "rehabilitation_date": datetime.datetime.now() - datetime.timedelta(days=90),
            "historic_register": "local_register"
        }
    ]
    
    # Run test cases
    for test_case in test_cases:
        print(f"\nTest Case: {test_case['name']}")
        result = historic_property_service.calculate_special_valuation(
            property_value=test_case["property_value"],
            rehabilitation_costs=test_case["rehabilitation_costs"],
            rehabilitation_date=test_case["rehabilitation_date"],
            historic_register=test_case["historic_register"]
        )
        
        print(f"Property Value: ${test_case['property_value']:,.2f}")
        print(f"Rehabilitation Costs: ${test_case['rehabilitation_costs']:,.2f}")
        print(f"Rehabilitation Date: {test_case['rehabilitation_date'].strftime('%Y-%m-%d')}")
        print(f"Historic Register: {test_case['historic_register']}")
        print(f"Result: {'Success' if result['success'] else 'Failed'}")
        
        if result.get("success"):
            print(f"Special Valuation: ${result['value']:,.2f}")
            print(f"Excluded Value: ${result['excluded_value']:,.2f}")
            print(f"Years Remaining: {result['years_remaining']}")
            print(f"Expiration Date: {result['expiration_date']}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    
    # Test eligibility verification
    print("\nTest Case: Historic Property Eligibility Verification")
    property_data = {
        "historic_designation": "national_register",
        "rehabilitation_costs": 250000,
        "assessed_value": 750000,
        "rehabilitation_completed": True,
        "rehabilitation_completed_date": datetime.datetime.now() - datetime.timedelta(days=180),
        "rehabilitation_started_date": datetime.datetime.now() - datetime.timedelta(days=600),
        "standards_conformance": True
    }
    
    eligibility_result = historic_property_service.verify_eligibility(property_data)
    
    print(f"Historic Designation: {property_data['historic_designation']}")
    print(f"Rehabilitation Costs: ${property_data['rehabilitation_costs']:,.2f}")
    print(f"Assessed Value: ${property_data['assessed_value']:,.2f}")
    print(f"Rehabilitation Completed: {property_data['rehabilitation_completed']}")
    print(f"Result: {'Success' if eligibility_result['success'] else 'Failed'}")
    
    if eligibility_result.get("success"):
        print(f"Eligible: {eligibility_result['eligible']}")
        if not eligibility_result['eligible']:
            print(f"Missing Criteria: {', '.join(eligibility_result['missing_criteria'])}")
    else:
        print(f"Error: {eligibility_result.get('error', 'Unknown error')}")

def test_senior_exemption_valuation():
    """Test senior/disabled exemption calculations"""
    print("\nTesting Senior/Disabled Exemption Service")
    print("========================================")
    
    # Test cases
    test_cases = [
        {
            "name": "Low-income senior",
            "property_value": 350000,
            "income": 25000,
            "age": 75,
            "is_disabled": False,
            "is_veteran": False,
            "is_widow_widower": False
        },
        {
            "name": "Middle-income senior",
            "property_value": 400000,
            "income": 37000,
            "age": 63,
            "is_disabled": False,
            "is_veteran": False,
            "is_widow_widower": False
        },
        {
            "name": "Disabled person (not senior)",
            "property_value": 275000,
            "income": 32000,
            "age": 55,
            "is_disabled": True,
            "is_veteran": False,
            "is_widow_widower": False
        },
        {
            "name": "Disabled veteran",
            "property_value": 325000,
            "income": 45000,
            "age": 58,
            "is_disabled": False,
            "is_veteran": True,
            "is_widow_widower": False
        },
        {
            "name": "Senior with income too high",
            "property_value": 500000,
            "income": 60000,
            "age": 68,
            "is_disabled": False,
            "is_veteran": False,
            "is_widow_widower": False
        }
    ]
    
    # Run test cases
    for test_case in test_cases:
        print(f"\nTest Case: {test_case['name']}")
        result = senior_exemption_service.calculate_exemption(
            property_value=test_case["property_value"],
            income=test_case["income"],
            age=test_case["age"],
            is_disabled=test_case["is_disabled"],
            is_veteran=test_case["is_veteran"],
            is_widow_widower=test_case["is_widow_widower"]
        )
        
        print(f"Property Value: ${test_case['property_value']:,.2f}")
        print(f"Income: ${test_case['income']:,.2f}")
        print(f"Age: {test_case['age']}")
        print(f"Disabled: {test_case['is_disabled']}")
        print(f"Veteran: {test_case['is_veteran']}")
        print(f"Result: {'Success' if result['success'] else 'Failed'}")
        
        if result.get("success"):
            print(f"Exemption Amount: ${result['exemption_amount']:,.2f}")
            print(f"Taxable Value: ${result['taxable_value']:,.2f}")
            print(f"Income Tier: {result['income_tier']}")
            print(f"Exemption Percentage: {result['exemption_percentage']}%")
            print(f"Qualification Type: {result['qualification_type']}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
    
    # Test eligibility verification
    print("\nTest Case: Senior Exemption Eligibility Verification")
    property_data = {
        "is_owner": True,
        "residency_years": 5,
        "is_primary_residence": True,
        "property_value": 350000
    }
    
    applicant_data = {
        "age": 67,
        "income": 29000,
        "is_disabled": False,
        "is_disabled_veteran": False,
        "is_widow_widower": False
    }
    
    eligibility_result = senior_exemption_service.verify_eligibility(
        property_data, applicant_data
    )
    
    print(f"Property Value: ${property_data['property_value']:,.2f}")
    print(f"Primary Residence: {property_data['is_primary_residence']}")
    print(f"Age: {applicant_data['age']}")
    print(f"Income: ${applicant_data['income']:,.2f}")
    print(f"Result: {'Success' if eligibility_result['success'] else 'Failed'}")
    
    if eligibility_result.get("success"):
        print(f"Eligible: {eligibility_result['eligible']}")
        if eligibility_result['eligible']:
            print(f"Income Tier: {eligibility_result['income_tier']}")
        if not eligibility_result['eligible']:
            print(f"Missing Criteria: {', '.join(eligibility_result['missing_criteria'])}")
    else:
        print(f"Error: {eligibility_result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    # Run all tests
    test_current_use_valuation()
    test_historic_property_valuation()
    test_senior_exemption_valuation()