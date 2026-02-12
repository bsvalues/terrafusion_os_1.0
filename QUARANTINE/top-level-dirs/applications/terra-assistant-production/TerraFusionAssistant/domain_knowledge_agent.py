"""
Domain Knowledge Agent

This module provides a specialized agent for integrating domain-specific knowledge
in areas of tax assessment, real estate statistics, GIS, databases, appraisal, 
and local market factors into the TerraFusion platform.
"""

import os
import re
import json
import time
import random
import logging
from typing import Dict, List, Any, Optional, Union
import datetime

# Ensure we have the correct imports for domain knowledge
try:
    import anthropic
except ImportError:
    # Not critical for basic functionality
    pass

# Import the simplified agent base
from simple_agent_base import Agent, AgentCategory

class DomainKnowledgeAgent(Agent):
    """
    Agent for providing domain-specific knowledge and insights.
    
    This agent specializes in:
    - Tax assessment methodologies and regulations
    - Real estate market statistics and analysis
    - GIS (Geographic Information Systems) data integration
    - Database optimization for property data
    - Property appraisal techniques and models
    - Local market factor analysis
    """
    
    def __init__(self, agent_id: str = "domain_knowledge_agent", 
                capabilities: Optional[List[str]] = None):
        """Initialize the Domain Knowledge Agent"""
        if capabilities is None:
            capabilities = [
                "tax_assessment_analysis",
                "real_estate_statistics",
                "gis_data_analysis",
                "database_recommendations",
                "appraisal_insights",
                "local_market_analysis"
            ]
        
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.DOMAIN_EXPERT,
            capabilities=capabilities
        )
        
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Initialize external model access
        self._initialize_model_interface()
        
        # Load domain-specific knowledge bases
        self._load_knowledge_bases()
    
    def _initialize_model_interface(self):
        """Initialize interface for specialized AI models"""
        try:
            # Import our enhanced multi-model interface
            from multi_model_interface import MultiModelInterface
            self.model_interface = MultiModelInterface(preferred_model="claude-3-5-sonnet-20241022")
            
            # Log available models
            available_models = self.model_interface.get_available_models()
            available_providers = self.model_interface.get_available_providers()
            
            self.logger.info(f"Successfully initialized multi-model interface with {len(available_models)} models")
            self.logger.info(f"Available providers: {', '.join(available_providers)}")
            self.logger.info(f"Available models: {', '.join(available_models)}")
        except Exception as e:
            self.logger.error(f"Error initializing model interface: {str(e)}")
            self.model_interface = None
    
    def _load_knowledge_bases(self):
        """Load specialized knowledge bases"""
        self.knowledge_bases = {
            "tax_assessment": {
                "methodologies": ["Market Value", "Income Approach", "Cost Approach", "Sales Comparison"],
                "regulations": {
                    "assessment_frequency": "Annual",
                    "appeal_processes": ["Informal Review", "Formal Appeal", "State Board", "Court Appeal"],
                    "exemptions": ["Homestead", "Senior", "Veterans", "Disability", "Agricultural"]
                },
                "calculation_methods": {
                    "cap_rate": "Net Operating Income / Property Value",
                    "gross_rent_multiplier": "Property Price / Annual Gross Rental Income",
                    "replacement_cost": "Cost to rebuild - Depreciation + Land Value"
                }
            },
            "real_estate": {
                "market_indicators": ["Days on Market", "List-to-Sale Ratio", "Absorption Rate", "Inventory Levels"],
                "valuation_metrics": ["Price per Square Foot", "Capitalization Rate", "Gross Rent Multiplier", "Cash on Cash Return"],
                "property_categories": ["Residential", "Commercial", "Industrial", "Agricultural", "Special Use"]
            },
            "gis": {
                "data_layers": ["Parcels", "Zoning", "Flood Zones", "School Districts", "Tax Districts"],
                "spatial_operations": ["Buffer Analysis", "Overlay Analysis", "Network Analysis", "Proximity Analysis"],
                "coordinate_systems": ["State Plane", "UTM", "Geographic (Lat/Long)", "Web Mercator"]
            },
            "appraisal": {
                "approaches": ["Sales Comparison", "Income", "Cost", "Hybrid"],
                "adjustment_factors": ["Location", "Size", "Age", "Condition", "Quality", "Amenities"],
                "valuation_models": ["Hedonic", "Multiple Regression", "Paired Sales", "Depreciated Cost"]
            },
            "local_market": {
                "influencing_factors": ["School Quality", "Crime Rates", "Walkability", "Transit Access", "Employment Centers"],
                "economic_indicators": ["Population Growth", "Unemployment Rate", "Income Levels", "Building Permits", "Business Formation"],
                "neighborhood_trends": ["Gentrification", "Revitalization", "Stability", "Decline"]
            }
        }
    
    def _execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task assigned to this agent.
        
        Args:
            task: The task to execute
        
        Returns:
            Dict containing the result of the task execution
        """
        task_type = task.get("type", "unknown")
        result = {"status": "error", "message": f"Unknown task type: {task_type}"}
        
        # Implement task execution logic here
        if task_type == "tax_assessment_analysis":
            result = self._tax_assessment_task(task)
        elif task_type == "real_estate_statistics":
            result = self._real_estate_statistics_task(task)
        elif task_type == "gis_data_analysis":
            result = self._gis_data_analysis_task(task)
        elif task_type == "database_recommendations":
            result = self._database_recommendations_task(task)
        elif task_type == "appraisal_insights":
            result = self._appraisal_insights_task(task)
        elif task_type == "local_market_analysis":
            result = self._local_market_analysis_task(task)
        elif task_type == "query_domain_knowledge":
            result = self._query_domain_knowledge(task)
        
        return result
    
    def _tax_assessment_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tax assessment analysis task"""
        property_data = task.get("property_data", {})
        methodology = task.get("methodology", "market_value")
        
        # Generate sample insights based on the knowledge base
        methodologies = self.knowledge_bases["tax_assessment"]["methodologies"]
        regulations = self.knowledge_bases["tax_assessment"]["regulations"]
        
        try:
            # In a real implementation, this would use actual property data and models
            if methodology == "market_value":
                assessment_value = property_data.get("recent_sale_price", 0) * 0.9
                confidence = 0.85
                factors = ["Recent Sales", "Comparable Properties"]
            elif methodology == "income_approach":
                noi = property_data.get("annual_income", 0) - property_data.get("annual_expenses", 0)
                cap_rate = 0.06  # Example cap rate
                assessment_value = noi / cap_rate if cap_rate else 0
                confidence = 0.78
                factors = ["Net Operating Income", "Market Cap Rate"]
            elif methodology == "cost_approach":
                land_value = property_data.get("land_value", 0)
                improvement_value = property_data.get("improvement_value", 0) * (1 - property_data.get("depreciation", 0.2))
                assessment_value = land_value + improvement_value
                confidence = 0.72
                factors = ["Land Value", "Improvement Value", "Depreciation"]
            else:
                assessment_value = property_data.get("estimated_value", 0)
                confidence = 0.65
                factors = ["Estimated Value"]
            
            # Calculate potential exemptions
            exemption_value = 0
            applicable_exemptions = []
            if property_data.get("is_primary_residence"):
                exemption_value += 25000
                applicable_exemptions.append("Homestead")
            if property_data.get("owner_age", 0) >= 65:
                exemption_value += 15000
                applicable_exemptions.append("Senior")
            
            return {
                "status": "success",
                "assessment_value": assessment_value,
                "confidence": confidence,
                "methodology_used": methodology,
                "factors_considered": factors,
                "applicable_exemptions": applicable_exemptions,
                "exemption_value": exemption_value,
                "net_assessed_value": max(0, assessment_value - exemption_value),
                "appeal_options": regulations["appeal_processes"]
            }
        except Exception as e:
            self.logger.error(f"Error in tax assessment analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Assessment analysis failed: {str(e)}"
            }
    
    def _real_estate_statistics_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a real estate statistics task"""
        location = task.get("location", {})
        property_type = task.get("property_type", "residential")
        time_period = task.get("time_period", "last_quarter")
        
        try:
            # In a real implementation, this would query actual market data
            if property_type.lower() == "residential":
                avg_price = random.uniform(250000, 450000)
                median_price = random.uniform(220000, 400000)
                price_change = random.uniform(-0.05, 0.15)
                avg_days_on_market = random.randint(15, 60)
                inventory_months = random.uniform(1.5, 6.0)
            elif property_type.lower() == "commercial":
                avg_price = random.uniform(1000000, 5000000)
                median_price = random.uniform(900000, 4500000)
                price_change = random.uniform(-0.08, 0.12)
                avg_days_on_market = random.randint(30, 120)
                inventory_months = random.uniform(3.0, 12.0)
            else:
                avg_price = random.uniform(150000, 3000000)
                median_price = random.uniform(140000, 2750000)
                price_change = random.uniform(-0.1, 0.1)
                avg_days_on_market = random.randint(20, 90)
                inventory_months = random.uniform(2.0, 9.0)
            
            # Generate metrics based on the knowledge base
            market_indicators = self.knowledge_bases["real_estate"]["market_indicators"]
            valuation_metrics = self.knowledge_bases["real_estate"]["valuation_metrics"]
            
            return {
                "status": "success",
                "location": location,
                "property_type": property_type,
                "time_period": time_period,
                "average_price": avg_price,
                "median_price": median_price,
                "price_change_percent": price_change,
                "days_on_market": avg_days_on_market,
                "months_of_inventory": inventory_months,
                "market_indicators_tracked": market_indicators,
                "price_per_sqft": avg_price / random.randint(1500, 3000),
                "list_to_sale_ratio": random.uniform(0.92, 0.98),
                "market_condition": "Seller's Market" if inventory_months < 4 else "Buyer's Market",
                "trending_direction": "Up" if price_change > 0.03 else "Down" if price_change < -0.03 else "Stable"
            }
        except Exception as e:
            self.logger.error(f"Error in real estate statistics: {str(e)}")
            return {
                "status": "error",
                "message": f"Real estate statistics failed: {str(e)}"
            }
    
    def _gis_data_analysis_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a GIS data analysis task"""
        location = task.get("location", {})
        analysis_type = task.get("analysis_type", "proximity")
        parameters = task.get("parameters", {})
        
        try:
            # In a real implementation, this would connect to GIS systems
            # Generate insights based on the knowledge base
            data_layers = self.knowledge_bases["gis"]["data_layers"]
            spatial_operations = self.knowledge_bases["gis"]["spatial_operations"]
            
            if analysis_type == "proximity":
                radius = parameters.get("radius", 1.0)
                poi_type = parameters.get("poi_type", "schools")
                
                return {
                    "status": "success",
                    "analysis_type": analysis_type,
                    "location": location,
                    "radius_miles": radius,
                    "poi_type": poi_type,
                    "results": {
                        "count": random.randint(1, 10),
                        "nearest_distance": random.uniform(0.1, radius),
                        "average_distance": random.uniform(radius/3, radius*0.8),
                        "points_of_interest": [
                            {
                                "name": f"{poi_type.title()} {i}",
                                "distance": random.uniform(0.1, radius),
                                "rating": random.uniform(1.0, 5.0)
                            } for i in range(1, random.randint(2, 6))
                        ]
                    },
                    "map_layers_used": random.sample(data_layers, k=min(3, len(data_layers))),
                    "spatial_method": "Buffer Analysis"
                }
            elif analysis_type == "overlay":
                layers = parameters.get("layers", ["zoning", "flood_zones"])
                
                return {
                    "status": "success",
                    "analysis_type": analysis_type,
                    "location": location,
                    "layers_analyzed": layers,
                    "results": {
                        "zone_type": random.choice(["Residential", "Commercial", "Mixed Use", "Industrial"]),
                        "flood_risk": random.choice(["None", "Minimal", "Moderate", "High"]),
                        "overlay_results": {
                            "area_sqft": random.randint(5000, 50000),
                            "percent_in_flood_zone": random.uniform(0, 0.5),
                            "percent_commercial_zoned": random.uniform(0, 1.0)
                        }
                    },
                    "map_layers_used": layers,
                    "spatial_method": "Overlay Analysis"
                }
            else:
                return {
                    "status": "success",
                    "analysis_type": "general",
                    "location": location,
                    "available_operations": spatial_operations,
                    "available_layers": data_layers,
                    "recommended_analysis": random.choice(spatial_operations)
                }
        except Exception as e:
            self.logger.error(f"Error in GIS data analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"GIS analysis failed: {str(e)}"
            }
    
    def _database_recommendations_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a database recommendations task"""
        schema_info = task.get("schema_info", {})
        query_patterns = task.get("query_patterns", [])
        optimization_target = task.get("optimization_target", "performance")
        
        try:
            # In a real implementation, this would analyze actual DB schema and query patterns
            tables = schema_info.get("tables", [])
            
            # Generate recommendations based on property database patterns
            index_recommendations = []
            if "properties" in tables:
                index_recommendations.append({
                    "table": "properties",
                    "columns": ["location_id", "parcel_id", "tax_year"],
                    "recommendation": "Create a composite index on frequently queried columns",
                    "priority": "high"
                })
            
            if "assessments" in tables:
                index_recommendations.append({
                    "table": "assessments",
                    "columns": ["property_id", "assessment_date"],
                    "recommendation": "Create index to improve historical assessment queries",
                    "priority": "medium"
                })
            
            partitioning_recommendations = []
            if optimization_target == "performance" and "transactions" in tables:
                partitioning_recommendations.append({
                    "table": "transactions",
                    "strategy": "RANGE",
                    "column": "transaction_date",
                    "recommendation": "Partition by year to improve query performance on recent data",
                    "priority": "high"
                })
            
            # Add schema recommendations for property data
            schema_recommendations = []
            if "properties" in tables and optimization_target == "storage":
                schema_recommendations.append({
                    "table": "properties",
                    "recommendation": "Use JSONB for flexible attributes instead of many sparse columns",
                    "priority": "medium",
                    "estimated_impact": "30% storage reduction, 10% query overhead"
                })
            
            return {
                "status": "success",
                "optimization_target": optimization_target,
                "index_recommendations": index_recommendations,
                "partitioning_recommendations": partitioning_recommendations,
                "schema_recommendations": schema_recommendations,
                "query_optimizations": [
                    {
                        "pattern": "Range queries on assessment dates",
                        "recommendation": "Use BETWEEN instead of >= and <= for better optimizer hints",
                        "priority": "medium"
                    },
                    {
                        "pattern": "Spatial data queries",
                        "recommendation": "Use spatial indexes and ST_DWithin instead of radius calculations",
                        "priority": "high"
                    }
                ]
            }
        except Exception as e:
            self.logger.error(f"Error in database recommendations: {str(e)}")
            return {
                "status": "error",
                "message": f"Database recommendations failed: {str(e)}"
            }
    
    def _appraisal_insights_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an appraisal insights task"""
        property_data = task.get("property_data", {})
        appraisal_method = task.get("appraisal_method", "sales_comparison")
        
        try:
            # In a real implementation, this would use actual property data and appraisal models
            approaches = self.knowledge_bases["appraisal"]["approaches"]
            adjustment_factors = self.knowledge_bases["appraisal"]["adjustment_factors"]
            
            # Generate sample appraisal insights
            if appraisal_method == "sales_comparison":
                comparable_properties = [
                    {
                        "id": f"COMP-{i}",
                        "sale_price": random.uniform(80, 120) * property_data.get("estimated_value", 300000) / 100,
                        "sale_date": (datetime.datetime.now() - datetime.timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d"),
                        "adjustments": {
                            factor: random.uniform(-0.1, 0.1) for factor in random.sample(adjustment_factors, k=min(3, len(adjustment_factors)))
                        },
                        "adjusted_price": 0  # Will be calculated
                    } for i in range(1, 4)
                ]
                
                # Calculate adjusted prices
                for comp in comparable_properties:
                    adjustment_total = sum(comp["adjustments"].values())
                    comp["adjusted_price"] = comp["sale_price"] * (1 + adjustment_total)
                
                avg_adjusted_price = sum(comp["adjusted_price"] for comp in comparable_properties) / len(comparable_properties)
                
                return {
                    "status": "success",
                    "appraisal_method": appraisal_method,
                    "property_data": {k: v for k, v in property_data.items() if k != "full_description"},  # Omit long fields
                    "comparable_properties": comparable_properties,
                    "adjustment_factors_used": list(comparable_properties[0]["adjustments"].keys()),
                    "estimated_value": avg_adjusted_price,
                    "confidence_level": random.uniform(0.7, 0.9),
                    "market_conditions": random.choice(["Rising", "Stable", "Declining"]),
                    "value_range": {
                        "low": avg_adjusted_price * 0.9,
                        "high": avg_adjusted_price * 1.1
                    }
                }
            elif appraisal_method == "income_approach":
                potential_gross_income = property_data.get("annual_rent", 0) * 12
                vacancy_rate = random.uniform(0.03, 0.1)
                effective_gross_income = potential_gross_income * (1 - vacancy_rate)
                operating_expenses = effective_gross_income * random.uniform(0.3, 0.5)
                net_operating_income = effective_gross_income - operating_expenses
                cap_rate = random.uniform(0.04, 0.08)
                
                return {
                    "status": "success",
                    "appraisal_method": appraisal_method,
                    "income_analysis": {
                        "potential_gross_income": potential_gross_income,
                        "vacancy_rate": vacancy_rate,
                        "effective_gross_income": effective_gross_income,
                        "operating_expenses": operating_expenses,
                        "net_operating_income": net_operating_income,
                        "capitalization_rate": cap_rate,
                        "market_cap_rates": {
                            "min": cap_rate - 0.01,
                            "typical": cap_rate,
                            "max": cap_rate + 0.01
                        }
                    },
                    "estimated_value": net_operating_income / cap_rate if cap_rate else 0,
                    "confidence_level": random.uniform(0.65, 0.85)
                }
            else:
                return {
                    "status": "success",
                    "available_methods": approaches,
                    "recommended_method": random.choice(approaches),
                    "factors_to_consider": adjustment_factors
                }
        except Exception as e:
            self.logger.error(f"Error in appraisal insights: {str(e)}")
            return {
                "status": "error",
                "message": f"Appraisal insights failed: {str(e)}"
            }
    
    def _local_market_analysis_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a local market analysis task"""
        location = task.get("location", {})
        market_factors = task.get("market_factors", ["all"])
        
        try:
            # In a real implementation, this would use actual market data
            all_factors = self.knowledge_bases["local_market"]["influencing_factors"]
            economic_indicators = self.knowledge_bases["local_market"]["economic_indicators"]
            
            # If "all" is specified, include all factors
            if "all" in market_factors:
                market_factors = all_factors + economic_indicators
            
            factor_analysis = {}
            
            # Generate sample insights for each requested factor
            for factor in market_factors:
                if factor == "school_quality":
                    factor_analysis[factor] = {
                        "rating": random.uniform(3.0, 9.0),
                        "percentile": random.uniform(0.3, 0.9),
                        "impact_on_value": random.uniform(0.05, 0.15),
                        "trend": random.choice(["Improving", "Stable", "Declining"])
                    }
                elif factor == "crime_rates":
                    factor_analysis[factor] = {
                        "rating": random.uniform(2.0, 8.0),
                        "percentile": random.uniform(0.2, 0.9),
                        "impact_on_value": random.uniform(-0.12, -0.02),
                        "trend": random.choice(["Improving", "Stable", "Worsening"])
                    }
                elif factor == "walkability":
                    factor_analysis[factor] = {
                        "score": random.uniform(20, 95),
                        "percentile": random.uniform(0.1, 0.9),
                        "impact_on_value": random.uniform(0.01, 0.08),
                        "notable_amenities": ["Grocery", "Parks", "Restaurants"]
                    }
                elif factor == "population_growth":
                    factor_analysis[factor] = {
                        "annual_rate": random.uniform(-0.02, 0.05),
                        "comparison_to_metro": random.uniform(-0.01, 0.02),
                        "forecast": random.uniform(-0.01, 0.04),
                        "impact_on_demand": "Positive" if random.random() > 0.3 else "Neutral"
                    }
                elif factor == "income_levels":
                    factor_analysis[factor] = {
                        "median_household": random.randint(45000, 120000),
                        "comparison_to_metro": random.uniform(0.7, 1.3),
                        "trend": random.choice(["Rising", "Stable", "Declining"]),
                        "impact_on_prices": random.choice(["Strong positive", "Moderate positive", "Neutral"])
                    }
                else:
                    factor_analysis[factor] = {
                        "score": random.uniform(1, 10),
                        "relative_importance": random.uniform(0.1, 0.9),
                        "trend": random.choice(["Improving", "Stable", "Declining"])
                    }
            
            # Overall market summary
            positive_factors = sum(1 for f in factor_analysis.values() 
                                  if isinstance(f, dict) and f.get("trend") == "Improving")
            negative_factors = sum(1 for f in factor_analysis.values() 
                                  if isinstance(f, dict) and f.get("trend") == "Declining")
            
            market_direction = "Improving"
            if negative_factors > positive_factors:
                market_direction = "Declining"
            elif abs(negative_factors - positive_factors) <= 1:
                market_direction = "Stable"
            
            return {
                "status": "success",
                "location": location,
                "factor_analysis": factor_analysis,
                "market_summary": {
                    "direction": market_direction,
                    "strength": random.choice(["Strong", "Moderate", "Weak"]),
                    "opportunity_level": random.uniform(0.1, 0.9),
                    "risk_level": random.uniform(0.1, 0.9),
                    "price_forecast": f"{random.uniform(-5, 10):.1f}% annual appreciation"
                },
                "top_positive_factors": [f for f in factor_analysis.keys()],
                "top_negative_factors": []
            }
        except Exception as e:
            self.logger.error(f"Error in local market analysis: {str(e)}")
            return {
                "status": "error",
                "message": f"Local market analysis failed: {str(e)}"
            }
    
    def _query_domain_knowledge(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a domain knowledge query task using LLMs"""
        query = task.get("query", "")
        domain = task.get("domain", "general")
        context = task.get("context", {})
        model_preference = task.get("model", None)
        # Check if we're comparing models
        comparison_models = task.get("comparison_models", None)
        
        try:
            # Use the multi-model interface to get specialized knowledge
            if self.model_interface:
                # Add domain knowledge to context
                if domain in self.knowledge_bases:
                    if "domain_knowledge" not in context:
                        context["domain_knowledge"] = {}
                    context["domain_knowledge"] = self.knowledge_bases[domain]
                
                # Check if we're comparing models
                if comparison_models:
                    # Use multiple models comparison mode
                    self.logger.info(f"Comparing models: {comparison_models}")
                    
                    # Get response from multiple models
                    multi_model_results = self.model_interface.analyze_with_multiple_models(
                        prompt=query,
                        system_message=self._get_domain_system_message(domain),
                        models=comparison_models,
                        max_tokens=1000,
                        temperature=0.3
                    )
                    
                    # Format for UI display
                    comparison_results = {}
                    for model_name, model_response in multi_model_results.get("responses", {}).items():
                        comparison_results[model_name] = {
                            "text": model_response.get("text", "No response generated"),
                            "latency": model_response.get("metadata", {}).get("latency", 0),
                            "token_count": model_response.get("metadata", {}).get("token_count", 0),
                            "provider": model_response.get("metadata", {}).get("provider", "unknown")
                        }
                    
                    return {
                        "status": "success",
                        "query": query,
                        "domain": domain,
                        "comparison_results": comparison_results,
                        "model_comparison": True,
                        "timestamp": datetime.datetime.now().isoformat(),
                        "errors": multi_model_results.get("errors", {})
                    }
                else:
                    # Single model mode
                    # Select the best model for the domain if not specified
                    model_to_use = model_preference
                    if not model_to_use:
                        # Choose appropriate model based on domain
                        if domain in ["tax_assessment", "appraisal"]:
                            model_candidates = ["claude-3-5-sonnet-20241022", "gpt-4o", "gemini-pro"]
                        elif domain in ["gis", "database"]:
                            model_candidates = ["gpt-4o", "deepseek-coder", "claude-3-5-sonnet-20241022"]
                        elif domain in ["real_estate", "local_market"]:
                            model_candidates = ["claude-3-5-sonnet-20241022", "gpt-4o", "gemini-pro"]
                        else:
                            model_candidates = ["gpt-4o", "claude-3-5-sonnet-20241022"]
                        
                        # Select first available model from candidates
                        available_models = self.model_interface.get_available_models()
                        for model in model_candidates:
                            if model in available_models:
                                model_to_use = model
                                break
                    
                    # Get expert response
                    response_text, metadata = self.model_interface.get_domain_expert_response(
                        query=query,
                        domain=domain,
                        context=context,
                        model=model_to_use
                    )
                    
                    # Return the response with metadata
                    return {
                        "status": "success",
                        "query": query,
                        "domain": domain,
                        "response": response_text,
                        "source": metadata.get("model", "enhanced_knowledge_model"),
                        "provider": metadata.get("provider", "unknown"),
                        "latency": metadata.get("latency", 0),
                        "timestamp": metadata.get("timestamp", datetime.datetime.now().isoformat())
                    }
            else:
                # Fallback to basic knowledge base retrieval
                if domain in self.knowledge_bases:
                    return {
                        "status": "success",
                        "query": query,
                        "domain": domain,
                        "response": f"Here is information about {domain}: {json.dumps(self.knowledge_bases[domain], indent=2)}",
                        "source": "static_knowledge_base"
                    }
                else:
                    return {
                        "status": "warning",
                        "message": f"No specialized knowledge base available for domain: {domain}",
                        "available_domains": list(self.knowledge_bases.keys())
                    }
        except Exception as e:
            self.logger.error(f"Error in domain knowledge query: {str(e)}")
            return {
                "status": "error",
                "message": f"Domain knowledge query failed: {str(e)}",
                "query": query
            }
    
    def _get_domain_system_message(self, domain: str) -> str:
        """Get the domain-specific system message for prompting an AI model"""
        if domain == "tax_assessment":
            return """You are a professional property tax assessor with extensive knowledge of assessment methodologies, 
            tax regulations, exemptions, and appeal processes. Your expertise includes market value, income, and cost approaches 
            to value. Provide detailed, accurate responses that would help property owners understand their assessments."""
        elif domain == "real_estate":
            return """You are a real estate market expert with deep knowledge of property valuation, market trends, 
            investment analysis, and market indicators. You understand both residential and commercial real estate dynamics, 
            financing, and return metrics. Provide practical insights that would help investors and property owners make 
            informed decisions."""
        elif domain == "gis":
            return """You are a Geographic Information Systems (GIS) specialist with expertise in spatial analysis, 
            map layers, coordinate systems, and property-related GIS applications. You understand how location factors 
            impact property values and how to analyze geographic data for real estate purposes. Provide technically 
            accurate but accessible explanations."""
        elif domain == "appraisal":
            return """You are a licensed property appraiser with extensive experience in the sales comparison, 
            income, and cost approaches to value. You understand adjustment factors, capitalization rates, depreciation, 
            and valuation models. Provide professional insights that explain appraisal methodologies and considerations."""
        elif domain == "local_market":
            return """You are a local market analyst specializing in neighborhood-level factors that influence 
            property values, including schools, crime, walkability, demographics, and economic indicators. You understand 
            how these factors interact and their relative impact on different property types. Provide nuanced analysis 
            of local market dynamics."""
        elif domain == "database":
            return """You are a database architect specializing in real estate and property assessment databases. 
            You understand data modeling for property records, GIS integration, optimization techniques, and query patterns 
            for property data. Provide expert guidance on database design, performance, and best practices."""
        else:
            return f"""You are a domain expert in {domain}. Provide accurate, helpful information 
            based on your specialized knowledge. Be specific, practical, and focus on actionable insights."""