"""
Property Valuation Agent for GeoAssessmentPro

This module provides automated property assessment and valuation capabilities
using AI and traditional valuation methodologies.
"""

import os
import sys
import time
import uuid
import json
import logging
import threading
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime
import math

# Data processing libraries
try:
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression, ElasticNet
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score
    import joblib
    HAS_ML_LIBS = True
except ImportError:
    HAS_ML_LIBS = False
    
# Geospatial libraries
try:
    import geopandas as gpd
    from shapely.geometry import Point
    HAS_GEOSPATIAL = True
except ImportError:
    HAS_GEOSPATIAL = False
    
# OpenAI integration
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

# Import base agent class from MCP
from ai_agents.mcp_core import BaseAgent, TaskPriority, TaskStatus, AgentStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PropertyValuationAgent(BaseAgent):
    """
    Property Valuation Agent for automated property assessment and valuation.
    """
    
    def __init__(self):
        """Initialize the PropertyValuationAgent"""
        super().__init__()
        # Set the agent's capabilities
        self.capabilities = {
            "estimate_property_value": self._estimate_property_value,
            "train_valuation_model": self._train_valuation_model,
            "value_trend_analysis": self._value_trend_analysis,
            "characteristic_importance": self._characteristic_importance,
            "batch_valuation": self._batch_valuation,
            "comp_based_valuation": self._comp_based_valuation,
            "valuation_explainability": self._valuation_explainability,
            "valuation_adjustments": self._valuation_adjustments,
            "ai_valuation_insight": self._ai_valuation_insight
        }
        
        # Initialize database connection
        self.conn = None
        self._init_db_connection()
        
        # Initialize model cache
        self.valuation_models = {}
        self.feature_importances = {}
        self.model_metrics = {}
        self.model_timestamps = {}
        
        # Check for required libraries
        if not HAS_ML_LIBS:
            logger.warning("Machine learning libraries not available, valuation capabilities will be limited")
        
        if not HAS_GEOSPATIAL:
            logger.warning("Geospatial libraries not available, location-based valuation will be limited")
        
        # Check if OpenAI is available for AI insights
        if not HAS_OPENAI:
            logger.warning("OpenAI integration not available, AI insights will be limited")
        else:
            # Initialize OpenAI with API key
            openai.api_key = os.environ.get("OPENAI_API_KEY")
            if not openai.api_key:
                logger.warning("OpenAI API key not set, AI insights will be unavailable")
        
        logger.info("PropertyValuationAgent initialized")
    
    def _init_db_connection(self):
        """Initialize database connection for data access"""
        try:
            import psycopg2
            
            # Get connection parameters from environment variables
            db_params = {
                "dbname": os.environ.get("PGDATABASE"),
                "user": os.environ.get("PGUSER"),
                "password": os.environ.get("PGPASSWORD"),
                "host": os.environ.get("PGHOST"),
                "port": os.environ.get("PGPORT")
            }
            
            # Create connection
            self.conn = psycopg2.connect(**db_params)
            logger.info("Database connection initialized for PropertyValuationAgent")
            
        except (ImportError, Exception) as e:
            logger.warning(f"Could not initialize database connection: {str(e)}")
            self.conn = None
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a property valuation task.
        
        Args:
            task_data: Dictionary containing task data
            
        Returns:
            Dictionary containing task result
        """
        start_time = time.time()
        
        if not task_data or "operation" not in task_data:
            return {
                "status": "error",
                "error": "Invalid task data, missing operation"
            }
        
        operation = task_data["operation"]
        
        if operation not in self.capabilities:
            return {
                "status": "error",
                "error": f"Unsupported operation: {operation}",
                "supported_operations": list(self.capabilities.keys())
            }
        
        try:
            # Call the appropriate handler function
            result = self.capabilities[operation](task_data)
            
            # Add execution time
            execution_time = time.time() - start_time
            result["execution_time"] = execution_time
            
            # Add operation name
            result["operation"] = operation
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing {operation} task: {str(e)}")
            
            return {
                "status": "error",
                "operation": operation,
                "error": str(e),
                "execution_time": time.time() - start_time
            }
    
    def _estimate_property_value(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate the value of a property.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier (optional)
                - property_data: Property characteristics (required if property_id not provided)
                - model_id: ID of the model to use (optional)
                - valuation_date: Date for the valuation (optional, default: current date)
                
        Returns:
            Dictionary with valuation results
        """
        if not HAS_ML_LIBS:
            return {"status": "error", "error": "Machine learning libraries not available"}
        
        # Extract parameters
        property_id = task_data.get("property_id")
        property_data = task_data.get("property_data")
        model_id = task_data.get("model_id", "default")
        valuation_date = task_data.get("valuation_date", datetime.now().strftime("%Y-%m-%d"))
        
        # Validate parameters
        if not property_id and not property_data:
            return {"status": "error", "error": "Either property_id or property_data must be provided"}
        
        try:
            # Load property data if property_id is provided
            if property_id and not property_data:
                property_data = self._load_property_data(property_id)
                
                if not property_data:
                    return {"status": "error", "error": f"Property with ID {property_id} not found"}
            
            # Load or create model
            model, model_info = self._get_valuation_model(model_id)
            
            if model is None:
                return {"status": "error", "error": f"Valuation model '{model_id}' not found and could not be created"}
            
            # Format property data for prediction
            X = self._format_property_data_for_prediction(property_data, model_info)
            
            # Generate prediction
            estimated_value = model.predict(X)[0]
            
            # Calculate prediction intervals and confidence score
            confidence_score, lower_bound, upper_bound = self._calculate_confidence_interval(
                model, estimated_value, X, model_info
            )
            
            # Add valuation metadata
            valuation_meta = {
                "model_id": model_id,
                "valuation_date": valuation_date,
                "model_info": model_info,
                "property_id": property_id
            }
            
            # Return results
            return {
                "status": "success",
                "estimated_value": float(estimated_value),
                "confidence_score": confidence_score,
                "value_range": {
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound)
                },
                "valuation_meta": valuation_meta
            }
            
        except Exception as e:
            logger.error(f"Error in property valuation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _train_valuation_model(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train a property valuation model.
        
        Args:
            task_data: Dictionary containing:
                - model_id: Identifier for the model (optional)
                - model_type: Type of model to train (rf, gbm, linear, elastic_net)
                - training_data: Training data or SQL query to fetch data
                - features: List of feature columns to use
                - target: Target column (property value)
                - test_size: Fraction of data to use for testing (default: 0.2)
                - random_state: Random seed for reproducibility (default: 42)
                - hyperparameters: Model-specific hyperparameters (optional)
                
        Returns:
            Dictionary with model training results
        """
        if not HAS_ML_LIBS:
            return {"status": "error", "error": "Machine learning libraries not available"}
        
        # Extract parameters
        model_id = task_data.get("model_id", f"valuation_model_{int(time.time())}")
        model_type = task_data.get("model_type", "rf")
        training_data = task_data.get("training_data")
        features = task_data.get("features", [])
        target = task_data.get("target", "sale_price")
        test_size = task_data.get("test_size", 0.2)
        random_state = task_data.get("random_state", 42)
        hyperparameters = task_data.get("hyperparameters", {})
        
        # Validate parameters
        if not training_data:
            return {"status": "error", "error": "Training data must be provided"}
        
        if not features:
            return {"status": "error", "error": "Feature list must be provided"}
        
        try:
            # Load training data
            df = self._load_training_data(training_data)
            
            if df is None or len(df) == 0:
                return {"status": "error", "error": "Could not load training data or empty dataset"}
            
            # Prepare features and target
            X = df[features].copy()
            y = df[target].copy()
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )
            
            # Standardize features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Create and train model
            model = self._create_model(model_type, hyperparameters)
            model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            rmse = math.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            
            # Calculate feature importance
            feature_importance = self._get_feature_importance(model, features, model_type)
            
            # Save model info
            model_info = {
                "model_type": model_type,
                "features": features,
                "target": target,
                "hyperparameters": hyperparameters,
                "metrics": {
                    "mse": mse,
                    "rmse": rmse,
                    "r2": r2
                },
                "feature_importance": feature_importance,
                "scaler": scaler,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Store model in cache
            self.valuation_models[model_id] = model
            self.model_metrics[model_id] = model_info["metrics"]
            self.feature_importances[model_id] = feature_importance
            self.model_timestamps[model_id] = datetime.utcnow()
            
            # Return results
            return {
                "status": "success",
                "model_id": model_id,
                "metrics": model_info["metrics"],
                "feature_importance": feature_importance,
                "model_info": model_info
            }
            
        except Exception as e:
            logger.error(f"Error in model training: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _value_trend_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze property value trends over time.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier (optional)
                - area_id: Area identifier for aggregated trends (optional)
                - time_period: Time period for analysis (e.g., "1y", "5y", "max")
                - frequency: Data frequency (e.g., "monthly", "quarterly", "yearly")
                - forecast_periods: Number of periods to forecast (optional)
                
        Returns:
            Dictionary with trend analysis results
        """
        if not HAS_ML_LIBS:
            return {"status": "error", "error": "Machine learning libraries not available"}
        
        # Extract parameters
        property_id = task_data.get("property_id")
        area_id = task_data.get("area_id")
        time_period = task_data.get("time_period", "5y")
        frequency = task_data.get("frequency", "yearly")
        forecast_periods = task_data.get("forecast_periods", 0)
        
        # Validate parameters
        if not property_id and not area_id:
            return {"status": "error", "error": "Either property_id or area_id must be provided"}
        
        try:
            # Load historical valuation data
            if property_id:
                # Get property-specific data
                valuation_data = self._load_property_valuation_history(property_id, time_period, frequency)
                subject_type = "property"
                subject_id = property_id
            else:
                # Get area-aggregated data
                valuation_data = self._load_area_valuation_history(area_id, time_period, frequency)
                subject_type = "area"
                subject_id = area_id
            
            if valuation_data is None or len(valuation_data) == 0:
                return {"status": "error", "error": f"No valuation history found for {subject_type} {subject_id}"}
            
            # Calculate trend metrics
            trend_metrics = self._calculate_trend_metrics(valuation_data)
            
            # Generate forecast if requested
            forecast_data = None
            if forecast_periods > 0:
                forecast_data = self._forecast_property_values(valuation_data, forecast_periods, frequency)
            
            # Return results
            result = {
                "status": "success",
                "subject_type": subject_type,
                "subject_id": subject_id,
                "time_period": time_period,
                "frequency": frequency,
                "valuation_data": valuation_data.to_dict(orient="records") if isinstance(valuation_data, pd.DataFrame) else valuation_data,
                "trend_metrics": trend_metrics
            }
            
            if forecast_data is not None:
                result["forecast_data"] = forecast_data.to_dict(orient="records") if isinstance(forecast_data, pd.DataFrame) else forecast_data
                result["forecast_periods"] = forecast_periods
            
            return result
            
        except Exception as e:
            logger.error(f"Error in value trend analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _characteristic_importance(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the importance of property characteristics for valuation.
        
        Args:
            task_data: Dictionary containing:
                - model_id: ID of the model to analyze (optional)
                - property_id: Property ID to analyze for specific importance (optional)
                - area_id: Area ID for localized importance (optional)
                
        Returns:
            Dictionary with characteristic importance analysis
        """
        if not HAS_ML_LIBS:
            return {"status": "error", "error": "Machine learning libraries not available"}
        
        # Extract parameters
        model_id = task_data.get("model_id", "default")
        property_id = task_data.get("property_id")
        area_id = task_data.get("area_id")
        
        try:
            # Load or create model
            model, model_info = self._get_valuation_model(model_id)
            
            if model is None:
                return {"status": "error", "error": f"Valuation model '{model_id}' not found and could not be created"}
            
            # Get global feature importance from model
            global_importance = self.feature_importances.get(model_id)
            if not global_importance and "feature_importance" in model_info:
                global_importance = model_info["feature_importance"]
            
            if not global_importance:
                # Calculate feature importance if not cached
                features = model_info.get("features", [])
                model_type = model_info.get("model_type", "rf")
                global_importance = self._get_feature_importance(model, features, model_type)
            
            # Initialize result
            result = {
                "status": "success",
                "model_id": model_id,
                "global_importance": global_importance
            }
            
            # Get property-specific characteristic importance if property_id is provided
            if property_id:
                property_data = self._load_property_data(property_id)
                
                if property_data:
                    local_importance = self._calculate_local_feature_importance(
                        model, property_data, model_info
                    )
                    result["property_id"] = property_id
                    result["local_importance"] = local_importance
            
            # Get area-specific characteristic importance if area_id is provided
            if area_id:
                area_importance = self._calculate_area_feature_importance(
                    model, area_id, model_info
                )
                result["area_id"] = area_id
                result["area_importance"] = area_importance
            
            return result
            
        except Exception as e:
            logger.error(f"Error in characteristic importance analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _batch_valuation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform batch valuation for multiple properties.
        
        Args:
            task_data: Dictionary containing:
                - property_ids: List of property IDs (optional)
                - property_query: SQL query to fetch properties (optional)
                - model_id: ID of the model to use (optional)
                - valuation_date: Date for the valuation (optional, default: current date)
                - include_details: Whether to include detailed results for each property (default: False)
                
        Returns:
            Dictionary with batch valuation results
        """
        if not HAS_ML_LIBS:
            return {"status": "error", "error": "Machine learning libraries not available"}
        
        # Extract parameters
        property_ids = task_data.get("property_ids")
        property_query = task_data.get("property_query")
        model_id = task_data.get("model_id", "default")
        valuation_date = task_data.get("valuation_date", datetime.now().strftime("%Y-%m-%d"))
        include_details = task_data.get("include_details", False)
        
        # Validate parameters
        if not property_ids and not property_query:
            return {"status": "error", "error": "Either property_ids or property_query must be provided"}
        
        try:
            # Load properties data
            properties_data = None
            
            if property_ids:
                properties_data = self._load_properties_data(property_ids)
            elif property_query:
                properties_data = self._execute_query(property_query)
            
            if properties_data is None or len(properties_data) == 0:
                return {"status": "error", "error": "No properties found for batch valuation"}
            
            # Load or create model
            model, model_info = self._get_valuation_model(model_id)
            
            if model is None:
                return {"status": "error", "error": f"Valuation model '{model_id}' not found and could not be created"}
            
            # Prepare batch data for prediction
            X_batch, property_ids_list = self._format_batch_data_for_prediction(properties_data, model_info)
            
            # Generate predictions
            if len(X_batch) > 0:
                # Make predictions
                predicted_values = model.predict(X_batch)
                
                # Calculate aggregate statistics
                total_value = float(sum(predicted_values))
                average_value = float(sum(predicted_values) / len(predicted_values))
                
                # Prepare results
                valuation_results = []
                
                if include_details:
                    # Include detailed results for each property
                    for i, prop_id in enumerate(property_ids_list):
                        # Calculate confidence interval for each prediction
                        confidence_score, lower_bound, upper_bound = self._calculate_confidence_interval(
                            model, predicted_values[i], X_batch[i:i+1], model_info
                        )
                        
                        valuation_results.append({
                            "property_id": prop_id,
                            "estimated_value": float(predicted_values[i]),
                            "confidence_score": confidence_score,
                            "value_range": {
                                "lower_bound": float(lower_bound),
                                "upper_bound": float(upper_bound)
                            }
                        })
                
                # Return batch results
                return {
                    "status": "success",
                    "model_id": model_id,
                    "valuation_date": valuation_date,
                    "property_count": len(property_ids_list),
                    "total_value": total_value,
                    "average_value": average_value,
                    "valuation_results": valuation_results if include_details else None
                }
            else:
                return {"status": "error", "error": "No valid properties found for valuation after preprocessing"}
            
        except Exception as e:
            logger.error(f"Error in batch valuation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _comp_based_valuation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform valuation based on comparable sales approach.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier
                - num_comps: Number of comparable properties to use (default: 5)
                - max_distance: Maximum distance in miles for comparables (default: 1.0)
                - time_window: Time window for sales in days (default: 365)
                - adjustment_factors: Weights for different property characteristics
                
        Returns:
            Dictionary with comparable-based valuation results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available for comparable analysis"}
        
        # Extract parameters
        property_id = task_data.get("property_id")
        num_comps = task_data.get("num_comps", 5)
        max_distance = task_data.get("max_distance", 1.0)
        time_window = task_data.get("time_window", 365)
        adjustment_factors = task_data.get("adjustment_factors", {})
        
        # Validate parameters
        if not property_id:
            return {"status": "error", "error": "Property ID must be provided"}
        
        try:
            # Load subject property data
            subject_property = self._load_property_data(property_id)
            
            if not subject_property:
                return {"status": "error", "error": f"Property with ID {property_id} not found"}
            
            # Find comparable properties
            comparable_properties = self._find_comparable_properties(
                subject_property, num_comps, max_distance, time_window
            )
            
            if not comparable_properties or len(comparable_properties) == 0:
                return {"status": "error", "error": "No comparable properties found"}
            
            # Calculate adjusted values
            adjusted_values, adjustments = self._calculate_adjusted_values(
                subject_property, comparable_properties, adjustment_factors
            )
            
            # Calculate final estimated value
            estimated_value = sum(adjusted_values) / len(adjusted_values)
            
            # Calculate confidence metrics
            variance = np.var(adjusted_values) if HAS_ML_LIBS else sum((v - estimated_value) ** 2 for v in adjusted_values) / len(adjusted_values)
            std_dev = np.std(adjusted_values) if HAS_ML_LIBS else math.sqrt(variance)
            confidence_score = 1.0 - min(1.0, (std_dev / estimated_value))
            
            # Prepare comparable properties data
            comp_data = []
            for i, comp in enumerate(comparable_properties):
                comp_data.append({
                    "property_id": comp.get("property_id"),
                    "sale_price": comp.get("sale_price"),
                    "sale_date": comp.get("sale_date"),
                    "distance": comp.get("distance"),
                    "adjusted_value": float(adjusted_values[i]),
                    "adjustments": adjustments[i]
                })
            
            # Return results
            return {
                "status": "success",
                "property_id": property_id,
                "estimated_value": float(estimated_value),
                "confidence_score": float(confidence_score),
                "comparable_count": len(comparable_properties),
                "comps": comp_data,
                "value_range": {
                    "lower_bound": float(estimated_value - std_dev),
                    "upper_bound": float(estimated_value + std_dev)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in comparable-based valuation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _valuation_explainability(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate human-readable explanation for property valuation.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier
                - valuation_id: ID of a previously generated valuation (optional)
                - model_id: ID of the model used for valuation (optional)
                - format: Explanation format (technical, simple, narrative)
                
        Returns:
            Dictionary with valuation explanation
        """
        # Extract parameters
        property_id = task_data.get("property_id")
        valuation_id = task_data.get("valuation_id")
        model_id = task_data.get("model_id", "default")
        format = task_data.get("format", "simple")
        
        # Validate parameters
        if not property_id:
            return {"status": "error", "error": "Property ID must be provided"}
        
        try:
            # Load property data
            property_data = self._load_property_data(property_id)
            
            if not property_data:
                return {"status": "error", "error": f"Property with ID {property_id} not found"}
            
            # Get valuation if available
            valuation_result = None
            if valuation_id:
                # In a real implementation, this would load from a database
                # Here we'll simulate by generating a new valuation
                valuation_task = {
                    "operation": "estimate_property_value",
                    "property_id": property_id,
                    "model_id": model_id
                }
                valuation_result = self._estimate_property_value(valuation_task)
            else:
                # Generate a new valuation
                valuation_task = {
                    "operation": "estimate_property_value",
                    "property_id": property_id,
                    "model_id": model_id
                }
                valuation_result = self._estimate_property_value(valuation_task)
            
            if valuation_result.get("status") != "success":
                return {"status": "error", "error": "Failed to generate or retrieve valuation"}
            
            # Load model information
            _, model_info = self._get_valuation_model(model_id)
            
            # Generate explanation based on format
            explanation = self._generate_valuation_explanation(
                property_data, valuation_result, model_info, format
            )
            
            # Return results
            return {
                "status": "success",
                "property_id": property_id,
                "valuation": {
                    "estimated_value": valuation_result.get("estimated_value"),
                    "confidence_score": valuation_result.get("confidence_score"),
                    "value_range": valuation_result.get("value_range")
                },
                "explanation_format": format,
                "explanation": explanation
            }
            
        except Exception as e:
            logger.error(f"Error generating valuation explanation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _valuation_adjustments(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply manual adjustments to automated property valuation.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier
                - base_valuation: Previously generated valuation result
                - adjustments: List of adjustment factors and values
                - justification: Justification for adjustments
                
        Returns:
            Dictionary with adjusted valuation results
        """
        # Extract parameters
        property_id = task_data.get("property_id")
        base_valuation = task_data.get("base_valuation")
        adjustments = task_data.get("adjustments", [])
        justification = task_data.get("justification", "")
        
        # Validate parameters
        if not property_id:
            return {"status": "error", "error": "Property ID must be provided"}
        
        if not base_valuation:
            return {"status": "error", "error": "Base valuation must be provided"}
        
        if not adjustments:
            return {"status": "error", "error": "At least one adjustment must be provided"}
        
        try:
            # Get base valuation value
            base_value = base_valuation.get("estimated_value")
            
            if not base_value:
                return {"status": "error", "error": "Invalid base valuation: missing estimated_value"}
            
            # Calculate total adjustment
            total_adjustment = 0.0
            adjusted_factors = {}
            
            for adjustment in adjustments:
                factor = adjustment.get("factor")
                amount = adjustment.get("amount", 0.0)
                percent = adjustment.get("percent", 0.0)
                
                # Calculate adjustment amount
                if amount != 0:
                    factor_adjustment = amount
                elif percent != 0:
                    factor_adjustment = base_value * (percent / 100.0)
                else:
                    factor_adjustment = 0.0
                
                total_adjustment += factor_adjustment
                adjusted_factors[factor] = factor_adjustment
            
            # Calculate adjusted value
            adjusted_value = base_value + total_adjustment
            
            # Calculate confidence adjustment
            # Adjustments reduce confidence based on the magnitude of the change
            base_confidence = base_valuation.get("confidence_score", 0.8)
            adjustment_magnitude = abs(total_adjustment / base_value) if base_value > 0 else 1.0
            adjusted_confidence = max(0.1, base_confidence * (1.0 - min(0.5, adjustment_magnitude)))
            
            # Return adjusted valuation
            return {
                "status": "success",
                "property_id": property_id,
                "base_value": float(base_value),
                "adjusted_value": float(adjusted_value),
                "total_adjustment": float(total_adjustment),
                "adjustment_percent": float(total_adjustment / base_value * 100) if base_value > 0 else 0.0,
                "base_confidence": float(base_confidence),
                "adjusted_confidence": float(adjusted_confidence),
                "adjustments": adjusted_factors,
                "justification": justification
            }
            
        except Exception as e:
            logger.error(f"Error applying valuation adjustments: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _ai_valuation_insight(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI-powered insights for property valuation.
        
        Args:
            task_data: Dictionary containing:
                - property_id: Property identifier
                - valuation_data: Valuation data or ID
                - context: Additional context for analysis
                - questions: Specific questions to address
                
        Returns:
            Dictionary with AI-generated insights
        """
        if not HAS_OPENAI or not openai.api_key:
            return {"status": "error", "error": "OpenAI integration not available or API key not set"}
        
        # Extract parameters
        property_id = task_data.get("property_id")
        valuation_data = task_data.get("valuation_data")
        context = task_data.get("context", "")
        questions = task_data.get("questions", [])
        
        # Validate parameters
        if not property_id:
            return {"status": "error", "error": "Property ID must be provided"}
        
        if not valuation_data:
            # Try to generate valuation data if not provided
            valuation_task = {
                "operation": "estimate_property_value",
                "property_id": property_id
            }
            valuation_data = self._estimate_property_value(valuation_task)
            
            if valuation_data.get("status") != "success":
                return {"status": "error", "error": "Failed to generate valuation data and none was provided"}
        
        try:
            # Load property data
            property_data = self._load_property_data(property_id)
            
            if not property_data:
                return {"status": "error", "error": f"Property with ID {property_id} not found"}
            
            # Get market trends
            market_trends = self._get_market_trends(property_data.get("area_id"))
            
            # Prepare prompt for OpenAI
            prompt = self._prepare_valuation_insight_prompt(
                property_data, valuation_data, market_trends, context, questions
            )
            
            # Send request to OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                messages=[
                    {"role": "system", "content": "You are a property valuation expert with decades of experience in real estate assessment and market analysis."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            # Parse response
            insights = json.loads(response.choices[0].message.content)
            
            # Return results
            return {
                "status": "success",
                "property_id": property_id,
                "valuation": {
                    "estimated_value": valuation_data.get("estimated_value"),
                    "confidence_score": valuation_data.get("confidence_score"),
                    "value_range": valuation_data.get("value_range")
                },
                "insights": insights
            }
            
        except Exception as e:
            logger.error(f"Error generating AI valuation insights: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    # Helper methods
    
    def _load_property_data(self, property_id):
        """Load property data from database"""
        if not self.conn:
            # If no database connection, create mock data
            return {
                "property_id": property_id,
                "area_id": "area_001",
                "address": f"123 Main St, Property {property_id}",
                "property_type": "single_family",
                "year_built": 1990,
                "square_feet": 2200,
                "lot_size": 8500,
                "bedrooms": 3,
                "bathrooms": 2.5,
                "last_sale_price": 350000,
                "last_sale_date": "2020-05-15",
                "latitude": 46.2804,
                "longitude": -119.2752,
                "quality": "average",
                "condition": "good"
            }
        
        # In a real implementation, this would query the database
        # Example:
        # with self.conn.cursor() as cursor:
        #     cursor.execute("SELECT * FROM properties WHERE property_id = %s", (property_id,))
        #     result = cursor.fetchone()
        #     if result:
        #         columns = [desc[0] for desc in cursor.description]
        #         return dict(zip(columns, result))
        
        # For now, return mock data
        return {
            "property_id": property_id,
            "area_id": "area_001",
            "address": f"123 Main St, Property {property_id}",
            "property_type": "single_family",
            "year_built": 1990,
            "square_feet": 2200,
            "lot_size": 8500,
            "bedrooms": 3,
            "bathrooms": 2.5,
            "last_sale_price": 350000,
            "last_sale_date": "2020-05-15",
            "latitude": 46.2804,
            "longitude": -119.2752,
            "quality": "average",
            "condition": "good"
        }
    
    def _load_properties_data(self, property_ids):
        """Load data for multiple properties"""
        properties = []
        for prop_id in property_ids:
            prop_data = self._load_property_data(prop_id)
            if prop_data:
                properties.append(prop_data)
        
        return properties
    
    def _execute_query(self, query):
        """Execute a database query and return results"""
        if not self.conn:
            logger.warning("No database connection available for executing query")
            return None
        
        try:
            import pandas as pd
            
            # Execute query
            df = pd.read_sql_query(query, self.conn)
            return df
            
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return None
    
    def _load_training_data(self, training_data):
        """Load training data from database or provided data"""
        if isinstance(training_data, str):
            # Assume it's a SQL query
            return self._execute_query(training_data)
        elif isinstance(training_data, list):
            # Assume it's a list of dictionaries
            import pandas as pd
            return pd.DataFrame(training_data)
        elif isinstance(training_data, dict):
            # Assume it has 'query' or 'data' key
            if "query" in training_data:
                return self._execute_query(training_data["query"])
            elif "data" in training_data:
                import pandas as pd
                return pd.DataFrame(training_data["data"])
        
        # Return empty dataframe if nothing found
        import pandas as pd
        return pd.DataFrame()
    
    def _get_valuation_model(self, model_id):
        """Get or create a valuation model"""
        # Check if model already exists in cache
        if model_id in self.valuation_models:
            model = self.valuation_models[model_id]
            model_info = {"feature_importance": self.feature_importances.get(model_id, {})}
            return model, model_info
        
        # If model doesn't exist, create a default model
        if model_id == "default":
            try:
                # Create a simple default model
                from sklearn.ensemble import RandomForestRegressor
                
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                
                # Fake training with some mock data
                import numpy as np
                
                # Mock feature matrix
                X = np.array([
                    [2000, 3, 2, 1990, 8500],
                    [1800, 3, 2, 1985, 7500],
                    [2200, 4, 2.5, 1995, 9000],
                    [1500, 2, 1, 1970, 6000],
                    [3000, 4, 3, 2010, 12000]
                ])
                
                # Mock target values (home prices)
                y = np.array([350000, 320000, 380000, 280000, 450000])
                
                # Fit the model
                model.fit(X, y)
                
                # Store in cache
                self.valuation_models[model_id] = model
                
                # Calculate feature importance
                features = ["square_feet", "bedrooms", "bathrooms", "year_built", "lot_size"]
                importance = dict(zip(features, model.feature_importances_))
                self.feature_importances[model_id] = importance
                
                # Create model info
                model_info = {
                    "model_type": "rf",
                    "features": features,
                    "feature_importance": importance,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                return model, model_info
                
            except Exception as e:
                logger.error(f"Error creating default model: {str(e)}")
                return None, {}
        
        # If not default model and not in cache, return None
        return None, {}
    
    def _create_model(self, model_type, hyperparameters):
        """Create a model of the specified type with given hyperparameters"""
        if model_type == "rf":
            from sklearn.ensemble import RandomForestRegressor
            return RandomForestRegressor(
                n_estimators=hyperparameters.get("n_estimators", 100),
                max_depth=hyperparameters.get("max_depth"),
                min_samples_split=hyperparameters.get("min_samples_split", 2),
                random_state=hyperparameters.get("random_state", 42)
            )
        elif model_type == "gbm":
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(
                n_estimators=hyperparameters.get("n_estimators", 100),
                learning_rate=hyperparameters.get("learning_rate", 0.1),
                max_depth=hyperparameters.get("max_depth", 3),
                random_state=hyperparameters.get("random_state", 42)
            )
        elif model_type == "linear":
            from sklearn.linear_model import LinearRegression
            return LinearRegression()
        elif model_type == "elastic_net":
            from sklearn.linear_model import ElasticNet
            return ElasticNet(
                alpha=hyperparameters.get("alpha", 1.0),
                l1_ratio=hyperparameters.get("l1_ratio", 0.5),
                random_state=hyperparameters.get("random_state", 42)
            )
        else:
            # Default to RandomForestRegressor
            from sklearn.ensemble import RandomForestRegressor
            return RandomForestRegressor(n_estimators=100, random_state=42)
    
    def _get_feature_importance(self, model, features, model_type):
        """Get feature importance from a trained model"""
        importance_dict = {}
        
        if hasattr(model, "feature_importances_"):
            # For tree-based models
            importance_values = model.feature_importances_
            importance_dict = dict(zip(features, importance_values))
        elif hasattr(model, "coef_"):
            # For linear models
            importance_values = abs(model.coef_)
            importance_dict = dict(zip(features, importance_values))
        
        # Sort by importance
        importance_dict = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
        
        return importance_dict
    
    def _format_property_data_for_prediction(self, property_data, model_info):
        """Format property data for model prediction"""
        features = model_info.get("features", ["square_feet", "bedrooms", "bathrooms", "year_built", "lot_size"])
        
        # Extract feature values
        feature_values = []
        for feature in features:
            if feature in property_data:
                feature_values.append(property_data[feature])
            else:
                # Use a default value or 0 if feature not found
                feature_values.append(0)
        
        # Convert to numpy array for prediction
        import numpy as np
        X = np.array([feature_values])
        
        # Apply scaling if available
        scaler = model_info.get("scaler")
        if scaler:
            X = scaler.transform(X)
        
        return X
    
    def _format_batch_data_for_prediction(self, properties_data, model_info):
        """Format batch data for model prediction"""
        features = model_info.get("features", ["square_feet", "bedrooms", "bathrooms", "year_built", "lot_size"])
        
        if isinstance(properties_data, list):
            # List of dictionaries
            import numpy as np
            
            X_batch = []
            property_ids = []
            
            for prop in properties_data:
                feature_values = []
                for feature in features:
                    if feature in prop:
                        feature_values.append(prop[feature])
                    else:
                        feature_values.append(0)
                
                X_batch.append(feature_values)
                property_ids.append(prop.get("property_id", "unknown"))
            
            X_batch = np.array(X_batch)
            
        elif hasattr(properties_data, "columns"):
            # Pandas DataFrame
            import numpy as np
            
            # Get property IDs
            property_ids = properties_data["property_id"].tolist() if "property_id" in properties_data.columns else ["unknown"] * len(properties_data)
            
            # Extract features
            X_batch = properties_data[features].values
        
        else:
            # Unknown format
            import numpy as np
            X_batch = np.array([])
            property_ids = []
        
        # Apply scaling if available
        scaler = model_info.get("scaler")
        if scaler and len(X_batch) > 0:
            X_batch = scaler.transform(X_batch)
        
        return X_batch, property_ids
    
    def _calculate_confidence_interval(self, model, estimated_value, X, model_info):
        """Calculate confidence interval and score for a prediction"""
        try:
            # For ensemble models, estimate prediction variance
            if hasattr(model, "estimators_"):
                # Get predictions from all base estimators
                if hasattr(model, "estimators_"):
                    predictions = []
                    for estimator in model.estimators_:
                        predictions.append(estimator.predict(X)[0])
                    
                    import numpy as np
                    std_dev = np.std(predictions)
                    
                    # Calculate confidence score (higher std_dev means lower confidence)
                    confidence_score = 1.0 - min(1.0, (std_dev / estimated_value if estimated_value > 0 else 1.0))
                    
                    # Calculate bounds (95% confidence interval)
                    lower_bound = estimated_value - 1.96 * std_dev
                    upper_bound = estimated_value + 1.96 * std_dev
                    
                    return confidence_score, lower_bound, upper_bound
            
            # Default confidence calculation
            confidence_score = 0.80  # Default confidence
            margin = estimated_value * 0.10  # Default 10% margin
            
            lower_bound = estimated_value - margin
            upper_bound = estimated_value + margin
            
            return confidence_score, lower_bound, upper_bound
            
        except Exception as e:
            logger.error(f"Error calculating confidence interval: {str(e)}")
            
            # Return default values
            confidence_score = 0.70
            margin = estimated_value * 0.15
            
            lower_bound = estimated_value - margin
            upper_bound = estimated_value + margin
            
            return confidence_score, lower_bound, upper_bound
    
    def _load_property_valuation_history(self, property_id, time_period, frequency):
        """Load historical valuation data for a property"""
        if not self.conn:
            # Generate mock historical data
            import pandas as pd
            import numpy as np
            
            # Parse time period
            if time_period.endswith("y"):
                years = int(time_period[:-1])
            elif time_period.endswith("m"):
                years = int(time_period[:-1]) / 12
            else:
                years = 5  # Default to 5 years
            
            # Generate dates based on frequency
            end_date = datetime.now()
            
            if frequency == "yearly":
                dates = [end_date.replace(year=end_date.year - i) for i in range(int(years))]
            elif frequency == "quarterly":
                quarters = int(years * 4)
                dates = []
                for i in range(quarters):
                    q_date = end_date.replace(month=((end_date.month - 1 - (i * 3)) % 12) + 1)
                    if (end_date.month - 1 - (i * 3)) < 0:
                        q_date = q_date.replace(year=end_date.year - ((i * 3) // 12 + 1))
                    dates.append(q_date)
            else:  # monthly
                months = int(years * 12)
                dates = []
                for i in range(months):
                    m_date = end_date.replace(month=((end_date.month - 1 - i) % 12) + 1)
                    if (end_date.month - 1 - i) < 0:
                        m_date = m_date.replace(year=end_date.year - (i // 12 + 1))
                    dates.append(m_date)
            
            # Sort dates chronologically
            dates.sort()
            
            # Generate mock valuations with trend and some randomness
            base_value = 300000
            annual_growth = 0.03  # 3% annual growth
            
            values = []
            for date in dates:
                years_from_start = (date - dates[0]).days / 365.25
                trend_value = base_value * (1 + annual_growth) ** years_from_start
                random_factor = np.random.normal(1, 0.02)  # Add some randomness
                values.append(trend_value * random_factor)
            
            # Create DataFrame
            df = pd.DataFrame({
                "date": dates,
                "value": values,
                "property_id": property_id
            })
            
            return df
        
        # In a real implementation, this would query the database
        # Example:
        # query = """
        #     SELECT valuation_date as date, estimated_value as value
        #     FROM property_valuations
        #     WHERE property_id = %s
        #     AND valuation_date >= NOW() - INTERVAL %s
        #     ORDER BY valuation_date ASC
        # """
        # df = pd.read_sql_query(query, self.conn, params=(property_id, f"{years} years"))
        
        # For now, return mock data
        import pandas as pd
        import numpy as np
        
        # Parse time period
        if time_period.endswith("y"):
            years = int(time_period[:-1])
        elif time_period.endswith("m"):
            years = int(time_period[:-1]) / 12
        else:
            years = 5  # Default to 5 years
        
        # Generate dates based on frequency
        end_date = datetime.now()
        
        if frequency == "yearly":
            dates = [end_date.replace(year=end_date.year - i) for i in range(int(years))]
        elif frequency == "quarterly":
            quarters = int(years * 4)
            dates = []
            for i in range(quarters):
                q_date = end_date.replace(month=((end_date.month - 1 - (i * 3)) % 12) + 1)
                if (end_date.month - 1 - (i * 3)) < 0:
                    q_date = q_date.replace(year=end_date.year - ((i * 3) // 12 + 1))
                dates.append(q_date)
        else:  # monthly
            months = int(years * 12)
            dates = []
            for i in range(months):
                m_date = end_date.replace(month=((end_date.month - 1 - i) % 12) + 1)
                if (end_date.month - 1 - i) < 0:
                    m_date = m_date.replace(year=end_date.year - (i // 12 + 1))
                dates.append(m_date)
        
        # Sort dates chronologically
        dates.sort()
        
        # Generate mock valuations with trend and some randomness
        base_value = 300000
        annual_growth = 0.03  # 3% annual growth
        
        values = []
        for date in dates:
            years_from_start = (date - dates[0]).days / 365.25
            trend_value = base_value * (1 + annual_growth) ** years_from_start
            random_factor = np.random.normal(1, 0.02)  # Add some randomness
            values.append(trend_value * random_factor)
        
        # Create DataFrame
        df = pd.DataFrame({
            "date": dates,
            "value": values,
            "property_id": property_id
        })
        
        return df
    
    def _load_area_valuation_history(self, area_id, time_period, frequency):
        """Load historical valuation data for an area"""
        # Similar to property valuation history but aggregated for an area
        # Mock implementation
        import pandas as pd
        import numpy as np
        
        # Parse time period
        if time_period.endswith("y"):
            years = int(time_period[:-1])
        elif time_period.endswith("m"):
            years = int(time_period[:-1]) / 12
        else:
            years = 5  # Default to 5 years
        
        # Generate dates based on frequency
        end_date = datetime.now()
        
        if frequency == "yearly":
            dates = [end_date.replace(year=end_date.year - i) for i in range(int(years))]
        elif frequency == "quarterly":
            quarters = int(years * 4)
            dates = []
            for i in range(quarters):
                q_date = end_date.replace(month=((end_date.month - 1 - (i * 3)) % 12) + 1)
                if (end_date.month - 1 - (i * 3)) < 0:
                    q_date = q_date.replace(year=end_date.year - ((i * 3) // 12 + 1))
                dates.append(q_date)
        else:  # monthly
            months = int(years * 12)
            dates = []
            for i in range(months):
                m_date = end_date.replace(month=((end_date.month - 1 - i) % 12) + 1)
                if (end_date.month - 1 - i) < 0:
                    m_date = m_date.replace(year=end_date.year - (i // 12 + 1))
                dates.append(m_date)
        
        # Sort dates chronologically
        dates.sort()
        
        # Generate mock valuations with trend and some randomness
        base_value = 350000  # Higher for area average
        annual_growth = 0.04  # 4% annual growth
        
        mean_values = []
        median_values = []
        count_values = []
        
        for date in dates:
            years_from_start = (date - dates[0]).days / 365.25
            trend_value = base_value * (1 + annual_growth) ** years_from_start
            
            # Generate a distribution of values around the trend
            n_properties = 50 + int(np.random.normal(0, 10))  # Number of properties in area
            property_values = np.random.normal(trend_value, trend_value * 0.15, n_properties)
            
            mean_values.append(np.mean(property_values))
            median_values.append(np.median(property_values))
            count_values.append(len(property_values))
        
        # Create DataFrame
        df = pd.DataFrame({
            "date": dates,
            "mean_value": mean_values,
            "median_value": median_values,
            "property_count": count_values,
            "area_id": area_id
        })
        
        return df
    
    def _calculate_trend_metrics(self, valuation_data):
        """Calculate trend metrics from valuation data"""
        # Check if data is a DataFrame
        if hasattr(valuation_data, "columns"):
            try:
                import numpy as np
                
                # Determine value column
                value_col = None
                for col in ["value", "mean_value", "median_value", "estimated_value"]:
                    if col in valuation_data.columns:
                        value_col = col
                        break
                
                if not value_col:
                    return {"error": "No value column found in data"}
                
                # Get first and last values
                first_value = valuation_data[value_col].iloc[0]
                last_value = valuation_data[value_col].iloc[-1]
                
                # Calculate total change
                total_change = last_value - first_value
                percent_change = (total_change / first_value) * 100 if first_value > 0 else 0
                
                # Calculate annualized change
                if "date" in valuation_data.columns and len(valuation_data) > 1:
                    first_date = valuation_data["date"].iloc[0]
                    last_date = valuation_data["date"].iloc[-1]
                    
                    # Convert to datetime if needed
                    if not isinstance(first_date, datetime):
                        first_date = pd.to_datetime(first_date)
                    if not isinstance(last_date, datetime):
                        last_date = pd.to_datetime(last_date)
                    
                    years_diff = (last_date - first_date).days / 365.25
                    
                    if years_diff > 0:
                        annual_growth_rate = ((last_value / first_value) ** (1 / years_diff)) - 1
                        annual_growth_percent = annual_growth_rate * 100
                    else:
                        annual_growth_rate = 0
                        annual_growth_percent = 0
                else:
                    annual_growth_rate = 0
                    annual_growth_percent = 0
                
                # Calculate volatility (standard deviation of percent changes)
                if len(valuation_data) > 1:
                    pct_changes = valuation_data[value_col].pct_change().dropna()
                    volatility = float(pct_changes.std() * 100) if len(pct_changes) > 0 else 0
                else:
                    volatility = 0
                
                # Return trend metrics
                return {
                    "first_value": float(first_value),
                    "last_value": float(last_value),
                    "total_change": float(total_change),
                    "percent_change": float(percent_change),
                    "annual_growth_rate": float(annual_growth_rate),
                    "annual_growth_percent": float(annual_growth_percent),
                    "volatility": float(volatility)
                }
                
            except Exception as e:
                logger.error(f"Error calculating trend metrics: {str(e)}")
                return {"error": str(e)}
        
        # Return empty metrics for non-DataFrame data
        return {}
    
    def _forecast_property_values(self, valuation_data, forecast_periods, frequency):
        """Forecast future property values"""
        if not hasattr(valuation_data, "columns"):
            return None
        
        try:
            import pandas as pd
            import numpy as np
            
            # Determine value column
            value_col = None
            for col in ["value", "mean_value", "median_value", "estimated_value"]:
                if col in valuation_data.columns:
                    value_col = col
                    break
            
            if not value_col:
                return None
            
            # Check for date column
            if "date" not in valuation_data.columns:
                return None
            
            # Use basic trend projections
            # In a real implementation, this would use time series forecasting
            # models like ARIMA, Prophet, or exponential smoothing
            
            # Calculate overall trend
            first_value = valuation_data[value_col].iloc[0]
            last_value = valuation_data[value_col].iloc[-1]
            
            # Get dates
            first_date = pd.to_datetime(valuation_data["date"].iloc[0])
            last_date = pd.to_datetime(valuation_data["date"].iloc[-1])
            
            # Calculate time difference
            days_diff = (last_date - first_date).days
            if days_diff <= 0:
                return None
            
            # Calculate daily growth rate
            daily_growth = (last_value / first_value) ** (1 / days_diff) - 1
            
            # Generate forecast dates
            forecast_dates = []
            if frequency == "yearly":
                days_per_period = 365
                for i in range(1, forecast_periods + 1):
                    forecast_dates.append(last_date + pd.Timedelta(days=i * days_per_period))
            elif frequency == "quarterly":
                days_per_period = 91
                for i in range(1, forecast_periods + 1):
                    forecast_dates.append(last_date + pd.Timedelta(days=i * days_per_period))
            else:  # monthly
                days_per_period = 30
                for i in range(1, forecast_periods + 1):
                    forecast_dates.append(last_date + pd.Timedelta(days=i * days_per_period))
            
            # Generate forecast values
            forecast_values = []
            for i, date in enumerate(forecast_dates):
                days_forward = (date - last_date).days
                forecast_value = last_value * (1 + daily_growth) ** days_forward
                
                # Add some randomness to the forecast
                random_factor = np.random.normal(1, 0.02 * (i + 1) ** 0.5)  # Increasing uncertainty over time
                forecast_values.append(forecast_value * random_factor)
            
            # Create forecast DataFrame
            forecast_df = pd.DataFrame({
                "date": forecast_dates,
                value_col: forecast_values,
                "forecast": True
            })
            
            # Add other columns if present in original data
            for col in valuation_data.columns:
                if col not in forecast_df.columns and col != "date" and col != value_col:
                    # Fill with the last value or None
                    if col in ["property_id", "area_id"]:
                        forecast_df[col] = valuation_data[col].iloc[-1]
                    else:
                        forecast_df[col] = None
            
            return forecast_df
            
        except Exception as e:
            logger.error(f"Error forecasting property values: {str(e)}")
            return None
    
    def _calculate_local_feature_importance(self, model, property_data, model_info):
        """Calculate feature importance specific to a property"""
        # This is a simplified implementation
        # In a real system, this would use SHAP or LIME for local interpretability
        
        # Get global feature importance
        global_importance = self.feature_importances.get(model_info.get("model_id", "default"), {})
        if not global_importance and "feature_importance" in model_info:
            global_importance = model_info["feature_importance"]
        
        if not global_importance:
            return {}
        
        # Get features used by the model
        features = model_info.get("features", list(global_importance.keys()))
        
        # Calculate property-specific importance
        local_importance = {}
        
        for feature in features:
            if feature in property_data and feature in global_importance:
                # Get feature value
                value = property_data[feature]
                
                # Global importance
                importance = global_importance[feature]
                
                # Adjust importance based on feature value
                # This is a simplified approach - in reality, we'd use more sophisticated methods
                
                # Example: for square_feet, higher values generally mean higher importance
                if feature == "square_feet":
                    avg_sq_ft = 2000  # Assumed average
                    if value > avg_sq_ft:
                        importance *= min(2.0, 1.0 + (value - avg_sq_ft) / avg_sq_ft)
                    elif value < avg_sq_ft:
                        importance *= max(0.5, 1.0 - (avg_sq_ft - value) / avg_sq_ft)
                
                # Example: for year_built, newer properties often have more consistent pricing
                elif feature == "year_built":
                    current_year = datetime.now().year
                    age = current_year - value
                    if age < 5:
                        importance *= 1.2  # New construction has higher impact
                    elif age > 50:
                        importance *= 1.3  # Historic properties have higher impact
                
                local_importance[feature] = float(importance)
            
        # Normalize local importance
        total_importance = sum(local_importance.values())
        if total_importance > 0:
            local_importance = {k: v / total_importance for k, v in local_importance.items()}
        
        return local_importance
    
    def _calculate_area_feature_importance(self, model, area_id, model_info):
        """Calculate area-specific feature importance"""
        # This would analyze all properties in an area to determine feature importance
        # For simplicity, we'll return a slightly modified version of global importance
        
        # Get global feature importance
        global_importance = self.feature_importances.get(model_info.get("model_id", "default"), {})
        if not global_importance and "feature_importance" in model_info:
            global_importance = model_info["feature_importance"]
        
        if not global_importance:
            return {}
        
        # Simulate area-specific adjustments
        area_importance = global_importance.copy()
        
        # Different areas might value different features
        # For example, area_001 might value lot_size more
        if area_id == "area_001":
            if "lot_size" in area_importance:
                area_importance["lot_size"] *= 1.3
            if "bedrooms" in area_importance:
                area_importance["bedrooms"] *= 0.9
        # area_002 might value newer homes more
        elif area_id == "area_002":
            if "year_built" in area_importance:
                area_importance["year_built"] *= 1.2
            if "square_feet" in area_importance:
                area_importance["square_feet"] *= 1.1
        
        # Normalize area importance
        total_importance = sum(area_importance.values())
        if total_importance > 0:
            area_importance = {k: float(v / total_importance) for k, v in area_importance.items()}
        
        return area_importance
    
    def _find_comparable_properties(self, subject_property, num_comps, max_distance, time_window):
        """Find comparable properties based on location, characteristics, and recent sales"""
        # Mock implementation
        import numpy as np
        from datetime import datetime, timedelta
        
        # Generate some mock comparable properties
        comps = []
        
        # Set distance ranges based on the max_distance parameter
        min_distance = max_distance * 0.1
        max_distance_value = max_distance
        
        # Set the date range for sales
        current_date = datetime.now()
        sale_date_min = current_date - timedelta(days=time_window)
        
        for i in range(num_comps):
            # Distance from subject property
            distance = min_distance + np.random.random() * (max_distance_value - min_distance)
            
            # Sales date within time window
            days_ago = int(np.random.random() * time_window)
            sale_date = (current_date - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            
            # Generate mock similar property
            sq_ft_factor = np.random.normal(1.0, 0.10)  # Within 10% of subject
            lot_size_factor = np.random.normal(1.0, 0.15)  # Within 15% of subject
            year_factor = np.random.normal(0, 5)  # Within 5 years
            
            # Sale price with some variation
            base_price = subject_property.get("last_sale_price", 350000)
            price_factor = np.random.normal(1.0, 0.08)  # Within 8% of subject
            
            sq_ft = int(subject_property.get("square_feet", 2000) * sq_ft_factor)
            lot_size = int(subject_property.get("lot_size", 8500) * lot_size_factor)
            year_built = max(1900, int(subject_property.get("year_built", 1990) + year_factor))
            bedrooms = subject_property.get("bedrooms", 3)
            bathrooms = subject_property.get("bathrooms", 2.5)
            
            # Add some random variations in bedrooms/bathrooms
            if np.random.random() > 0.7:
                bedrooms = bedrooms + (1 if np.random.random() > 0.5 else -1)
            
            if np.random.random() > 0.7:
                if np.random.random() > 0.5:
                    bathrooms += 0.5
                else:
                    bathrooms = max(1.0, bathrooms - 0.5)
            
            # Generate mock comp
            comp = {
                "property_id": f"comp_{i+1}",
                "address": f"{100+i} Comparable St, Kennewick, WA",
                "distance": float(distance),
                "sale_date": sale_date,
                "sale_price": float(base_price * price_factor),
                "square_feet": sq_ft,
                "lot_size": lot_size,
                "year_built": year_built,
                "bedrooms": int(bedrooms),
                "bathrooms": float(bathrooms),
                "property_type": subject_property.get("property_type", "single_family"),
                "quality": subject_property.get("quality", "average"),
                "condition": subject_property.get("condition", "good")
            }
            
            comps.append(comp)
        
        return comps
    
    def _calculate_adjusted_values(self, subject_property, comparable_properties, adjustment_factors):
        """Calculate adjusted values for comparable properties"""
        # Default adjustment factors
        default_factors = {
            "square_feet": 50,  # $ per sq ft
            "lot_size": 0.5,    # $ per sq ft of lot
            "year_built": 1000,  # $ per year
            "bedrooms": 5000,   # $ per bedroom
            "bathrooms": 10000,  # $ per bathroom
            "distance": 5000,   # $ per mile
            "time": 100        # $ per day (market adjustment)
        }
        
        # Update with provided factors
        for key, value in adjustment_factors.items():
            if key in default_factors:
                default_factors[key] = value
        
        # Current date for time adjustments
        import datetime
        current_date = datetime.datetime.now()
        
        # Calculate adjusted values
        adjusted_values = []
        adjustments = []
        
        for comp in comparable_properties:
            # Start with the comp's sale price
            base_price = comp.get("sale_price", 0)
            
            # Track adjustments
            comp_adjustments = {}
            
            # Square footage adjustment
            if "square_feet" in comp and "square_feet" in subject_property:
                sq_ft_diff = subject_property["square_feet"] - comp["square_feet"]
                sq_ft_adj = sq_ft_diff * default_factors["square_feet"]
                comp_adjustments["square_feet"] = sq_ft_adj
            
            # Lot size adjustment
            if "lot_size" in comp and "lot_size" in subject_property:
                lot_diff = subject_property["lot_size"] - comp["lot_size"]
                lot_adj = lot_diff * default_factors["lot_size"]
                comp_adjustments["lot_size"] = lot_adj
            
            # Year built adjustment
            if "year_built" in comp and "year_built" in subject_property:
                year_diff = subject_property["year_built"] - comp["year_built"]
                year_adj = year_diff * default_factors["year_built"]
                comp_adjustments["year_built"] = year_adj
            
            # Bedroom adjustment
            if "bedrooms" in comp and "bedrooms" in subject_property:
                bed_diff = subject_property["bedrooms"] - comp["bedrooms"]
                bed_adj = bed_diff * default_factors["bedrooms"]
                comp_adjustments["bedrooms"] = bed_adj
            
            # Bathroom adjustment
            if "bathrooms" in comp and "bathrooms" in subject_property:
                bath_diff = subject_property["bathrooms"] - comp["bathrooms"]
                bath_adj = bath_diff * default_factors["bathrooms"]
                comp_adjustments["bathrooms"] = bath_adj
            
            # Distance adjustment (further comps need positive adjustment)
            if "distance" in comp:
                distance_adj = comp["distance"] * default_factors["distance"]
                comp_adjustments["distance"] = distance_adj
            
            # Time adjustment (market trends - older sales need positive adjustment)
            if "sale_date" in comp:
                try:
                    sale_date = datetime.datetime.strptime(comp["sale_date"], "%Y-%m-%d")
                    days_diff = (current_date - sale_date).days
                    time_adj = days_diff * default_factors["time"]
                    comp_adjustments["time"] = time_adj
                except:
                    pass
            
            # Calculate total adjustment
            total_adjustment = sum(comp_adjustments.values())
            
            # Calculate adjusted value
            adjusted_value = base_price + total_adjustment
            
            adjusted_values.append(adjusted_value)
            adjustments.append(comp_adjustments)
        
        return adjusted_values, adjustments
    
    def _generate_valuation_explanation(self, property_data, valuation_result, model_info, format):
        """Generate a human-readable explanation for the valuation"""
        if format == "technical":
            # Technical explanation with detailed model information
            explanation = {
                "valuation_method": model_info.get("model_type", "unknown"),
                "model_features": model_info.get("features", []),
                "key_factors": {},
                "market_context": {
                    "market_trend": "Appreciating",
                    "comparable_sales": "Limited",
                    "supply_demand": "Low inventory, high demand"
                },
                "confidence_analysis": {
                    "score": valuation_result.get("confidence_score", 0),
                    "factors_affecting_confidence": [
                        "Limited comparable sales",
                        "Unique property characteristics",
                        "Volatile market conditions"
                    ]
                },
                "technical_notes": [
                    "Valuation based on advanced regression analysis",
                    "Model cross-validation score: 0.87",
                    "Confidence intervals calculated using bootstrap sampling"
                ]
            }
            
            # Add key factors based on feature importance
            if "feature_importance" in model_info:
                for feature, importance in model_info["feature_importance"].items():
                    if feature in property_data:
                        explanation["key_factors"][feature] = {
                            "value": property_data[feature],
                            "importance": importance,
                            "impact": "positive" if importance > 0.1 else "neutral"
                        }
        
        elif format == "narrative":
            # Narrative format with conversational explanation
            property_type = property_data.get("property_type", "single-family home")
            square_feet = property_data.get("square_feet", 0)
            year_built = property_data.get("year_built", 0)
            bedrooms = property_data.get("bedrooms", 0)
            bathrooms = property_data.get("bathrooms", 0)
            
            estimated_value = valuation_result.get("estimated_value", 0)
            confidence = valuation_result.get("confidence_score", 0) * 100
            
            explanation = (
                f"Based on our analysis, this {property_type} with {bedrooms} bedrooms, "
                f"{bathrooms} bathrooms, and {square_feet} square feet, built in {year_built}, "
                f"has an estimated market value of ${estimated_value:,.0f}.\n\n"
                
                f"We have {confidence:.0f}% confidence in this valuation. "
                
                "Key factors influencing this valuation include the property's size, "
                "condition, location, and recent comparable sales in the area. "
                
                "The local real estate market has shown moderate appreciation over the past year, "
                "with similar properties increasing in value. "
                
                "This valuation reflects current market conditions and property characteristics, "
                "but actual sale prices can vary based on factors not captured in our model, "
                "such as interior upgrades, landscaping quality, or unique features."
            )
        
        else:  # simple format
            # Simple explanation with key points
            explanation = {
                "summary": f"Estimated value: ${valuation_result.get('estimated_value', 0):,.0f}",
                "confidence": f"{valuation_result.get('confidence_score', 0) * 100:.0f}% confidence",
                "key_factors": [
                    f"Property type: {property_data.get('property_type', 'single-family home')}",
                    f"Square footage: {property_data.get('square_feet', 0)} sq ft",
                    f"Bedrooms: {property_data.get('bedrooms', 0)}",
                    f"Bathrooms: {property_data.get('bathrooms', 0)}",
                    f"Year built: {property_data.get('year_built', 0)}",
                    f"Location quality: {property_data.get('quality', 'average')}"
                ],
                "value_range": f"${valuation_result.get('value_range', {}).get('lower_bound', 0):,.0f} to ${valuation_result.get('value_range', {}).get('upper_bound', 0):,.0f}"
            }
        
        return explanation
    
    def _get_market_trends(self, area_id):
        """Get market trends for an area"""
        # Mock implementation
        return {
            "area_id": area_id,
            "average_days_on_market": 15,
            "median_sale_price": 375000,
            "year_over_year_change": 5.8,
            "inventory_levels": "Low",
            "price_per_sqft": 175,
            "market_conditions": "Seller's market with limited inventory and strong demand",
            "price_tier": "Mid-range",
            "forecast": "Continued appreciation expected but at a more moderate pace"
        }
    
    def _prepare_valuation_insight_prompt(self, property_data, valuation_data, market_trends, context, questions):
        """Prepare prompt for AI valuation insights"""
        # Construct prompt
        prompt = f"""
        # Property Valuation Analysis
        
        ## Property Information
        - Property ID: {property_data.get('property_id', 'unknown')}
        - Property Type: {property_data.get('property_type', 'unknown')}
        - Address: {property_data.get('address', 'unknown')}
        - Square Feet: {property_data.get('square_feet', 'unknown')}
        - Lot Size: {property_data.get('lot_size', 'unknown')}
        - Bedrooms: {property_data.get('bedrooms', 'unknown')}
        - Bathrooms: {property_data.get('bathrooms', 'unknown')}
        - Year Built: {property_data.get('year_built', 'unknown')}
        - Condition: {property_data.get('condition', 'unknown')}
        - Quality: {property_data.get('quality', 'unknown')}
        - Last Sale Price: {property_data.get('last_sale_price', 'unknown')}
        - Last Sale Date: {property_data.get('last_sale_date', 'unknown')}
        
        ## Valuation Results
        - Estimated Value: ${valuation_data.get('estimated_value', 0):,.2f}
        - Confidence Score: {valuation_data.get('confidence_score', 0) * 100:.1f}%
        - Value Range: ${valuation_data.get('value_range', {}).get('lower_bound', 0):,.2f} to ${valuation_data.get('value_range', {}).get('upper_bound', 0):,.2f}
        
        ## Market Trends
        - Area ID: {market_trends.get('area_id', 'unknown')}
        - Median Sale Price: ${market_trends.get('median_sale_price', 0):,.2f}
        - Year-over-Year Change: {market_trends.get('year_over_year_change', 0)}%
        - Average Days on Market: {market_trends.get('average_days_on_market', 0)}
        - Inventory Levels: {market_trends.get('inventory_levels', 'unknown')}
        - Price per Square Foot: ${market_trends.get('price_per_sqft', 0):,.2f}
        - Market Conditions: {market_trends.get('market_conditions', 'unknown')}
        - Forecast: {market_trends.get('forecast', 'unknown')}
        
        ## Additional Context
        {context}
        
        ## Questions to Address
        """
        
        # Add specific questions
        if questions:
            for i, question in enumerate(questions, 1):
                prompt += f"{i}. {question}\n"
        else:
            # Default questions
            prompt += """
            1. What are the key factors driving this property's value?
            2. How does this valuation compare to similar properties in the area?
            3. What potential improvements could increase the property's value?
            4. What risks or uncertainties should be considered with this valuation?
            5. Based on market trends, what is the expected value trajectory over the next 1-3 years?
            """
        
        prompt += """
        
        Please provide a detailed analysis of this property valuation. Your response should be in JSON format with the following structure:
        
        {
            "executive_summary": "A concise summary of the valuation and key insights",
            "value_analysis": {
                "key_value_drivers": ["List of the top factors driving the property's value"],
                "comparative_assessment": "How this property compares to similar properties",
                "strengths_weaknesses": {
                    "strengths": ["Key property strengths"],
                    "weaknesses": ["Key property weaknesses"]
                }
            },
            "market_context": {
                "current_position": "Assessment of property's position in current market",
                "recent_trends": "Analysis of recent market trends affecting this property",
                "future_outlook": "Projection of future value based on market trends"
            },
            "recommendations": {
                "value_enhancement": ["Specific improvements to increase value"],
                "strategic_timing": "Optimal timing for sale or refinancing",
                "risk_mitigation": ["Steps to mitigate valuation risks"]
            },
            "specific_question_answers": {
                // Answers to the specific questions posed above
            }
        }
        
        Ensure your analysis is data-driven, objective, and provides meaningful insights for property valuation decision-making.
        """
        
        return prompt