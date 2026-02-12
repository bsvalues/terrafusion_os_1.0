"""
Property Valuation Agent for Benton County GeoAssessmentPro

This specialized agent focuses on property valuation analytics, market analysis,
and assessment workflows specific to Washington State property tax assessment.
It integrates with GIS data, market trends, and regulatory requirements to provide
comprehensive valuation intelligence for the Benton County Assessor's Office.

Key capabilities:
- Market analysis and valuation trend monitoring
- Comparable property identification and analysis
- Valuation model management (sales comparison, income, cost approaches)
- Assessment equity analysis across property types
- Tax impact projections based on valuation changes
"""

import logging
import json
import datetime
import statistics
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple
from sqlalchemy import text, func, desc, and_, or_

from app import db
from mcp.agents.base_agent import BaseAgent
from sync_service.notification_system import SyncNotificationManager

# Configure logging
logger = logging.getLogger(__name__)

class PropertyValuationAgent(BaseAgent):
    """
    Agent specializing in property valuation analytics and market insights.
    
    This agent provides specialized capabilities for property assessment workflows
    in Benton County, implementing Washington State assessment methodologies and
    leveraging market data for accurate valuations.
    """
    
    def __init__(self):
        """Initialize the Property Valuation Agent"""
        super().__init__("property_valuation")
        
        # Register capabilities
        self.update_capabilities([
            "market_analysis",
            "comparable_properties",
            "valuation_trends",
            "tax_impact_projection",
            "assessment_equity_analysis",
            "mass_appraisal",
            "property_inspection_scheduling",
            "appeals_support"
        ])
        
        # Initialize notification manager for alerts
        self.notification_manager = SyncNotificationManager()
        
        # Assessment methodologies supported
        self.valuation_models = {
            "sales_comparison": self._sales_comparison_approach,
            "income_approach": self._income_approach,
            "cost_approach": self._cost_approach,
            "hybrid_approach": self._hybrid_approach
        }
        
        # Property types with specific valuation considerations
        self.property_types = {
            "residential": {"primary_method": "sales_comparison"},
            "commercial": {"primary_method": "income_approach"},
            "agricultural": {"primary_method": "income_approach", "secondary_method": "cost_approach"},
            "industrial": {"primary_method": "cost_approach", "secondary_method": "sales_comparison"},
            "vacant_land": {"primary_method": "sales_comparison"}
        }
        
        # Washington State specific assessment parameters
        self.wa_assessment_params = {
            "assessment_ratio": 1.0,  # Washington requires 100% of market value
            "revaluation_cycle": 1,    # Annual revaluation in Benton County
            "appeal_window_days": 60,  # Days to appeal after valuation notice
            "tax_cycles": {
                "assessment_year": 0,  # Current year
                "tax_year": 1         # Following year
            }
        }
        
        # Market analysis parameters
        self.market_analysis_params = {
            "comparable_lookback_months": 18,
            "max_comparable_distance_miles": {
                "urban": 0.5,
                "suburban": 1.0,
                "rural": 3.0
            },
            "min_comparable_count": 3,
            "preferred_comparable_count": 5,
            "adjustment_factors": {
                "lot_size": 0.1,        # 10% per standard deviation
                "building_size": 0.15,   # 15% per standard deviation
                "age": 0.01,            # 1% per year
                "quality": 0.05,        # 5% per quality grade difference
                "condition": 0.05,      # 5% per condition grade difference
                "bathrooms": 0.025,     # 2.5% per bathroom
                "bedrooms": 0.015       # 1.5% per bedroom
            }
        }
        
        # Initialize knowledge base with Washington valuation standards
        self._initialize_knowledge_base()
        
        logger.info(f"Property Valuation Agent initialized with {len(self.capabilities)} capabilities")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process property valuation tasks
        
        Args:
            task_data: Task parameters including task_type and specific task parameters
            
        Returns:
            Task result with analysis data
        """
        task_type = task_data.get("task_type")
        
        if not task_type:
            return {"status": "error", "message": "No task type specified"}
        
        # Task routing based on type
        if task_type == "market_analysis":
            return self._process_market_analysis(task_data)
        elif task_type == "comparable_properties":
            return self._process_comparable_properties(task_data)
        elif task_type == "valuation_trends":
            return self._process_valuation_trends(task_data)
        elif task_type == "tax_impact_projection":
            return self._process_tax_impact(task_data)
        elif task_type == "assessment_equity_analysis":
            return self._process_equity_analysis(task_data)
        elif task_type == "mass_appraisal":
            return self._process_mass_appraisal(task_data)
        elif task_type == "property_inspection_scheduling":
            return self._process_inspection_scheduling(task_data)
        elif task_type == "appeals_support":
            return self._process_appeals_support(task_data)
        elif task_type == "handle_query_message":
            return self._handle_query_message(task_data)
        else:
            return {
                "status": "error", 
                "message": f"Unsupported task type: {task_type}",
                "supported_tasks": self.capabilities
            }
    
    # Market Analysis Methods
    
    def _process_market_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market trends for specific property types and areas
        
        Args:
            task_data: Parameters including area_id, property_type, and time_period
            
        Returns:
            Market analysis results including trends and indices
        """
        area_id = task_data.get("area_id")
        property_type = task_data.get("property_type", "residential")
        time_period = task_data.get("time_period", "12m")  # Default to 12 months
        
        try:
            # Convert time period to months for analysis
            months = self._parse_time_period(time_period)
            
            # Get market trends from database
            market_data = self._get_market_data(area_id, property_type, months)
            
            # Calculate market trends
            trends = self._calculate_market_trends(market_data)
            
            # Specific market indices relevant to valuation
            indices = self._calculate_market_indices(market_data)
            
            return {
                "status": "success",
                "area_id": area_id,
                "property_type": property_type,
                "time_period": time_period,
                "trends": trends,
                "indices": indices,
                "data_points": len(market_data),
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in market analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Market analysis failed: {str(e)}",
                "area_id": area_id,
                "property_type": property_type
            }
    
    def _process_comparable_properties(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Find and analyze comparable properties for a subject property
        
        Args:
            task_data: Parameters including property_id or property attributes
            
        Returns:
            Comparable properties with adjustments and reconciled value
        """
        property_id = task_data.get("property_id")
        property_data = task_data.get("property_data", {})
        
        try:
            # Get subject property data if property_id is provided
            subject_property = {}
            if property_id:
                subject_property = self._get_property_by_id(property_id)
                if not subject_property:
                    return {
                        "status": "error",
                        "message": f"Property not found: {property_id}"
                    }
            else:
                # Use provided property data
                subject_property = property_data
                if not subject_property:
                    return {
                        "status": "error",
                        "message": "No property data provided"
                    }
            
            # Find comparable properties
            comps = self._find_comparable_properties(subject_property)
            
            if not comps:
                return {
                    "status": "warning",
                    "message": "No comparable properties found",
                    "subject_property": subject_property
                }
            
            # Apply adjustments to comparables
            adjusted_comps = self._adjust_comparables(subject_property, comps)
            
            # Reconcile value from adjusted comparables
            reconciled_value = self._reconcile_comparable_values(adjusted_comps)
            
            return {
                "status": "success",
                "subject_property": subject_property,
                "comparable_properties": adjusted_comps,
                "reconciled_value": reconciled_value,
                "confidence_score": self._calculate_confidence_score(adjusted_comps),
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in comparable properties analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Comparable properties analysis failed: {str(e)}",
                "property_id": property_id
            }
    
    def _process_valuation_trends(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze valuation trends across different property types and areas
        
        Args:
            task_data: Parameters including area_ids, property_types, and time_period
            
        Returns:
            Trend analysis with projected values and confidence intervals
        """
        area_ids = task_data.get("area_ids", [])
        property_types = task_data.get("property_types", ["residential"])
        time_period = task_data.get("time_period", "36m")  # Default to 36 months
        
        try:
            # Convert time period to months for analysis
            months = self._parse_time_period(time_period)
            
            # Get historical valuation data
            valuation_data = self._get_valuation_history(area_ids, property_types, months)
            
            # Calculate trends by area and property type
            trends_by_area = {}
            for area_id in area_ids:
                trends_by_area[area_id] = {}
                for prop_type in property_types:
                    # Filter data for this area and property type
                    filtered_data = [d for d in valuation_data 
                                    if d.get("area_id") == area_id and 
                                    d.get("property_type") == prop_type]
                    
                    # Calculate trends
                    trends = self._calculate_valuation_trends(filtered_data)
                    
                    # Project future values
                    projections = self._project_future_values(filtered_data)
                    
                    trends_by_area[area_id][prop_type] = {
                        "trends": trends,
                        "projections": projections,
                        "data_points": len(filtered_data)
                    }
            
            return {
                "status": "success",
                "trends_by_area": trends_by_area,
                "time_period": time_period,
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in valuation trends analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Valuation trends analysis failed: {str(e)}"
            }
    
    def _process_tax_impact(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Project tax impacts based on valuation changes
        
        Args:
            task_data: Parameters including property_id, new_value, or area_id
            
        Returns:
            Tax impact projections with comparison to current taxes
        """
        property_id = task_data.get("property_id")
        new_value = task_data.get("new_value")
        area_id = task_data.get("area_id")
        
        try:
            if property_id:
                # Individual property tax impact
                current_data = self._get_property_tax_data(property_id)
                if not current_data:
                    return {
                        "status": "error",
                        "message": f"Property tax data not found: {property_id}"
                    }
                
                if new_value:
                    # Calculate impact of specific value change
                    impact = self._calculate_property_tax_impact(current_data, new_value)
                    
                    return {
                        "status": "success",
                        "property_id": property_id,
                        "current_value": current_data.get("assessed_value"),
                        "new_value": new_value,
                        "current_tax": current_data.get("annual_tax"),
                        "projected_tax": impact.get("projected_tax"),
                        "tax_difference": impact.get("tax_difference"),
                        "percentage_change": impact.get("percentage_change"),
                        "tax_year": datetime.datetime.now().year + 1  # Tax year is the year after assessment
                    }
                else:
                    # Provide tax estimates for various value scenarios
                    scenarios = self._generate_tax_scenarios(current_data)
                    
                    return {
                        "status": "success",
                        "property_id": property_id,
                        "current_value": current_data.get("assessed_value"),
                        "current_tax": current_data.get("annual_tax"),
                        "tax_scenarios": scenarios,
                        "tax_year": datetime.datetime.now().year + 1
                    }
            
            elif area_id:
                # Area-wide tax impact analysis
                area_impact = self._analyze_area_tax_impact(area_id)
                
                return {
                    "status": "success",
                    "area_id": area_id,
                    "valuation_change": area_impact.get("valuation_change"),
                    "average_tax_change": area_impact.get("average_tax_change"),
                    "median_tax_change": area_impact.get("median_tax_change"),
                    "tax_year": datetime.datetime.now().year + 1
                }
            
            else:
                return {
                    "status": "error",
                    "message": "Property ID or area ID required for tax impact analysis"
                }
                
        except Exception as e:
            logger.error(f"Error in tax impact analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Tax impact analysis failed: {str(e)}"
            }
    
    def _process_equity_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze assessment equity across properties
        
        Args:
            task_data: Parameters including area_ids and property_types
            
        Returns:
            Equity analysis with statistical measures and outliers
        """
        area_ids = task_data.get("area_ids", [])
        property_types = task_data.get("property_types", ["residential"])
        
        try:
            # Get assessment and market data for analysis
            assessment_data = self._get_assessment_equity_data(area_ids, property_types)
            
            # Calculate assessment ratios (assessed value / market value)
            ratios = self._calculate_assessment_ratios(assessment_data)
            
            # Statistical analysis of assessment ratios
            stats = self._analyze_assessment_ratios(ratios)
            
            # Identify outliers for review
            outliers = self._identify_equity_outliers(ratios, stats)
            
            return {
                "status": "success",
                "area_count": len(area_ids),
                "property_type_count": len(property_types),
                "statistics": stats,
                "outliers": outliers,
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in equity analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Equity analysis failed: {str(e)}"
            }
    
    def _process_mass_appraisal(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform mass appraisal analysis for multiple properties
        
        Args:
            task_data: Parameters including area_id and property_type
            
        Returns:
            Mass appraisal results with statistical validation
        """
        area_id = task_data.get("area_id")
        property_type = task_data.get("property_type", "residential")
        model_type = task_data.get("model_type", "linear_regression")
        
        try:
            # Get property data for mass appraisal
            properties = self._get_properties_for_mass_appraisal(area_id, property_type)
            
            if not properties:
                return {
                    "status": "error",
                    "message": "No properties found for mass appraisal"
                }
            
            # Apply mass appraisal model
            results = self._apply_mass_appraisal_model(properties, model_type)
            
            # Validate results
            validation = self._validate_mass_appraisal(results)
            
            return {
                "status": "success",
                "area_id": area_id,
                "property_type": property_type,
                "model_type": model_type,
                "property_count": len(properties),
                "model_statistics": results.get("model_statistics"),
                "validation": validation,
                "analysis_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in mass appraisal: {str(e)}")
            return {
                "status": "error",
                "message": f"Mass appraisal failed: {str(e)}"
            }
    
    def _process_inspection_scheduling(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Schedule property inspections based on prioritization
        
        Args:
            task_data: Parameters including area_id, count, and priority_factors
            
        Returns:
            Inspection schedule with priorities and estimated durations
        """
        area_id = task_data.get("area_id")
        count = task_data.get("count", 50)  # Default to 50 properties
        priority_factors = task_data.get("priority_factors", {
            "years_since_inspection": 0.4,
            "value_change": 0.3,
            "appeal_risk": 0.2,
            "data_quality": 0.1
        })
        
        try:
            # Get properties that need inspection
            properties = self._get_properties_for_inspection(area_id)
            
            # Calculate priority scores
            prioritized = self._prioritize_inspections(properties, priority_factors)
            
            # Select top properties based on count
            selected = prioritized[:count] if len(prioritized) > count else prioritized
            
            # Estimate inspection times
            schedule = self._create_inspection_schedule(selected)
            
            return {
                "status": "success",
                "area_id": area_id,
                "total_properties": len(properties),
                "scheduled_properties": len(selected),
                "priority_factors": priority_factors,
                "schedule": schedule,
                "estimated_total_hours": sum(item.get("estimated_hours", 0) for item in schedule),
                "schedule_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in inspection scheduling: {str(e)}")
            return {
                "status": "error",
                "message": f"Inspection scheduling failed: {str(e)}"
            }
    
    def _process_appeals_support(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate appeals support documentation for a property
        
        Args:
            task_data: Parameters including property_id and appeal_basis
            
        Returns:
            Appeals support documentation with evidence and recommendations
        """
        property_id = task_data.get("property_id")
        appeal_basis = task_data.get("appeal_basis", "general")  # general, comparable, condition, etc.
        
        try:
            # Get property data
            property_data = self._get_property_by_id(property_id)
            if not property_data:
                return {
                    "status": "error",
                    "message": f"Property not found: {property_id}"
                }
            
            # Get valuation evidence
            evidence = self._gather_appeal_evidence(property_data, appeal_basis)
            
            # Generate recommendations
            recommendations = self._generate_appeal_recommendations(property_data, evidence, appeal_basis)
            
            return {
                "status": "success",
                "property_id": property_id,
                "appeal_basis": appeal_basis,
                "property_data": property_data,
                "evidence": evidence,
                "recommendations": recommendations,
                "support_date": datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in appeals support: {str(e)}")
            return {
                "status": "error",
                "message": f"Appeals support failed: {str(e)}"
            }
    
    # Agent-to-Agent Protocol Message Handlers
    
    def _handle_query_message(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle query messages from other agents
        
        Args:
            task_data: Message data including query content
            
        Returns:
            Response to the query
        """
        message = task_data.get("message", {})
        content = message.get("content", {})
        query = content.get("query", "")
        
        # Process different query types
        if "market trends" in query.lower():
            area_id = content.get("context", {}).get("area_id")
            property_type = content.get("context", {}).get("property_type", "residential")
            
            # Use market analysis capability to answer query
            analysis_result = self._process_market_analysis({
                "area_id": area_id,
                "property_type": property_type,
                "time_period": "12m"
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": analysis_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        elif "property value" in query.lower():
            property_id = content.get("context", {}).get("property_id")
            
            # Use comparable properties capability to answer query
            valuation_result = self._process_comparable_properties({
                "property_id": property_id
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": valuation_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        elif "tax impact" in query.lower():
            property_id = content.get("context", {}).get("property_id")
            new_value = content.get("context", {}).get("new_value")
            
            # Use tax impact capability to answer query
            tax_result = self._process_tax_impact({
                "property_id": property_id,
                "new_value": new_value
            })
            
            # Format response for query
            return {
                "message_type": "inform",
                "content": {
                    "information": tax_result,
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
            
        else:
            # Unknown query type
            return {
                "message_type": "inform",
                "content": {
                    "information": {
                        "status": "warning",
                        "message": f"Query type not recognized: {query}",
                        "supported_queries": [
                            "market trends", 
                            "property value", 
                            "tax impact"
                        ]
                    },
                    "query": query
                },
                "sender_id": self.agent_id,
                "receiver_id": message.get("sender_id"),
                "conversation_id": message.get("conversation_id"),
                "reply_to": message.get("id")
            }
    
    # Helper methods for valuation approaches
    
    def _sales_comparison_approach(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement the sales comparison approach for property valuation
        
        Args:
            property_data: Subject property data
            
        Returns:
            Valuation result with comparables and adjustments
        """
        # Find comparable properties
        comps = self._find_comparable_properties(property_data)
        
        # Adjust comparable sales
        adjusted_comps = self._adjust_comparables(property_data, comps)
        
        # Reconcile value
        value = self._reconcile_comparable_values(adjusted_comps)
        
        return {
            "approach": "sales_comparison",
            "value": value,
            "comparable_count": len(comps),
            "adjusted_comparables": adjusted_comps,
            "confidence_score": self._calculate_confidence_score(adjusted_comps)
        }
    
    def _income_approach(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement the income approach for property valuation following Washington standards
        
        Washington State emphasizes the income approach for income-producing properties
        per WAC 458-53-130, which aligns with standard valuation practices but includes
        specific requirements for demonstration of market-based cap rates and rental data.
        
        Args:
            property_data: Subject property data
            
        Returns:
            Valuation result with income parameters following Washington standards
        """
        # Check if this is an income-producing property - if not, return low confidence
        property_type = property_data.get("property_type", "").lower()
        is_income_property = property_type in [
            "commercial", "office", "retail", "industrial", "multi_family", 
            "apartment", "mixed_use", "warehouse", "hotel", "senior_housing"
        ]
        
        if not is_income_property:
            return {
                "approach": "income_approach",
                "value": 0,
                "message": "Income approach not applicable - not an income-producing property",
                "confidence_score": 0.1
            }
            
        # Extract key property characteristics
        building_area = property_data.get("building_area", 0)
        location = property_data.get("location", "")
        condition = property_data.get("condition", "average")
        year_built = property_data.get("year_built", 2000)
        quality = property_data.get("quality_grade", "average")
        
        # Get subtype for more specific analysis
        subtype = property_data.get("subtype", "")
        if not subtype and property_type == "commercial":
            subtype = "general_commercial"
        if not subtype and property_type == "multi_family":
            subtype = "apartment"
            
        # 1. Determine market rent based on property type ($/sq ft/year in WA terms)
        market_rent_psf = self._get_market_rent(property_type, subtype, location, quality, year_built)
        
        # Total potential gross income (PGI)
        if building_area > 0:
            potential_gross_income = market_rent_psf * building_area
        else:
            # Fallback if building area not available - use total income if available
            potential_gross_income = property_data.get("annual_income", 0)
            
        if potential_gross_income <= 0:
            return {
                "approach": "income_approach",
                "value": 0,
                "message": "Insufficient income data for valuation",
                "confidence_score": 0.0
            }
        
        # 2. Apply vacancy and collection loss based on WA submarket standards
        # In WA, this varies significantly by region and property type
        vacancy_rate = self._get_vacancy_rate(property_type, subtype, location)
        collection_loss_rate = 0.01  # Typical for WA markets
        
        effective_gross_income = potential_gross_income * (1 - vacancy_rate - collection_loss_rate)
        
        # 3. Estimate operating expenses based on WA standards
        # In Eastern WA, expense ratios are typically standardized by property type
        expense_ratio = self._get_expense_ratio(property_type, subtype, location)
        operating_expenses = effective_gross_income * expense_ratio
        
        # 4. Calculate net operating income (NOI)
        net_operating_income = effective_gross_income - operating_expenses
        
        # 5. Apply capitalization rate based on WA region and property type
        # WA assessors are required to document market-derived cap rates
        cap_rate = self._get_capitalization_rate(property_type, subtype, location, year_built)
        
        # Calculate value using direct capitalization (standard method in WA)
        if cap_rate > 0:
            income_value = net_operating_income / cap_rate
        else:
            income_value = 0
            
        # 6. Apply gross income multiplier (often used in WA for apartments)
        # WA assessors often verify income approach with GIM analysis
        gross_income_multiplier = self._get_gross_income_multiplier(
            property_type, subtype, location
        )
        gim_value = potential_gross_income * gross_income_multiplier
        
        # 7. Calculate confidence score based on data quality and Washington standards
        confidence_score = self._calculate_income_confidence_score(
            property_data, market_rent_psf, cap_rate, 
            property_type, subtype, location
        )
        
        # 8. Reconcile direct cap and GIM values per WA guidelines
        # WA typically favors direct cap for most properties
        final_value = income_value
        if property_type == "multi_family" and gim_value > 0:
            # For apartments, WA often uses a weighted blend
            final_value = (income_value * 0.7) + (gim_value * 0.3)
            
        # Round to nearest hundred per WA assessment practice
        final_value = round(final_value / 100) * 100
        
        # Return comprehensive result with all income parameters
        return {
            "approach": "income_approach",
            "value": final_value,
            "potential_gross_income": potential_gross_income,
            "vacancy_rate": vacancy_rate,
            "collection_loss_rate": collection_loss_rate,
            "effective_gross_income": effective_gross_income,
            "expense_ratio": expense_ratio,
            "operating_expenses": operating_expenses,
            "net_operating_income": net_operating_income,
            "cap_rate": cap_rate,
            "capitalized_value": income_value,
            "gross_income_multiplier": gross_income_multiplier,
            "gim_value": gim_value,
            "confidence_score": confidence_score,
            "market_rent_psf": market_rent_psf
        }
    
    def _cost_approach(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement the cost approach for property valuation following Washington standards
        
        Washington assessors rely heavily on the cost approach for new construction
        and special purpose properties, per WAC 458-53-130. This implementation
        follows Washington's standards for cost estimation and depreciation.
        
        Args:
            property_data: Subject property data
            
        Returns:
            Valuation result with cost components
        """
        # Check if we have sufficient data for cost approach
        property_type = property_data.get("property_type", "").lower()
        building_area = property_data.get("building_area", 0)
        
        if building_area <= 0:
            return {
                "approach": "cost_approach",
                "value": 0,
                "message": "Insufficient building area data for cost approach",
                "confidence_score": 0.0
            }
            
        # Extract key property characteristics
        land_area = property_data.get("land_area", 0)
        year_built = property_data.get("year_built", datetime.datetime.now().year)
        quality_grade = property_data.get("quality_grade", "average").lower()
        condition = property_data.get("condition", "average").lower()
        location = property_data.get("location", "").lower()
        
        # 1. Land Valuation - using Washington-specific land valuation methods
        # Washington assessors typically use market extraction to determine land values
        land_value = self._calculate_land_value(
            property_type, land_area, location
        )
        
        # 2. Building Cost Calculation - using Washington cost manuals
        # Washington counties typically use Marshall & Swift with local modifiers
        base_cost_per_sf = self._get_base_construction_cost(
            property_type, 
            property_data.get("subtype", ""),
            quality_grade
        )
        
        # Apply Washington regional cost modifiers
        regional_modifier = self._get_wa_regional_modifier(location)
        
        # Calculate total replacement cost new (RCN)
        rcn = building_area * base_cost_per_sf * regional_modifier
        
        # Add improvements and site development costs
        # Washington typically itemizes these separately
        site_improvements = self._calculate_site_improvements(property_data)
        
        # 3. Depreciation Analysis (Washington's 3-factor method)
        # Washington uses a detailed depreciation methodology
        
        # Physical depreciation (age/condition based)
        effective_age = self._calculate_effective_age(year_built, condition)
        physical_depreciation_pct = self._calculate_physical_depreciation(
            effective_age, 
            property_type
        )
        
        # Functional obsolescence (design/utility issues)
        functional_depreciation_pct = self._calculate_functional_depreciation(
            year_built, 
            property_data.get("features", {}),
            property_type
        )
        
        # External/economic obsolescence (location/market factors)
        external_depreciation_pct = self._calculate_external_depreciation(
            location, 
            property_type,
            property_data.get("external_factors", {})
        )
        
        # Calculate total depreciation percentage (Washington method)
        # WA uses a compounded method rather than straight addition
        total_depreciation_pct = self._calculate_total_depreciation(
            physical_depreciation_pct,
            functional_depreciation_pct,
            external_depreciation_pct
        )
        
        # Calculate depreciated improvement value
        depreciation_amount = rcn * total_depreciation_pct
        depreciated_improvement_value = rcn - depreciation_amount
        
        # Add site improvements (less depreciation)
        site_improvement_depreciation = site_improvements * physical_depreciation_pct
        depreciated_site_value = site_improvements - site_improvement_depreciation
        
        # 4. Calculate total property value (WA method)
        total_improvement_value = depreciated_improvement_value + depreciated_site_value
        total_value = land_value + total_improvement_value
        
        # Round to nearest hundred per WA assessment practice
        total_value = round(total_value / 100) * 100
        
        # 5. Calculate confidence score for cost approach
        confidence_score = self._calculate_cost_confidence_score(
            property_data,
            base_cost_per_sf,
            land_value,
            physical_depreciation_pct,
            year_built
        )
        
        # Return comprehensive result with all cost components
        return {
            "approach": "cost_approach",
            "value": total_value,
            "land_value": land_value,
            "improvement_components": {
                "base_cost_per_sqft": base_cost_per_sf,
                "regional_modifier": regional_modifier,
                "replacement_cost_new": rcn,
                "site_improvements": site_improvements,
                "total_replacement_cost": rcn + site_improvements
            },
            "depreciation_components": {
                "effective_age": effective_age,
                "physical_depreciation_pct": physical_depreciation_pct * 100,
                "functional_depreciation_pct": functional_depreciation_pct * 100,
                "external_depreciation_pct": external_depreciation_pct * 100,
                "total_depreciation_pct": total_depreciation_pct * 100,
                "total_depreciation_amount": depreciation_amount
            },
            "improvement_value": total_improvement_value,
            "confidence_score": confidence_score
        }
        
    def _calculate_land_value(
        self,
        property_type: str,
        land_area: float,
        location: str
    ) -> float:
        """
        Calculate land value based on Washington assessment methods
        
        Washington assessors typically use market extraction method
        with benchmarks for different land types and locations
        
        Args:
            property_type: Type of property
            land_area: Land area in square feet or acres
            location: Property location
            
        Returns:
            Land value
        """
        # In production, would query land valuation tables specific to Benton County
        # Here we use WA-specific land value rates from the knowledge base
        
        # Default to square feet if not specified
        area_unit = "sf"
        area = land_area
        
        # Check if area might be in acres (common for WA rural properties)
        if land_area < 100 and property_type not in ["apartment", "commercial", "industrial"]:
            area_unit = "acre"
            area = land_area
        
        # Get base land value rates from knowledge base
        if area_unit == "sf":
            base_land_values = self.get_knowledge("wa_land_values", "per_sf", {})
            land_value_per_unit = base_land_values.get(property_type, 15.0)  # Default $15/sf
        else:
            base_land_values = self.get_knowledge("wa_land_values", "per_acre", {})
            land_value_per_unit = base_land_values.get(property_type, 50000.0)  # Default $50k/acre
            
        # Apply location adjustments (specific to Benton County areas)
        location_factor = 1.0
        if "kennewick" in location:
            location_factor = 1.15
        elif "richland" in location:
            location_factor = 1.2
        elif "west richland" in location:
            location_factor = 1.1
        elif "pasco" in location:
            location_factor = 0.95
        elif "benton city" in location:
            location_factor = 0.85
        elif "prosser" in location:
            location_factor = 0.8
            
        # Apply neighborhood quality adjustment if available
        neighborhood = location.split(',')[0] if ',' in location else location
        neighborhood_factor = self.get_knowledge("wa_neighborhoods", neighborhood, 1.0)
        
        # In a real implementation, zoning would come from property_data parameter
        # For this example, we'll use a default zoning factor
        zoning_factor = 1.0
            
        # Calculate final land value
        land_value = area * land_value_per_unit * location_factor * neighborhood_factor * zoning_factor
        
        return land_value
        
    def _get_base_construction_cost(
        self,
        property_type: str,
        subtype: str,
        quality_grade: str
    ) -> float:
        """
        Get base construction cost per square foot
        
        Uses Washington-specific cost tables (based on Marshall & Swift)
        adjusted for local conditions and building quality
        
        Args:
            property_type: Type of property
            subtype: Specific subtype
            quality_grade: Quality grade of construction
            
        Returns:
            Base construction cost per square foot
        """
        # In production would use a full Marshall & Swift integration
        # Here we use Washington-specific base costs from the knowledge base
        
        # Base construction costs from knowledge base
        base_costs = self.get_knowledge("wa_construction_costs", "base_costs", {})
        
        # Get base cost for property type, defaulting to general residential
        type_costs = base_costs.get(property_type, base_costs.get("residential", {}))
        
        # Get cost for subtype, defaulting to standard type cost
        base_cost = type_costs.get(subtype, type_costs.get("standard", 150.0))
        
        # Apply quality adjustments per Washington assessment standards
        quality_factors = {
            "low": 0.85,
            "fair": 0.9,
            "average": 1.0,
            "good": 1.15,
            "very good": 1.3,
            "excellent": 1.5,
            "luxury": 2.0,
            "mansion": 2.5
        }
        
        quality_factor = quality_factors.get(quality_grade, 1.0)
        
        # Apply the quality factor
        adjusted_cost = base_cost * quality_factor
        
        return adjusted_cost
        
    def _get_wa_regional_modifier(self, location: str) -> float:
        """
        Get Washington-specific regional cost modifier
        
        Different regions in Washington have different construction cost bases,
        this provides the appropriate modifier for the location
        
        Args:
            location: Property location
            
        Returns:
            Regional cost modifier
        """
        # Get regional modifiers from knowledge base or use defaults
        wa_regional_modifiers = self.get_knowledge("methodologies", "cost_approach", {}).get("wa_cost_modifiers", {})
        
        # Default to Eastern Washington / Benton County
        modifier = wa_regional_modifiers.get("benton_county", 0.98)
        
        # Check for more specific locations
        if "seattle" in location or "king county" in location:
            modifier = wa_regional_modifiers.get("puget_sound", 1.12)
        elif "tacoma" in location or "pierce county" in location:
            modifier = wa_regional_modifiers.get("puget_sound", 1.12)
        elif "spokane" in location:
            modifier = wa_regional_modifiers.get("eastern_wa", 0.97)
        elif "vancouver" in location or "clark county" in location:
            modifier = wa_regional_modifiers.get("western_wa", 1.05)
        elif "olympia" in location or "thurston county" in location:
            modifier = wa_regional_modifiers.get("western_wa", 1.05)
            
        return modifier
        
    def _calculate_site_improvements(self, property_data: Dict[str, Any]) -> float:
        """
        Calculate site improvement value
        
        In Washington, site improvements are typically assessed separately
        from the main building and include landscaping, driveways, etc.
        
        Args:
            property_data: Property data
            
        Returns:
            Site improvement value
        """
        # If site improvements are explicitly provided, use them
        if "site_improvements" in property_data:
            return property_data.get("site_improvements", 0)
            
        # Otherwise, estimate based on property type and land area
        property_type = property_data.get("property_type", "").lower()
        land_area = property_data.get("land_area", 0)
        building_area = property_data.get("building_area", 0)
        
        # Calculate site improvement percentage based on property type
        # These are typical percentages used in Washington assessments
        if property_type == "residential":
            # For residential, typically 5-15% of building value
            base_cost = self._get_base_construction_cost(
                property_type, 
                property_data.get("subtype", ""),
                property_data.get("quality_grade", "average")
            )
            return building_area * base_cost * 0.1  # 10% of building value
            
        elif property_type in ["commercial", "retail", "office"]:
            # For commercial, typically higher percentage for site work
            base_cost = self._get_base_construction_cost(
                property_type, 
                property_data.get("subtype", ""),
                property_data.get("quality_grade", "average")
            )
            return building_area * base_cost * 0.15  # 15% of building value
            
        elif property_type == "industrial":
            # Industrial often has extensive site work
            base_cost = self._get_base_construction_cost(
                property_type, 
                property_data.get("subtype", ""),
                property_data.get("quality_grade", "average")
            )
            return building_area * base_cost * 0.2  # 20% of building value
            
        # Default fallback based on land area
        if land_area > 0:
            return land_area * 2.0  # $2 per square foot of land
            
        return 0
        
    def _calculate_effective_age(self, year_built: int, condition: str) -> int:
        """
        Calculate effective age based on actual age and condition
        
        Washington assessors use effective age rather than actual age
        to account for remodeling, maintenance, and condition
        
        Args:
            year_built: Year property was built
            condition: Condition of property
            
        Returns:
            Effective age in years
        """
        current_year = datetime.datetime.now().year
        actual_age = max(0, current_year - year_built)
        
        # Apply condition adjustment to actual age
        # Washington typically uses condition to adjust effective age
        condition_factors = {
            "excellent": 0.5,  # Half the actual age
            "very good": 0.6,
            "good": 0.7,
            "average": 1.0,  # Same as actual age
            "fair": 1.2,
            "poor": 1.5,
            "very poor": 1.7,
            "unsound": 2.0  # Twice the actual age
        }
        
        condition_factor = condition_factors.get(condition, 1.0)
        effective_age = int(actual_age * condition_factor)
        
        return effective_age
        
    def _calculate_physical_depreciation(self, effective_age: int, property_type: str) -> float:
        """
        Calculate physical depreciation percentage
        
        Washington assessors typically use a modified age-life method
        with different expected lifespans based on property type
        
        Args:
            effective_age: Effective age of property
            property_type: Type of property
            
        Returns:
            Physical depreciation percentage (as a decimal)
        """
        # Get typical lifespan for property type from Washington standards
        typical_lifespans = {
            "residential": 60,
            "apartment": 50,
            "commercial": 45,
            "retail": 40,
            "office": 45,
            "industrial": 50,
            "warehouse": 50,
            "agricultural": 40
        }
        
        # Get typical lifespan for this property type
        typical_lifespan = typical_lifespans.get(property_type, 50)
        
        # Calculate straight-line depreciation percentage
        # Washington typically uses a straight-line method with a residual value
        max_depreciation = 0.8  # Maximum 80% depreciation (20% residual)
        
        # Calculate percentage
        if effective_age >= typical_lifespan:
            return max_depreciation
            
        depreciation_pct = min(max_depreciation, effective_age / typical_lifespan)
        
        # Washington uses a calibrated curve rather than straight-line for early years
        # Apply a slight curve to early years depreciation (first third of life)
        if effective_age < (typical_lifespan / 3):
            # Slightly accelerated early-year depreciation
            depreciation_pct = depreciation_pct * 1.1
            
        return min(max_depreciation, depreciation_pct)
        
    def _calculate_functional_depreciation(
        self,
        year_built: int,
        features: Dict[str, Any],
        property_type: str
    ) -> float:
        """
        Calculate functional depreciation percentage
        
        Washington assessors consider functional obsolescence separately
        based on design, layout, and features compared to modern standards
        
        Args:
            year_built: Year property was built
            features: Property features/amenities
            property_type: Type of property
            
        Returns:
            Functional depreciation percentage (as a decimal)
        """
        # Start with base functional obsolescence based on age
        current_year = datetime.datetime.now().year
        actual_age = max(0, current_year - year_built)
        
        # Base functional obsolescence based on age brackets
        # Washington typically considers properties built before certain
        # key dates to have specific functional issues
        base_functional_pct = 0.0
        
        if property_type in ["residential", "apartment"]:
            if year_built < 1950:
                base_functional_pct = 0.15  # Pre-1950 homes (older layouts, electrical, etc.)
            elif year_built < 1970:
                base_functional_pct = 0.1   # Pre-1970 homes (older systems, less energy efficient)
            elif year_built < 1990:
                base_functional_pct = 0.05  # Pre-1990 homes (older finishes, less open concepts)
            elif year_built < 2000:
                base_functional_pct = 0.02  # Pre-2000 homes (minor layout differences)
                
        elif property_type in ["commercial", "retail", "office"]:
            if year_built < 1970:
                base_functional_pct = 0.2   # Pre-1970 commercial (significant layout/systems issues)
            elif year_built < 1990:
                base_functional_pct = 0.15  # Pre-1990 commercial (older systems/tech infrastructure)
            elif year_built < 2000:
                base_functional_pct = 0.1   # Pre-2000 commercial (less efficient design)
            elif year_built < 2010:
                base_functional_pct = 0.05  # Pre-2010 commercial (minor tech/efficiency issues)
                
        elif property_type in ["industrial", "warehouse"]:
            if year_built < 1970:
                base_functional_pct = 0.25  # Pre-1970 industrial (major layout/height/loading issues)
            elif year_built < 1990:
                base_functional_pct = 0.15  # Pre-1990 industrial (older systems, lower clearance)
            elif year_built < 2000:
                base_functional_pct = 0.1   # Pre-2000 industrial (less efficient layout)
            elif year_built < 2010:
                base_functional_pct = 0.05  # Pre-2010 industrial (minor functionality issues)
                
        # Adjust based on feature data
        # In Washington, renovations can reduce functional obsolescence
        has_renovation = features.get("renovated", False)
        renovation_year = features.get("renovation_year", 0)
        
        # Apply renovation adjustment if applicable
        if has_renovation and renovation_year > 0:
            # Calculate how recent the renovation was
            years_since_renovation = max(0, current_year - renovation_year)
            
            # Recent renovations significantly reduce functional obsolescence
            if years_since_renovation < 5:
                base_functional_pct *= 0.3  # Reduce by 70%
            elif years_since_renovation < 10:
                base_functional_pct *= 0.5  # Reduce by 50%
            elif years_since_renovation < 20:
                base_functional_pct *= 0.7  # Reduce by 30%
                
        # Consider specific functional issues
        if property_type in ["residential", "apartment"]:
            # Check for layout issues common in Washington assessments
            if features.get("layout", "") == "poor":
                base_functional_pct += 0.05
            
            # Check for bathroom/bedroom ratio issues
            bedrooms = features.get("bedrooms", 0)
            bathrooms = features.get("bathrooms", 0)
            if bedrooms > 0 and bathrooms > 0:
                if bathrooms < (bedrooms / 2):
                    # Insufficient bathrooms - common functional issue
                    base_functional_pct += 0.03
                    
        elif property_type in ["commercial", "retail", "office"]:
            # Check for retail-specific functional issues
            if property_type == "retail" and features.get("storefront", "") == "poor":
                base_functional_pct += 0.05
                
            # Check for parking issues
            if features.get("parking_ratio", 0) < 3:  # Less than 3 spaces per 1000 SF
                base_functional_pct += 0.03
                
        elif property_type in ["industrial", "warehouse"]:
            # Check for ceiling height issues (critical for industrial)
            ceiling_height = features.get("ceiling_height", 0)
            if ceiling_height > 0:
                if ceiling_height < 16:  # Less than 16 feet
                    base_functional_pct += 0.1
                elif ceiling_height < 24:  # Less than 24 feet
                    base_functional_pct += 0.05
                    
            # Check for truck access issues
            if features.get("truck_access", "") == "poor":
                base_functional_pct += 0.07
                
        # Cap functional obsolescence at reasonable maximum
        return min(0.5, base_functional_pct)
        
    def _calculate_external_depreciation(
        self,
        location: str,
        property_type: str,
        external_factors: Dict[str, Any]
    ) -> float:
        """
        Calculate external/economic depreciation percentage
        
        Washington assessors consider economic obsolescence based on
        location issues, market conditions, and external influences
        
        Args:
            location: Property location
            property_type: Type of property
            external_factors: External influence factors
            
        Returns:
            External depreciation percentage (as a decimal)
        """
        # Start with no external obsolescence
        external_pct = 0.0
        
        # Check location factors common in Washington
        location_lower = location.lower()
        
        # Washington assessors consider flood zones a significant factor
        if external_factors.get("flood_zone", False):
            flood_zone = external_factors.get("flood_zone_type", "")
            if flood_zone == "A" or flood_zone == "AE":
                external_pct += 0.1  # 100-year flood zone
            elif flood_zone == "X":
                external_pct += 0.03  # 500-year flood zone
                
        # Traffic impacts (both positive and negative)
        traffic_level = external_factors.get("traffic_level", "")
        if property_type in ["residential", "apartment"]:
            # High traffic is negative for residential
            if traffic_level == "high":
                external_pct += 0.07
            elif traffic_level == "medium":
                external_pct += 0.03
        elif property_type in ["retail", "commercial"]:
            # Low traffic is negative for retail
            if traffic_level == "low":
                external_pct += 0.05
                
        # Environmental issues
        if external_factors.get("environmental_issue", False):
            external_pct += 0.1
            
        # Proximity to nuisances
        if external_factors.get("proximity_to_nuisance", False):
            external_pct += 0.05
            
        # Economic conditions of the area
        economic_condition = external_factors.get("economic_condition", "stable")
        if economic_condition == "declining":
            external_pct += 0.1
        elif economic_condition == "distressed":
            external_pct += 0.2
            
        # For commercial/industrial, consider special cases
        if property_type in ["commercial", "industrial", "retail"]:
            # Access issues
            if external_factors.get("limited_access", False):
                external_pct += 0.07
                
            # Zoning restrictions
            if external_factors.get("zoning_restriction", False):
                external_pct += 0.05
                
        # Cap external obsolescence at reasonable maximum
        return min(0.7, external_pct)
        
    def _calculate_total_depreciation(
        self,
        physical_pct: float,
        functional_pct: float,
        external_pct: float
    ) -> float:
        """
        Calculate total depreciation percentage using Washington method
        
        Washington assessors use a compound calculation rather than
        simple addition to avoid excessive total depreciation
        
        Args:
            physical_pct: Physical depreciation percentage
            functional_pct: Functional depreciation percentage
            external_pct: External depreciation percentage
            
        Returns:
            Total depreciation percentage (as a decimal)
        """
        # Washington method (compound depreciation rather than additive)
        # Avoid double-counting across categories
        
        # Start with physical depreciation
        remaining_value = 1.0 - physical_pct
        
        # Apply functional to remaining value
        remaining_value = remaining_value * (1.0 - functional_pct)
        
        # Apply external to remaining value
        remaining_value = remaining_value * (1.0 - external_pct)
        
        # Calculate total depreciation
        total_depreciation = 1.0 - remaining_value
        
        # Cap at 90% total depreciation per Washington guidelines
        return min(0.9, total_depreciation)
        
    def _calculate_cost_confidence_score(
        self,
        property_data: Dict[str, Any],
        base_cost: float,
        land_value: float,
        physical_depreciation: float,
        year_built: int
    ) -> float:
        """
        Calculate confidence score for cost approach
        
        Args:
            property_data: Property data
            base_cost: Base construction cost per square foot
            land_value: Calculated land value
            physical_depreciation: Physical depreciation percentage
            year_built: Year property was built
            
        Returns:
            Confidence score between 0 and 1
        """
        # Start with base confidence
        score = 0.5
        
        # 1. Appropriateness of method for property type
        property_type = property_data.get("property_type", "").lower()
        property_age = datetime.datetime.now().year - year_built
        
        # Cost approach works best for newer properties and special purpose properties
        if property_age < 10:
            score += 0.2  # Newer properties have higher confidence
        elif property_age < 20:
            score += 0.1
        elif property_age > 40:
            score -= 0.1  # Older properties have lower confidence
        
        # Property type appropriateness
        if property_type in ["special_purpose", "industrial", "institutional"]:
            score += 0.15  # Best for special purpose properties
        elif property_type in ["commercial", "mixed_use"]:
            score += 0.1   # Good for commercial
        elif property_type == "new_construction":
            score += 0.25  # Excellent for new construction
            
        # 2. Data quality factors
        if base_cost > 0:
            score += 0.1  # Have reliable cost data
        else:
            score -= 0.2  # Missing critical data
            
        if land_value > 0:
            score += 0.1  # Have reliable land value
        else:
            score -= 0.1  # Missing critical data
            
        # Depreciation appropriateness
        if property_age < 5 and physical_depreciation < 0.1:
            score += 0.1  # Minimal depreciation for new properties is appropriate
        elif property_age > 30 and physical_depreciation < 0.3:
            score -= 0.1  # Suspiciously low depreciation for older property
        elif property_age > 50 and physical_depreciation > 0.7:
            score -= 0.05  # Very high depreciation may be subjective
            
        # 3. Special factors
        if property_data.get("recent_cost_data", False):
            score += 0.15  # Recent actual construction cost available
            
        if property_data.get("special_construction", False):
            score += 0.1  # Special construction type favors cost approach
            
        # Normalize score to 0-1 range
        final_score = min(max(score, 0.0), 1.0)
        
        return final_score
    
    def _hybrid_approach(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement a hybrid approach combining multiple valuation methods
        
        Args:
            property_data: Subject property data
            
        Returns:
            Valuation result with weighted components
        """
        # Get results from each approach
        sales_result = self._sales_comparison_approach(property_data)
        income_result = self._income_approach(property_data)
        cost_result = self._cost_approach(property_data)
        
        # Assign weights based on property type and data quality
        property_type = property_data.get("property_type", "residential")
        
        if property_type == "residential":
            weights = {
                "sales_comparison": 0.7,
                "cost_approach": 0.3,
                "income_approach": 0.0
            }
        elif property_type == "commercial":
            weights = {
                "sales_comparison": 0.3,
                "income_approach": 0.6,
                "cost_approach": 0.1
            }
        elif property_type == "industrial":
            weights = {
                "sales_comparison": 0.2,
                "cost_approach": 0.6,
                "income_approach": 0.2
            }
        else:
            # Default weights
            weights = {
                "sales_comparison": 0.4,
                "income_approach": 0.3,
                "cost_approach": 0.3
            }
        
        # Calculate weighted value
        weighted_value = (
            sales_result.get("value", 0) * weights["sales_comparison"] +
            income_result.get("value", 0) * weights["income_approach"] +
            cost_result.get("value", 0) * weights["cost_approach"]
        )
        
        return {
            "approach": "hybrid",
            "value": weighted_value,
            "components": {
                "sales_comparison": {
                    "value": sales_result.get("value", 0),
                    "weight": weights["sales_comparison"]
                },
                "income_approach": {
                    "value": income_result.get("value", 0),
                    "weight": weights["income_approach"]
                },
                "cost_approach": {
                    "value": cost_result.get("value", 0),
                    "weight": weights["cost_approach"]
                }
            }
        }
    
    # Helper methods for data retrieval and analysis
    
    def _get_market_data(self, area_id: str, property_type: str, months: int) -> List[Dict[str, Any]]:
        """
        Get market data for a specific area and property type
        
        Args:
            area_id: Area identifier
            property_type: Type of property
            months: Number of months to look back
            
        Returns:
            List of market data records
        """
        # Placeholder implementation - in a real system, this would query the database
        # Mock data for development purposes
        # In production, this would be replaced with actual database queries
        
        # In a real implementation, we would query sales data from the database
        # For now, returning an empty list as a placeholder
        return []
    
    def _get_property_by_id(self, property_id: str) -> Dict[str, Any]:
        """
        Get property data for a specific property ID
        
        Args:
            property_id: Property identifier
            
        Returns:
            Property data dictionary
        """
        # Placeholder implementation - in a real system, this would query the database
        # Mock data for development purposes
        # In production, this would be replaced with actual database queries
        
        # In a real implementation, we would query property data from the database
        # For now, returning an empty dictionary as a placeholder
        return {}
    
    def _get_market_rent(
        self, 
        property_type: str, 
        subtype: str, 
        location: str, 
        quality: str, 
        year_built: int
    ) -> float:
        """
        Get market rent per square foot based on property characteristics
        
        Uses Washington-specific market standards and data
        
        Args:
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            quality: Property quality
            year_built: Year property was built
            
        Returns:
            Market rent per square foot per year
        """
        # In production, this would query a market data system or database
        # For now, using a knowledge base with WA-specific rental rates
        
        # Default rates for Benton County (Eastern Washington)
        # These rates would be regularly updated from market surveys in a real system
        
        # Get base rent from knowledge base if available
        base_rent = 0.0
        
        if property_type == "office":
            base_rent = self.get_knowledge("wa_market_rents", "office", 18.0)
            
            # Further refinement by subtype
            if subtype == "class_a":
                base_rent *= 1.3
            elif subtype == "class_b":
                base_rent *= 1.0
            elif subtype == "class_c":
                base_rent *= 0.8
            elif subtype == "medical":
                base_rent *= 1.4
                
        elif property_type == "retail":
            base_rent = self.get_knowledge("wa_market_rents", "retail", 20.0)
            
            # Further refinement by subtype
            if subtype == "anchor":
                base_rent *= 0.8
            elif subtype == "strip_center":
                base_rent *= 1.0
            elif subtype == "freestanding":
                base_rent *= 1.2
            elif subtype == "mall":
                base_rent *= 1.5
                
        elif property_type == "industrial":
            base_rent = self.get_knowledge("wa_market_rents", "industrial", 9.0)
            
            # Further refinement by subtype
            if subtype == "warehouse":
                base_rent *= 0.9
            elif subtype == "flex":
                base_rent *= 1.2
            elif subtype == "manufacturing":
                base_rent *= 1.0
            elif subtype == "distribution":
                base_rent *= 1.1
                
        elif property_type == "multi_family" or property_type == "apartment":
            # Multifamily typically calculated per unit, but we'll convert to SF
            # Average unit size in Eastern WA is ~900 SF
            unit_rent = self.get_knowledge("wa_market_rents", "apartment_unit", 1200.0)
            avg_unit_size = self.get_knowledge("wa_standards", "avg_unit_size", 900)
            base_rent = (unit_rent * 12) / avg_unit_size  # Annual rent per SF
            
            # Further refinement by subtype
            if subtype == "luxury":
                base_rent *= 1.3
            elif subtype == "standard":
                base_rent *= 1.0
            elif subtype == "affordable":
                base_rent *= 0.8
            elif subtype == "senior":
                base_rent *= 1.2
                
        elif property_type == "mixed_use":
            # Mixed use typically calculated by weighting component uses
            office_pct = 0.4  # Default components if not specified
            retail_pct = 0.4
            residential_pct = 0.2
            
            office_rent = self.get_knowledge("wa_market_rents", "office", 18.0)
            retail_rent = self.get_knowledge("wa_market_rents", "retail", 20.0)
            residential_rent = self.get_knowledge("wa_market_rents", "apartment", 15.0)
            
            base_rent = (office_rent * office_pct) + (retail_rent * retail_pct) + (residential_rent * residential_pct)
        
        else:
            # Default commercial rent for Eastern WA
            base_rent = self.get_knowledge("wa_market_rents", "commercial", 15.0)
        
        # Apply quality adjustments (Washington standards)
        quality_factors = {
            "excellent": 1.25,
            "good": 1.1,
            "average": 1.0,
            "fair": 0.9,
            "poor": 0.75
        }
        quality_factor = quality_factors.get(quality.lower(), 1.0)
        
        # Apply age/condition adjustment
        current_year = datetime.datetime.now().year
        age = max(0, current_year - year_built)
        
        # Age factor based on Washington assessment standards
        if age < 5:
            age_factor = 1.1
        elif age < 10:
            age_factor = 1.05
        elif age < 20:
            age_factor = 1.0
        elif age < 30:
            age_factor = 0.95
        elif age < 40:
            age_factor = 0.9
        else:
            age_factor = 0.85
            
        # Apply location adjustment
        # In Eastern WA, location factors vary by city/market area
        location_factor = 1.0
        if "kennewick" in location.lower():
            location_factor = 1.05
        elif "richland" in location.lower():
            location_factor = 1.1
        elif "pasco" in location.lower():
            location_factor = 0.95
        elif "west richland" in location.lower():
            location_factor = 1.0
        elif "benton city" in location.lower():
            location_factor = 0.9
            
        # Calculate final market rent
        adjusted_rent = base_rent * quality_factor * age_factor * location_factor
        
        return adjusted_rent
        
    def _get_vacancy_rate(self, property_type: str, subtype: str, location: str) -> float:
        """
        Get market vacancy rate based on property type and location
        
        Args:
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            
        Returns:
            Vacancy rate (as a decimal)
        """
        # In a production system, this would query current market data
        # For now, use typical Eastern WA vacancy rates by property type
        
        # Base vacancy rates for Benton County
        vacancy_rates = {
            "office": 0.10,
            "retail": 0.08,
            "industrial": 0.06,
            "multi_family": 0.05,
            "apartment": 0.05,
            "warehouse": 0.07,
            "mixed_use": 0.08
        }
        
        # Get base rate from dictionary or use commercial as default
        base_rate = vacancy_rates.get(property_type, 0.09)
        
        # Location adjustments
        location_factor = 1.0
        if "downtown" in location.lower():
            location_factor = 0.9  # Lower vacancy in downtown
        elif "suburban" in location.lower():
            location_factor = 1.0  # Average vacancy in suburbs
        elif "rural" in location.lower():
            location_factor = 1.2  # Higher vacancy in rural areas
            
        # Subtype adjustments
        subtype_factor = 1.0
        if property_type == "office":
            if subtype == "class_a":
                subtype_factor = 0.9
            elif subtype == "class_c":
                subtype_factor = 1.2
                
        elif property_type == "retail":
            if subtype == "mall":
                subtype_factor = 1.3
            elif subtype == "freestanding":
                subtype_factor = 0.8
                
        return base_rate * location_factor * subtype_factor
        
    def _get_expense_ratio(self, property_type: str, subtype: str, location: str) -> float:
        """
        Get operating expense ratio based on property type and location
        
        Args:
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            
        Returns:
            Expense ratio (as a decimal of EGI)
        """
        # Standard expense ratios for Eastern WA commercial properties
        # These are ranges commonly used in assessment models
        
        expense_ratios = {
            "office": 0.45,
            "retail": 0.35,
            "industrial": 0.30,
            "multi_family": 0.40,
            "apartment": 0.40,
            "warehouse": 0.25,
            "mixed_use": 0.42
        }
        
        base_ratio = expense_ratios.get(property_type, 0.40)
        
        # Adjust for property size (economies of scale)
        # Note: In a real implementation, this would use the actual property data
        # For this example we'll use default adjustments
        size_factor = 1.0
        age_factor = 1.0
        
        # For real implementation using actual property data
        # Unit count, building size would typically be used for more precise adjustments
                
        return base_ratio * size_factor * age_factor
        
    def _get_capitalization_rate(
        self, 
        property_type: str, 
        subtype: str, 
        location: str, 
        year_built: int
    ) -> float:
        """
        Get capitalization rate based on property characteristics
        
        Washington assessors typically derive cap rates from market sales and
        publish them as part of ratio studies.
        
        Args:
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            year_built: Year property was built
            
        Returns:
            Capitalization rate (as a decimal)
        """
        # Base cap rates from knowledge base (specific to Washington markets)
        cap_rates = self.get_knowledge("methodologies", "income_approach", {}).get("wa_cap_rates", {})
        
        # Get base rate from cap rates dictionary
        base_rate = cap_rates.get(property_type, 0.075)
        
        # Age adjustments (older properties have higher cap rates)
        current_year = datetime.datetime.now().year
        age = max(0, current_year - year_built)
        
        age_factor = 0.0
        if age > 40:
            age_factor = 0.010
        elif age > 30:
            age_factor = 0.008
        elif age > 20:
            age_factor = 0.005
        elif age > 10:
            age_factor = 0.002
        else:
            age_factor = 0.0
            
        # Location adjustments
        location_factor = 0.0
        if "prime" in location.lower() or "downtown" in location.lower():
            location_factor = -0.005
        elif "suburban" in location.lower():
            location_factor = 0.0
        elif "rural" in location.lower():
            location_factor = 0.005
            
        # Quality adjustments - in a real implementation this would use the property's actual quality
        quality_factor = 0.0
            
        # Calculate final cap rate
        final_cap_rate = base_rate + age_factor + location_factor + quality_factor
        
        # Ensure cap rate is within reasonable bounds
        final_cap_rate = min(max(final_cap_rate, 0.04), 0.12)
        
        return final_cap_rate
        
    def _get_gross_income_multiplier(
        self, 
        property_type: str, 
        subtype: str, 
        location: str
    ) -> float:
        """
        Get gross income multiplier based on property characteristics
        
        Args:
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            
        Returns:
            Gross income multiplier
        """
        # Base multipliers from knowledge base (specific to Washington markets)
        income_multipliers = self.get_knowledge("methodologies", "income_approach", {}).get("wa_income_multipliers", {})
        
        # Get base multiplier from dictionary
        base_multiplier = income_multipliers.get(property_type, 7.5)
        
        # Location adjustments
        location_factor = 1.0
        if "prime" in location.lower() or "downtown" in location.lower():
            location_factor = 1.1
        elif "suburban" in location.lower():
            location_factor = 1.0
        elif "rural" in location.lower():
            location_factor = 0.9
            
        # Subtype adjustments
        subtype_factor = 1.0
        if property_type == "multi_family" or property_type == "apartment":
            if subtype == "luxury":
                subtype_factor = 1.1
            elif subtype == "affordable":
                subtype_factor = 0.9
        
        # Calculate final multiplier
        final_multiplier = base_multiplier * location_factor * subtype_factor
        
        return final_multiplier
        
    def _calculate_income_confidence_score(
        self,
        property_data: Dict[str, Any],
        market_rent: float,
        cap_rate: float,
        property_type: str,
        subtype: str,
        location: str
    ) -> float:
        """
        Calculate confidence score for income approach valuation
        
        Args:
            property_data: Property data
            market_rent: Market rent per square foot
            cap_rate: Capitalization rate
            property_type: Type of property
            subtype: Specific subtype of property
            location: Property location
            
        Returns:
            Confidence score between 0 and 1
        """
        # Base confidence score
        score = 0.5
        
        # 1. Appropriateness of method for property type
        if property_type in ["office", "retail", "industrial", "multi_family", "apartment"]:
            score += 0.2  # Income approach highly appropriate
        elif property_type in ["mixed_use", "hotel", "senior_housing"]:
            score += 0.1  # Income approach appropriate but complex
        else:
            score -= 0.2  # Less appropriate for non-income properties
            
        # 2. Data quality factors
        building_area = property_data.get("building_area", 0)
        if building_area > 0:
            score += 0.1  # Building area available
        else:
            score -= 0.1  # Missing critical data
            
        # Check if market rent is realistic
        if market_rent > 0:
            score += 0.1
        else:
            score -= 0.2
            
        # Check if cap rate is realistic
        if 0.04 <= cap_rate <= 0.12:
            score += 0.1
        else:
            score -= 0.1
            
        # 3. Property age appropriateness
        year_built = property_data.get("year_built", 0)
        current_year = datetime.datetime.now().year
        
        if year_built > 0:
            age = current_year - year_built
            if age <= 50:  # Income approach works best for newer properties
                score += 0.05
        
        # 4. Market data availability adjustment
        # In a real implementation, this would check for market data availability
        # For now, assume good data availability in major markets
        if "kennewick" in location.lower() or "richland" in location.lower() or "pasco" in location.lower():
            score += 0.05
            
        # Normalize score to 0-1 range
        final_score = min(max(score, 0.0), 1.0)
        
        return final_score
        
    def _find_comparable_properties(self, subject_property: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find comparable properties using Washington's assessment standards
        
        Washington State assessors typically define comparable properties as:
        1. In the same or similar neighborhood
        2. Similar property type (e.g., residential, commercial)
        3. Similar size (within 20-30% of subject)
        4. Similar age (within 10-15 years)
        5. Similar quality/grade
        6. Recent sales (typically within the last 12-24 months)
        
        This method implements these standards for comparable property selection.
        
        Args:
            subject_property: Subject property data
            
        Returns:
            List of comparable properties meeting Washington standards
        """
        # In a production system, this would query the database
        # Here we'll demonstrate the filtering logic with a sample property set
        
        # Extract key characteristics of subject property
        subject_type = subject_property.get("property_type", "residential")
        subject_neighborhood = subject_property.get("neighborhood", "")
        subject_sqft = subject_property.get("building_area", 0)
        subject_year_built = subject_property.get("year_built", 0)
        subject_quality = subject_property.get("quality_grade", "average")
        subject_bedrooms = subject_property.get("bedrooms", 0)
        subject_bathrooms = subject_property.get("bathrooms", 0)
        
        # Query parameters for database search (in real implementation)
        params = {
            "property_type": subject_type,
            "min_sqft": subject_sqft * 0.7 if subject_sqft else 0,  # 30% smaller
            "max_sqft": subject_sqft * 1.3 if subject_sqft else 0,  # 30% larger
            "min_year": subject_year_built - 15 if subject_year_built else 0,
            "max_year": subject_year_built + 15 if subject_year_built else 0,
            "bedrooms": subject_bedrooms,
            "bathrooms": subject_bathrooms,
            "neighborhoods": [subject_neighborhood] if subject_neighborhood else []
        }
        
        # Add nearby neighborhoods (in real implementation)
        if subject_neighborhood:
            nearby = self.get_knowledge("wa_neighborhoods", f"{subject_neighborhood}_nearby", [])
            if nearby:
                params["neighborhoods"].extend(nearby)
                
        # Get sales within the last 24 months (in real implementation)
        current_date = datetime.datetime.now().date()
        min_sale_date = (current_date - datetime.timedelta(days=730)).isoformat()  # 24 months
        
        # In a real implementation, we would execute a database query here
        # For demonstration, we'll use sample property data
        # This would be replaced with an actual database query in production
        
        # Sample comparable properties - these would come from a database in production
        # Note: Using a small sample here for demonstration purposes
        sample_properties = [
            {
                "property_id": "COMP001",
                "property_type": "residential",
                "neighborhood": subject_neighborhood,
                "building_area": subject_sqft * 0.95,
                "year_built": subject_year_built - 5 if subject_year_built else 1990,
                "quality_grade": subject_quality,
                "bedrooms": subject_bedrooms,
                "bathrooms": subject_bathrooms,
                "sale_price": 350000,
                "sale_date": "2024-09-15",
                "lot_size": 8000,
                "view_type": "none",
                "view_rating": 0
            },
            {
                "property_id": "COMP002",
                "property_type": "residential",
                "neighborhood": subject_neighborhood,
                "building_area": subject_sqft * 1.1,
                "year_built": subject_year_built + 3 if subject_year_built else 2000,
                "quality_grade": "good" if subject_quality == "average" else subject_quality,
                "bedrooms": subject_bedrooms + 1,
                "bathrooms": subject_bathrooms,
                "sale_price": 425000,
                "sale_date": "2024-06-22",
                "lot_size": 9500,
                "view_type": "mountain",
                "view_rating": 2
            },
            {
                "property_id": "COMP003",
                "property_type": "residential",
                "neighborhood": "Adjacent Neighborhood",
                "building_area": subject_sqft * 0.9,
                "year_built": subject_year_built - 10 if subject_year_built else 1985,
                "quality_grade": subject_quality,
                "bedrooms": subject_bedrooms,
                "bathrooms": subject_bathrooms - 0.5,
                "sale_price": 310000,
                "sale_date": "2024-11-05",
                "lot_size": 7200,
                "view_type": "none",
                "view_rating": 0
            },
            {
                "property_id": "COMP004",
                "property_type": "residential",
                "neighborhood": subject_neighborhood,
                "building_area": subject_sqft * 1.05,
                "year_built": subject_year_built + 8 if subject_year_built else 2005,
                "quality_grade": subject_quality,
                "bedrooms": subject_bedrooms,
                "bathrooms": subject_bathrooms + 1,
                "sale_price": 390000,
                "sale_date": "2024-08-11",
                "lot_size": 8800,
                "view_type": "none",
                "view_rating": 0
            },
            {
                "property_id": "COMP005",
                "property_type": "residential",
                "neighborhood": "Another Nearby Area",
                "building_area": subject_sqft * 1.2,
                "year_built": subject_year_built + 5 if subject_year_built else 2002,
                "quality_grade": "excellent" if subject_quality != "excellent" else subject_quality,
                "bedrooms": subject_bedrooms + 1,
                "bathrooms": subject_bathrooms + 0.5,
                "sale_price": 450000,
                "sale_date": "2024-05-30",
                "lot_size": 10200,
                "view_type": "water",
                "view_rating": 3
            }
        ]
        
        # In a production system, we would fetch real market data
        # For now, using our sample data but applying Washington-specific filtering logic
        
        # Apply Washington-specific filtering:
        filtered_comps = []
        
        for comp in sample_properties:
            # Property type must match exactly (WA standard)
            if comp["property_type"] != subject_type:
                continue
                
            # Size must be within 30% (WA typically uses 20-30%)
            comp_sqft = comp.get("building_area", 0)
            if subject_sqft and comp_sqft:
                size_diff_percent = abs(comp_sqft - subject_sqft) / subject_sqft
                if size_diff_percent > 0.3:  # More than 30% different
                    continue
                    
            # Year built should be within 15 years (WA standard)
            comp_year = comp.get("year_built", 0)
            if subject_year_built and comp_year:
                if abs(comp_year - subject_year_built) > 15:
                    continue
                    
            # Bedrooms/bathrooms should be similar (WA standard)
            if subject_bedrooms and comp["bedrooms"]:
                if abs(comp["bedrooms"] - subject_bedrooms) > 1:
                    continue
                    
            # Check sale date - should be within past 24 months (WA standard)
            # In a real implementation, this would be more robust date parsing
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(comp["sale_date"], "%Y-%m-%d").date()
                    months_diff = ((current_date.year - sale_date.year) * 12 + 
                                  current_date.month - sale_date.month)
                    if months_diff > 24:  # Older than 24 months
                        continue
                except (ValueError, TypeError):
                    # Skip date check if format is invalid
                    pass
                    
            # If it passed all filters, add to filtered comps
            filtered_comps.append(comp)
            
        # Sort by similarity (most similar first)
        # In WA assessment, proximity and physical similarity are key factors
        def similarity_score(comp):
            score = 0
            
            # Same neighborhood is best
            if comp.get("neighborhood") == subject_neighborhood:
                score += 30
                
            # Size similarity
            comp_sqft = comp.get("building_area", 0)
            if subject_sqft and comp_sqft:
                size_diff_percent = abs(comp_sqft - subject_sqft) / subject_sqft
                score += max(0, 20 - (size_diff_percent * 100))
                
            # Age similarity
            comp_year = comp.get("year_built", 0)
            if subject_year_built and comp_year:
                year_diff = abs(comp_year - subject_year_built)
                score += max(0, 15 - year_diff)
                
            # Sale date recency (more recent is better)
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(comp["sale_date"], "%Y-%m-%d").date()
                    months_diff = ((current_date.year - sale_date.year) * 12 + 
                                 current_date.month - sale_date.month)
                    score += max(0, 20 - months_diff)
                except (ValueError, TypeError):
                    pass
                    
            # Quality match
            if comp.get("quality_grade") == subject_quality:
                score += 15
                
            return score
            
        # Sort by similarity score (highest first)
        filtered_comps.sort(key=similarity_score, reverse=True)
        
        # Limit to best 5 comparables per Washington standards
        return filtered_comps[:5]
    
    # Knowledge base initialization
    
    def _initialize_knowledge_base(self) -> None:
        """Initialize the knowledge base with Washington State valuation standards and references"""
        
        # Washington State assessment standards
        # Based on RCW 84.40.030 (all property valued at 100% true and fair value)
        self.add_knowledge("wa_standards", "assessment_ratio", 1.0)
        self.add_knowledge("wa_standards", "revaluation_cycle", 1)  # Annual per RCW 36.21.080
        self.add_knowledge("wa_standards", "appeal_deadline_days", 60)  # Per Washington statute
        
        # Washington State regulatory references
        self.add_knowledge("wa_rcw", "valuation", {
            "RCW_84.40.030": "True and fair value standard for all property",
            "RCW_84.41.041": "Physical inspection of property at least once every 6 years",
            "RCW_84.33": "Timber and forest lands valuation",
            "RCW_84.34": "Open space and agricultural land valuation",
            "RCW_84.36": "Property tax exemptions", 
            "RCW_84.26": "Historic property valuation"
        })
        
        # Washington State valuation methodologies
        self.add_knowledge("methodologies", "sales_comparison", {
            "description": "Compares subject property to similar recently sold properties",
            "best_use": ["residential", "vacant_land", "small_commercial"],
            "required_data": ["recent_sales", "property_characteristics"],
            "wa_standard": "Primary method for residential per WAC 458-53-130",
            "wa_reliability_criteria": "COD < 15% for residential, < 20% for commercial",
            "wa_sale_verification": "Per WAC 458-53-080"
        })
        
        self.add_knowledge("methodologies", "income_approach", {
            "description": "Values property based on income potential",
            "best_use": ["commercial", "multi_family", "industrial"],
            "required_data": ["rental_rates", "expenses", "cap_rates"],
            "wa_standard": "Primary method for income properties per WAC 458-53-130",
            "wa_cap_rates": {
                "apartment": 0.065,
                "office": 0.075,
                "retail": 0.07,
                "industrial": 0.08,
                "mixed_use": 0.07
            },
            "wa_income_multipliers": {
                "apartment": 8.5,
                "office": 7.5, 
                "retail": 8.0,
                "industrial": 7.0
            }
        })
        
        self.add_knowledge("methodologies", "cost_approach", {
            "description": "Values property based on cost to replace minus depreciation",
            "best_use": ["new_construction", "unique_properties", "industrial"],
            "required_data": ["land_values", "construction_costs", "depreciation"],
            "wa_standard": "Primary for special purpose properties per WAC 458-53-130",
            "wa_cost_modifiers": {
                "benton_county": 0.98,  # Regional cost modifier for Benton County
                "eastern_wa": 0.97,
                "western_wa": 1.05,
                "puget_sound": 1.12
            },
            "wa_depreciation_standards": {
                "physical": "Straight-line based on effective age/condition",
                "functional": "Modified observed condition method",
                "economic": "Market extraction method"
            }
        })
        
        # Washington specific neighborhood factors
        # These would be derived from actual sales data analysis in a production system
        # In a real implementation, this would be much more comprehensive
        self.add_knowledge("wa_neighborhoods", "central_kennewick", 1.05)
        self.add_knowledge("wa_neighborhoods", "west_richland", 1.10)
        self.add_knowledge("wa_neighborhoods", "south_richland", 1.15)
        self.add_knowledge("wa_neighborhoods", "central_pasco", 0.95)
        self.add_knowledge("wa_neighborhoods", "finley", 0.90)
        
        # Nearby neighborhoods for comp searches
        self.add_knowledge("wa_neighborhoods", "central_kennewick_nearby", 
                          ["east_kennewick", "south_kennewick", "central_pasco"])
        self.add_knowledge("wa_neighborhoods", "west_richland_nearby", 
                          ["south_richland", "central_richland"])
        
        # Washington market trends (would be regularly updated in a real system)
        self.add_knowledge("wa_market_trends", "monthly_change", 0.006)  # 0.6% monthly appreciation
        self.add_knowledge("wa_market_trends", "annual_change", 0.072)   # 7.2% annual appreciation
        
        # Washington construction costs (based on Marshall & Swift with regional adjustments)
        self.add_knowledge("wa_construction_costs", "base_costs", {
            "residential": {
                "standard": 175.0,
                "custom": 225.0,
                "luxury": 300.0,
                "economy": 140.0
            },
            "apartment": {
                "standard": 165.0,
                "garden": 155.0,
                "mid_rise": 185.0,
                "high_rise": 210.0
            },
            "commercial": {
                "standard": 195.0,
                "office": 205.0,
                "retail": 180.0,
                "restaurant": 220.0
            },
            "industrial": {
                "standard": 125.0,
                "warehouse": 110.0,
                "manufacturing": 145.0,
                "flex": 155.0
            }
        })
        
        # Washington land values (per square foot and per acre)
        self.add_knowledge("wa_land_values", "per_sf", {
            "residential": 10.0,
            "apartment": 15.0,
            "commercial": 18.0,
            "retail": 22.0,
            "office": 20.0,
            "industrial": 8.0
        })
        
        self.add_knowledge("wa_land_values", "per_acre", {
            "residential": 250000.0,
            "agricultural": 25000.0,
            "timber": 10000.0,
            "commercial": 500000.0,
            "industrial": 300000.0
        })
        
        # Washington view type adjustments (critical in WA markets)
        self.add_knowledge("wa_view_adjustments", "factors", {
            "none": 1.00,
            "territorial": 1.05,
            "mountain": 1.10,
            "river": 1.15,
            "water": 1.20,
            "puget_sound": 1.25,
            "lake": 1.20
        })
        
        # Special valuation adjustments per Washington State law
        self.add_knowledge("wa_special_valuations", "types", {
            "historic_property": {
                "rcw": "RCW 84.26",
                "description": "Special valuation for historic properties",
                "requirements": ["Historic designation", "Rehabilitation costs >= 25% of value"],
                "valuation_method": "Subtract rehabilitation costs from value for 10 years"
            },
            "current_use_farm": {
                "rcw": "RCW 84.34",
                "description": "Current use valuation for farm and agricultural land",
                "requirements": ["Agricultural use", "Size and income requirements"],
                "valuation_method": "Value based on farm income potential, not market value"
            },
            "open_space": {
                "rcw": "RCW 84.34",
                "description": "Current use valuation for open space land",
                "requirements": ["Public benefit", "Approved application"],
                "valuation_method": "Value based on current use, not highest and best use"
            },
            "designated_forest_land": {
                "rcw": "RCW 84.33",
                "description": "Special valuation for forest land",
                "requirements": ["5+ acres", "Forest land use", "Approved application"],
                "valuation_method": "Value based on productivity, not market value"
            },
            "senior_exemption": {
                "rcw": "RCW 84.36.381",
                "description": "Senior citizen and disabled persons exemption",
                "requirements": ["Age 61+ or disabled", "Income limits", "Primary residence"],
                "valuation_method": "Valuation not changed, but tax exemption applied"
            }
        })
        
        # Property characteristics for valuation (expanded for Washington markets)
        self.add_knowledge("characteristics", "residential", [
            "lot_size", "building_size", "year_built", "bedrooms", "bathrooms",
            "quality", "condition", "location", "view", "amenities", "waterfront",
            "heating_type", "garage_type", "stories", "basement", "roof_type",
            "exterior_finish", "fireplaces", "school_district", "energy_features"
        ])
        
        self.add_knowledge("characteristics", "commercial", [
            "lot_size", "building_size", "year_built", "zoning", "use_type",
            "income_potential", "expenses", "location", "access", "parking",
            "construction_class", "ceiling_height", "office_pct", "frontage",
            "loading_docks", "retail_exposure", "traffic_count", "visibility"
        ])
    
    # Utility methods
    
    def _parse_time_period(self, time_period: str) -> int:
        """
        Parse a time period string (e.g., '12m', '2y') to months
        
        Args:
            time_period: Time period string
            
        Returns:
            Number of months
        """
        try:
            if time_period.endswith('m'):
                return int(time_period[:-1])
            elif time_period.endswith('y'):
                return int(time_period[:-1]) * 12
            else:
                # Default to interpreting as months
                return int(time_period)
        except (ValueError, TypeError):
            # Default to 12 months if parsing fails
            return 12
    
    def _calculate_market_trends(self, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate market trends from market data
        
        Args:
            market_data: List of market data records
            
        Returns:
            Dictionary of market trends
        """
        # Placeholder method - in a real implementation, this would calculate:
        # - Price trends over time
        # - Sales volume trends
        # - Days on market trends
        # - Price per square foot trends
        
        # For now, returning a placeholder result
        return {
            "price_trend": {
                "monthly_change_pct": 0.0,
                "annual_change_pct": 0.0
            },
            "volume_trend": {
                "monthly_change_pct": 0.0,
                "annual_change_pct": 0.0
            },
            "days_on_market": {
                "current_average": 0,
                "trend_pct": 0.0
            }
        }
    
    def _calculate_market_indices(self, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate market indices from market data
        
        Args:
            market_data: List of market data records
            
        Returns:
            Dictionary of market indices
        """
        # Placeholder method - in a real implementation, this would calculate:
        # - Price indices
        # - Affordability indices
        # - Market activity indices
        
        # For now, returning a placeholder result
        return {
            "price_index": 100.0,
            "affordability_index": 100.0,
            "market_activity_index": 100.0
        }
    
    def _get_neighborhood_adjustment_factor(
        self,
        subject_neighborhood: str,
        comp_neighborhood: str
    ) -> float:
        """
        Calculate neighborhood adjustment factor based on Washington assessment standards
        
        Washington State emphasizes neighborhood delineation as a key factor in the
        assessment process per RCW 84.40.030 - this implements neighborhood equalization
        
        Args:
            subject_neighborhood: Subject property's neighborhood identifier
            comp_neighborhood: Comparable property's neighborhood identifier
            
        Returns:
            Adjustment factor (1.0 = no adjustment)
        """
        # In production, this would query a market-derived neighborhood factor table
        if subject_neighborhood == comp_neighborhood:
            return 1.0
            
        # Check if we have neighborhood factor data in our knowledge base
        # Neighborhood factors are derived from statistical analysis of sales
        # in accordance with Washington assessment standards
        subject_factor = self.get_knowledge("wa_neighborhoods", subject_neighborhood, 1.0)
        comp_factor = self.get_knowledge("wa_neighborhoods", comp_neighborhood, 1.0)
        
        if subject_factor and comp_factor:
            # Calculate relative difference in neighborhood values
            return subject_factor / comp_factor
            
        # Default adjustment for different neighborhoods (5% difference)
        # In a production environment, this would be derived from sales data
        return 0.95
        
    def _get_time_adjustment_factor(
        self,
        subject_date: datetime.date,
        comp_sale_date: datetime.date
    ) -> float:
        """
        Calculate time adjustment factor based on Washington assessment standards
        
        Washington's property tax assessment system requires time adjustments for sales
        older than set timeframes (typically 6-12 months) per RCW 84.40.030 and WAC 458-53
        
        Args:
            subject_date: Assessment date for subject property (typically January 1)
            comp_sale_date: Sale date of comparable property
            
        Returns:
            Time adjustment factor (1.0 = no adjustment)
        """
        if not comp_sale_date or not subject_date:
            return 1.0
            
        # Calculate months between dates
        months_diff = ((subject_date.year - comp_sale_date.year) * 12 + 
                      subject_date.month - comp_sale_date.month)
                      
        # No adjustment for sales within 3 months (WA standard practice)
        if abs(months_diff) <= 3:
            return 1.0
            
        # Get monthly market trend from knowledge base or use default
        # Washington generally expects assessors to develop and apply time adjustments
        monthly_trend = self.get_knowledge("wa_market_trends", "monthly_change", 0.005)
        
        # Calculate cumulative adjustment (compound interest formula)
        adjustment = (1 + monthly_trend) ** months_diff
        
        return adjustment
        
    def _get_view_adjustment_factor(
        self,
        subject_property: Dict[str, Any],
        comp_property: Dict[str, Any]
    ) -> float:
        """
        Calculate view adjustment factor based on Washington assessment standards
        
        Washington State often requires significant adjustments for view properties,
        especially for waterfront, mountain, or city views which have significant 
        impact on market value.
        
        Args:
            subject_property: Subject property data
            comp_property: Comparable property data
            
        Returns:
            View adjustment factor (1.0 = no adjustment)
        """
        subject_view_rating = subject_property.get("view_rating", 0)
        comp_view_rating = comp_property.get("view_rating", 0)
        
        # If both have same view rating, no adjustment needed
        if subject_view_rating == comp_view_rating:
            return 1.0
            
        # View type matters significantly in Washington (water, mountain, etc.)
        subject_view_type = subject_property.get("view_type", "none")
        comp_view_type = comp_property.get("view_type", "none")
        
        # If the view types are different, use predefined adjustments from knowledge base
        if subject_view_type != comp_view_type:
            view_adjustments = self.get_knowledge("wa_view_adjustments", "factors", {})
            subject_factor = view_adjustments.get(subject_view_type, 1.0)
            comp_factor = view_adjustments.get(comp_view_type, 1.0)
            return subject_factor / comp_factor
            
        # Otherwise use rating difference (each point = 2% value difference)
        # Studies in WA markets suggest 2-5% per view rating point
        rating_diff = subject_view_rating - comp_view_rating
        return 1.0 + (rating_diff * 0.02)
        
    def _adjust_comparables(
        self, 
        subject_property: Dict[str, Any], 
        comps: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Apply adjustments to comparable properties using Washington-specific standards
        
        This implements the Washington State adjustment methodology which emphasizes:
        1. Location/neighborhood adjustments (WAC 458-53-020)
        2. Time-based sales adjustments (WAC 458-53-080)
        3. View adjustments (significant in WA waterfront/view markets)
        4. Property characteristic adjustments (size, quality, etc.)
        
        Args:
            subject_property: Subject property data
            comps: List of comparable properties
            
        Returns:
            List of adjusted comparable properties with Washington-specific adjustments
        """
        if not comps:
            return []
            
        adjusted_comps = []
        assessment_date = datetime.datetime.strptime(
            subject_property.get("assessment_date", "2025-01-01"), 
            "%Y-%m-%d"
        ).date()
        
        for comp in comps:
            # Create a copy to avoid modifying original
            adjusted_comp = comp.copy()
            
            # Get original price
            original_price = comp.get("sale_price", 0)
            adjusted_price = original_price
            
            # Track adjustments for reporting
            adjustments = []
            
            # 1. Apply time adjustment (sales date to assessment date)
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(
                        comp["sale_date"], "%Y-%m-%d"
                    ).date()
                    time_factor = self._get_time_adjustment_factor(assessment_date, sale_date)
                    if time_factor != 1.0:
                        time_adjustment = (time_factor - 1.0) * original_price
                        adjusted_price += time_adjustment
                        adjustments.append({
                            "type": "time",
                            "factor": time_factor,
                            "amount": time_adjustment,
                            "description": f"Time adjustment ({comp['sale_date']} to assessment date)"
                        })
                except (ValueError, TypeError):
                    # If date parsing fails, skip time adjustment
                    pass
                    
            # 2. Apply neighborhood adjustment
            subject_neighborhood = subject_property.get("neighborhood", "")
            comp_neighborhood = comp.get("neighborhood", "")
            if subject_neighborhood and comp_neighborhood and subject_neighborhood != comp_neighborhood:
                neighborhood_factor = self._get_neighborhood_adjustment_factor(
                    subject_neighborhood, comp_neighborhood
                )
                if neighborhood_factor != 1.0:
                    neighborhood_adjustment = (neighborhood_factor - 1.0) * original_price
                    adjusted_price += neighborhood_adjustment
                    adjustments.append({
                        "type": "neighborhood",
                        "factor": neighborhood_factor,
                        "amount": neighborhood_adjustment,
                        "description": f"Neighborhood adjustment ({comp_neighborhood} to {subject_neighborhood})"
                    })
                    
            # 3. Apply view adjustment (very important in Washington State)
            view_factor = self._get_view_adjustment_factor(subject_property, comp)
            if view_factor != 1.0:
                view_adjustment = (view_factor - 1.0) * original_price
                adjusted_price += view_adjustment
                adjustments.append({
                    "type": "view",
                    "factor": view_factor,
                    "amount": view_adjustment,
                    "description": f"View adjustment"
                })
                
            # 4. Apply size adjustment (standard practice)
            subject_sqft = subject_property.get("building_area", 0)
            comp_sqft = comp.get("building_area", 0)
            if subject_sqft and comp_sqft and subject_sqft != comp_sqft:
                # Size adjustment using diminishing returns formula (standard in WA)
                size_diff_percent = (subject_sqft - comp_sqft) / comp_sqft
                # Apply with diminishing returns (0.5 factor typical in WA)
                size_factor = 1.0 + (size_diff_percent * 0.5)
                size_adjustment = (size_factor - 1.0) * original_price
                adjusted_price += size_adjustment
                adjustments.append({
                    "type": "size",
                    "factor": size_factor,
                    "amount": size_adjustment,
                    "description": f"Size adjustment ({comp_sqft} to {subject_sqft} sqft)"
                })
                
            # 5. Apply quality/condition adjustment
            subject_quality = subject_property.get("quality_grade", "average")
            comp_quality = comp.get("quality_grade", "average")
            if subject_quality != comp_quality:
                # Quality grade lookup table (typical in WA assessment)
                quality_factors = {
                    "low": 0.85,
                    "fair": 0.92,
                    "average": 1.0,
                    "good": 1.08,
                    "excellent": 1.15,
                    "luxury": 1.25
                }
                subject_quality_factor = quality_factors.get(subject_quality, 1.0)
                comp_quality_factor = quality_factors.get(comp_quality, 1.0)
                quality_factor = subject_quality_factor / comp_quality_factor
                quality_adjustment = (quality_factor - 1.0) * original_price
                adjusted_price += quality_adjustment
                adjustments.append({
                    "type": "quality",
                    "factor": quality_factor,
                    "amount": quality_adjustment,
                    "description": f"Quality adjustment ({comp_quality} to {subject_quality})"
                })
            
            # Store the adjusted price and all adjustments
            adjusted_comp["adjusted_price"] = adjusted_price
            adjusted_comp["adjustments"] = adjustments
            adjusted_comp["total_adjustment"] = adjusted_price - original_price
            adjusted_comp["total_adjustment_percent"] = ((adjusted_price - original_price) / original_price) * 100 if original_price else 0
            
            # In Washington State, if total adjustment exceeds 25%, the comp is considered less reliable
            adjusted_comp["reliability"] = "low" if abs(adjusted_comp["total_adjustment_percent"]) > 25 else "high"
            
            adjusted_comps.append(adjusted_comp)
            
        return adjusted_comps
    
    def _reconcile_comparable_values(self, adjusted_comps: List[Dict[str, Any]]) -> float:
        """
        Reconcile a final value from adjusted comparables using Washington-specific standards
        
        Washington assessors typically use a weighted reconciliation approach that considers:
        1. The reliability of each comparable (adjustment percentage)
        2. The recency of the sale (more recent sales given higher weight)
        3. The similarity of property characteristics
        
        Args:
            adjusted_comps: List of adjusted comparable properties
            
        Returns:
            Reconciled value per Washington valuation standards
        """
        if not adjusted_comps:
            return 0.0
            
        # Get adjusted prices from all comparables
        prices = [comp.get("adjusted_price", 0) for comp in adjusted_comps]
        
        # If we have fewer than 3 comparables, just use simple average
        # Washington assessors typically require 3-5 comparables minimum
        if len(adjusted_comps) < 3:
            return sum(prices) / len(prices) if prices else 0.0
            
        # Calculate weights based on reliability and total adjustment percentage
        # In Washington, comparables with smaller adjustment percentages are given more weight
        weights = []
        for comp in adjusted_comps:
            # Base weight starts at 1.0
            weight = 1.0
            
            # Adjust weight based on reliability
            reliability = comp.get("reliability", "high")
            if reliability == "low":
                weight *= 0.5
                
            # Adjust weight based on total adjustment percentage
            # Washington assessors typically discount comps with large adjustments
            adj_percent = abs(comp.get("total_adjustment_percent", 0))
            if adj_percent > 20:
                weight *= 0.7
            elif adj_percent > 10:
                weight *= 0.9
                
            # Adjust weight based on sale date recency (if available)
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(comp["sale_date"], "%Y-%m-%d").date()
                    today = datetime.date.today()
                    months_ago = ((today.year - sale_date.year) * 12 + 
                                  today.month - sale_date.month)
                    
                    # More recent sales get higher weight
                    if months_ago <= 3:
                        weight *= 1.2  # Very recent sales (0-3 months)
                    elif months_ago <= 6:
                        weight *= 1.1  # Recent sales (3-6 months)
                    elif months_ago > 12:
                        weight *= 0.8  # Older sales (> 12 months)
                except (ValueError, TypeError):
                    # If date parsing fails, don't adjust weight
                    pass
                    
            weights.append(weight)
            
        # Normalize weights
        total_weight = sum(weights)
        if total_weight > 0:
            normalized_weights = [w / total_weight for w in weights]
        else:
            # If all weights are 0, use equal weights
            normalized_weights = [1.0 / len(adjusted_comps)] * len(adjusted_comps)
            
        # Calculate weighted average
        weighted_value = sum(p * w for p, w in zip(prices, normalized_weights))
        
        # In Washington, assessors often round to nearest hundred for residential
        return round(weighted_value / 100) * 100
    
    def _calculate_confidence_score(self, adjusted_comps: List[Dict[str, Any]]) -> float:
        """
        Calculate a confidence score for the valuation based on Washington assessment standards
        
        Washington State requires high confidence levels for assessment valuations,
        typically measured through statistical reliability metrics like COD
        (Coefficient of Dispersion) and comparable quality analysis
        
        Args:
            adjusted_comps: List of adjusted comparable properties
            
        Returns:
            Confidence score between 0 and 1
        """
        if not adjusted_comps:
            return 0.0
            
        # Base factors affecting confidence in Washington assessments
        num_comps = len(adjusted_comps)
        
        # 1. Number of comparables factor (WA assessors typically want 3-5 minimum)
        if num_comps >= 5:
            num_factor = 1.0
        elif num_comps >= 3:
            num_factor = 0.8
        elif num_comps >= 1:
            num_factor = 0.5
        else:
            return 0.0
            
        # 2. Adjustment size factor (smaller adjustments = higher confidence)
        # Calculate average absolute adjustment percentage
        total_adj_percent = sum(abs(comp.get("total_adjustment_percent", 0)) 
                              for comp in adjusted_comps)
        avg_adj_percent = total_adj_percent / num_comps if num_comps > 0 else 100
        
        # Washington assessors prefer adjustments under 15% for high confidence
        if avg_adj_percent <= 10:
            adj_factor = 1.0
        elif avg_adj_percent <= 15:
            adj_factor = 0.9
        elif avg_adj_percent <= 25:
            adj_factor = 0.7
        else:
            adj_factor = 0.5
            
        # 3. Sale date recency factor (more recent sales = higher confidence)
        # Check if we have sale dates
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
            
            # Washington typically prefers sales within 12 months
            if avg_months <= 6:
                time_factor = 1.0
            elif avg_months <= 12:
                time_factor = 0.9
            elif avg_months <= 24:
                time_factor = 0.7
            else:
                time_factor = 0.5
        else:
            time_factor = 0.7  # Default if no dates available
            
        # 4. Value consistency factor (coefficient of dispersion)
        if num_comps >= 3:
            # Get adjusted values
            values = [comp.get("adjusted_price", 0) for comp in adjusted_comps]
            median_value = statistics.median(values) if values else 0
            
            # Calculate average absolute deviation from median
            if median_value > 0:
                # This is a simplified COD calculation (Coefficient of Dispersion)
                # Washington typically wants COD under 15% for residential properties
                deviations = [abs(val - median_value) for val in values]
                avg_deviation = sum(deviations) / len(deviations) if deviations else 0
                cod = (avg_deviation / median_value) * 100 if median_value > 0 else 0
                
                if cod <= 10:
                    consistency_factor = 1.0  # Excellent consistency
                elif cod <= 15:
                    consistency_factor = 0.9  # Good consistency
                elif cod <= 20:
                    consistency_factor = 0.8  # Fair consistency
                else:
                    consistency_factor = 0.6  # Poor consistency
            else:
                consistency_factor = 0.6
        else:
            consistency_factor = 0.7  # Default if not enough comps for statistical analysis
            
        # 5. Quality of comparables factor
        # Count high reliability comps
        high_reliability_count = sum(1 for comp in adjusted_comps 
                                 if comp.get("reliability", "") == "high")
        quality_factor = high_reliability_count / num_comps if num_comps > 0 else 0
        
        # Combine all factors with appropriate weights based on Washington practices
        # Coefficients reflect Washington's emphasis on data quality and recency
        confidence_score = (
            num_factor * 0.15 +          # Number of comps
            adj_factor * 0.25 +          # Adjustment size
            time_factor * 0.20 +         # Time relevance
            consistency_factor * 0.25 +  # Data consistency
            quality_factor * 0.15        # Comp quality
        )
        
        # Final score normalized to 0-1 range
        return min(max(confidence_score, 0.0), 1.0)