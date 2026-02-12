#!/usr/bin/env python
"""
Feature Flag Manager for GeoAssessmentPro

This module provides a feature flag management system that supports environment-specific
feature enabling/disabling, gradual rollout, and A/B testing.
"""

import os
import sys
import json
import time
import random
import logging
import datetime
import threading
from flask import Blueprint, jsonify, request, current_app, g, session
from typing import Dict, List, Any, Tuple, Optional, Callable, Union

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Blueprint for feature flag routes
feature_bp = Blueprint("features", __name__)

class Feature:
    """Feature flag class"""
    
    def __init__(self, 
                name: str, 
                description: str,
                enabled: bool = False,
                environments: Optional[List[str]] = None,
                rollout_percentage: int = 100,
                user_groups: Optional[List[str]] = None,
                start_date: Optional[datetime.datetime] = None,
                end_date: Optional[datetime.datetime] = None,
                tags: Optional[List[str]] = None,
                variant_weights: Optional[Dict[str, int]] = None):
        """
        Initialize a feature flag
        
        Args:
            name: Feature name
            description: Feature description
            enabled: Whether the feature is enabled
            environments: List of environments where the feature is enabled
            rollout_percentage: Percentage of users that see the feature (0-100)
            user_groups: List of user groups that see the feature
            start_date: Date when the feature becomes active
            end_date: Date when the feature becomes inactive
            tags: List of tags for categorizing features
            variant_weights: Dict of variant names and their weights for A/B testing
        """
        self.name = name
        self.description = description
        self.enabled = enabled
        self.environments = environments or ["development", "training", "production"]
        self.rollout_percentage = rollout_percentage
        self.user_groups = user_groups or []
        
        # Convert string dates to datetime
        if start_date and isinstance(start_date, str):
            self.start_date = datetime.datetime.fromisoformat(start_date)
        else:
            self.start_date = start_date
        
        if end_date and isinstance(end_date, str):
            self.end_date = datetime.datetime.fromisoformat(end_date)
        else:
            self.end_date = end_date
        
        self.tags = tags or []
        self.variant_weights = variant_weights or {"default": 100}
        self.last_modified = datetime.datetime.utcnow()
        self.usage_count = 0
        self.unique_users = set()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert feature to dictionary
        
        Returns:
            Dict representation of the feature
        """
        return {
            "name": self.name,
            "description": self.description,
            "enabled": self.enabled,
            "environments": self.environments,
            "rollout_percentage": self.rollout_percentage,
            "user_groups": self.user_groups,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "tags": self.tags,
            "variant_weights": self.variant_weights,
            "last_modified": self.last_modified.isoformat(),
            "usage_count": self.usage_count,
            "unique_users_count": len(self.unique_users)
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Feature':
        """
        Create feature from dictionary
        
        Args:
            data: Dict representation of the feature
            
        Returns:
            Feature instance
        """
        feature = cls(
            name=data["name"],
            description=data.get("description", ""),
            enabled=data.get("enabled", False),
            environments=data.get("environments", ["development", "training", "production"]),
            rollout_percentage=data.get("rollout_percentage", 100),
            user_groups=data.get("user_groups", []),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            tags=data.get("tags", []),
            variant_weights=data.get("variant_weights", {"default": 100})
        )
        
        # Restore usage statistics if available
        if "usage_count" in data:
            feature.usage_count = data["usage_count"]
        if "unique_users" in data:
            feature.unique_users = set(data["unique_users"])
        
        return feature

class FeatureManager:
    """Feature flag manager"""
    
    def __init__(self, config_file: str = "features.json"):
        """
        Initialize feature flag manager
        
        Args:
            config_file: Path to feature configuration file
        """
        self.config_file = config_file
        self.features = {}
        self.lock = threading.Lock()
        self.load_features()
    
    def load_features(self) -> None:
        """Load features from configuration file"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, "r") as f:
                    data = json.load(f)
                
                with self.lock:
                    self.features = {}
                    for feature_data in data:
                        feature = Feature.from_dict(feature_data)
                        self.features[feature.name] = feature
                
                logger.info(f"Loaded {len(self.features)} features from {self.config_file}")
            else:
                logger.warning(f"Feature configuration file {self.config_file} not found")
        except Exception as e:
            logger.error(f"Error loading features: {str(e)}")
    
    def save_features(self) -> None:
        """Save features to configuration file"""
        try:
            with self.lock:
                data = [feature.to_dict() for feature in self.features.values()]
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(self.config_file)), exist_ok=True)
            
            with open(self.config_file, "w") as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(self.features)} features to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving features: {str(e)}")
    
    def add_feature(self, feature: Feature) -> None:
        """
        Add a new feature
        
        Args:
            feature: Feature to add
        """
        with self.lock:
            self.features[feature.name] = feature
        
        self.save_features()
        logger.info(f"Added feature: {feature.name}")
    
    def update_feature(self, feature_name: str, **kwargs) -> Optional[Feature]:
        """
        Update an existing feature
        
        Args:
            feature_name: Name of the feature to update
            **kwargs: Feature attributes to update
            
        Returns:
            Updated feature or None if feature not found
        """
        with self.lock:
            if feature_name not in self.features:
                return None
            
            feature = self.features[feature_name]
            
            # Update feature attributes
            for key, value in kwargs.items():
                if hasattr(feature, key):
                    setattr(feature, key, value)
            
            # Update last modified timestamp
            feature.last_modified = datetime.datetime.utcnow()
        
        self.save_features()
        logger.info(f"Updated feature: {feature_name}")
        
        return feature
    
    def remove_feature(self, feature_name: str) -> bool:
        """
        Remove a feature
        
        Args:
            feature_name: Name of the feature to remove
            
        Returns:
            True if feature was removed, False otherwise
        """
        with self.lock:
            if feature_name not in self.features:
                return False
            
            del self.features[feature_name]
        
        self.save_features()
        logger.info(f"Removed feature: {feature_name}")
        
        return True
    
    def get_feature(self, feature_name: str) -> Optional[Feature]:
        """
        Get a feature by name
        
        Args:
            feature_name: Name of the feature to get
            
        Returns:
            Feature or None if feature not found
        """
        with self.lock:
            return self.features.get(feature_name)
    
    def get_all_features(self) -> List[Feature]:
        """
        Get all features
        
        Returns:
            List of all features
        """
        with self.lock:
            return list(self.features.values())
    
    def is_feature_enabled(self, feature_name: str, 
                          environment: Optional[str] = None,
                          user_id: Optional[str] = None,
                          user_groups: Optional[List[str]] = None,
                          default: bool = False) -> bool:
        """
        Check if a feature is enabled
        
        Args:
            feature_name: Name of the feature to check
            environment: Current environment
            user_id: User ID for consistent bucketing
            user_groups: List of user groups the user belongs to
            default: Default value if feature not found
            
        Returns:
            True if feature is enabled, False otherwise
        """
        # Get environment from app config if not provided
        if environment is None:
            try:
                environment = current_app.config.get("ENV_MODE", "development")
            except RuntimeError:
                environment = os.environ.get("ENV_MODE", "development")
        
        # Get user ID from session if not provided
        if user_id is None and has_request_context():
            user_id = session.get("user", {}).get("id")
        
        # Get user groups from session if not provided
        if user_groups is None and has_request_context():
            user_groups = session.get("user", {}).get("roles", [])
        
        with self.lock:
            # Check if feature exists
            if feature_name not in self.features:
                return default
            
            feature = self.features[feature_name]
            
            # Check if feature is enabled
            if not feature.enabled:
                return False
            
            # Check if feature is active in current environment
            if environment not in feature.environments:
                return False
            
            # Check if feature is within active date range
            now = datetime.datetime.utcnow()
            if feature.start_date and now < feature.start_date:
                return False
            if feature.end_date and now > feature.end_date:
                return False
            
            # Check if user is in allowed groups
            if feature.user_groups and user_groups:
                if not any(group in feature.user_groups for group in user_groups):
                    return False
            
            # Check rollout percentage
            if user_id and feature.rollout_percentage < 100:
                # Use consistent hashing to assign users to buckets
                import hashlib
                bucket_id = int(hashlib.md5(f"{feature_name}:{user_id}".encode()).hexdigest(), 16) % 100
                if bucket_id >= feature.rollout_percentage:
                    return False
            
            # Record usage
            feature.usage_count += 1
            if user_id:
                feature.unique_users.add(user_id)
            
            return True
    
    def get_variant(self, feature_name: str,
                   user_id: Optional[str] = None,
                   default_variant: str = "default") -> str:
        """
        Get A/B testing variant for a feature
        
        Args:
            feature_name: Name of the feature
            user_id: User ID for consistent variant assignment
            default_variant: Default variant if feature not found
            
        Returns:
            Variant name
        """
        # Get user ID from session if not provided
        if user_id is None and has_request_context():
            user_id = session.get("user", {}).get("id")
        
        # If no user ID, use a random variant
        if not user_id:
            import random
            user_id = str(random.randint(1, 1000000))
        
        with self.lock:
            # Check if feature exists
            if feature_name not in self.features:
                return default_variant
            
            feature = self.features[feature_name]
            
            # If no variants defined or only default, return default
            if not feature.variant_weights or len(feature.variant_weights) <= 1:
                return default_variant
            
            # Use consistent hashing to assign users to variants
            import hashlib
            hash_value = int(hashlib.md5(f"{feature_name}:{user_id}".encode()).hexdigest(), 16)
            
            # Calculate total weight
            total_weight = sum(feature.variant_weights.values())
            
            # Get variant based on weight
            variant_breakpoint = hash_value % total_weight
            cumulative_weight = 0
            
            for variant, weight in feature.variant_weights.items():
                cumulative_weight += weight
                if variant_breakpoint < cumulative_weight:
                    return variant
            
            return default_variant
    
    def record_conversion(self, feature_name: str, 
                         variant: Optional[str] = None,
                         user_id: Optional[str] = None,
                         event_type: str = "conversion") -> bool:
        """
        Record conversion event for A/B testing
        
        Args:
            feature_name: Name of the feature
            variant: Variant name
            user_id: User ID
            event_type: Type of conversion event
            
        Returns:
            True if event was recorded, False otherwise
        """
        # TODO: Implement conversion tracking
        return True

# Create global feature manager
feature_manager = FeatureManager()

def has_request_context() -> bool:
    """
    Check if there is a request context
    
    Returns:
        True if there is a request context, False otherwise
    """
    try:
        return bool(request)
    except RuntimeError:
        return False

@feature_bp.route("/api/features", methods=["GET"])
def get_features():
    """
    Get all features
    
    Returns:
        JSON response with all features
    """
    features = feature_manager.get_all_features()
    return jsonify([feature.to_dict() for feature in features])

@feature_bp.route("/api/features/<feature_name>", methods=["GET"])
def get_feature(feature_name):
    """
    Get a specific feature
    
    Args:
        feature_name: Name of the feature to get
        
    Returns:
        JSON response with feature details
    """
    feature = feature_manager.get_feature(feature_name)
    
    if not feature:
        return jsonify({"error": f"Feature {feature_name} not found"}), 404
    
    return jsonify(feature.to_dict())

@feature_bp.route("/api/features", methods=["POST"])
def add_feature():
    """
    Add a new feature
    
    Returns:
        JSON response with result
    """
    data = request.json
    
    if not data.get("name"):
        return jsonify({"error": "Feature name is required"}), 400
    
    feature = Feature.from_dict(data)
    feature_manager.add_feature(feature)
    
    return jsonify(feature.to_dict()), 201

@feature_bp.route("/api/features/<feature_name>", methods=["PUT"])
def update_feature(feature_name):
    """
    Update a feature
    
    Args:
        feature_name: Name of the feature to update
        
    Returns:
        JSON response with result
    """
    data = request.json
    
    feature = feature_manager.update_feature(feature_name, **data)
    
    if not feature:
        return jsonify({"error": f"Feature {feature_name} not found"}), 404
    
    return jsonify(feature.to_dict())

@feature_bp.route("/api/features/<feature_name>", methods=["DELETE"])
def remove_feature(feature_name):
    """
    Remove a feature
    
    Args:
        feature_name: Name of the feature to remove
        
    Returns:
        JSON response with result
    """
    result = feature_manager.remove_feature(feature_name)
    
    if not result:
        return jsonify({"error": f"Feature {feature_name} not found"}), 404
    
    return jsonify({"message": f"Feature {feature_name} removed"})

@feature_bp.route("/api/features/<feature_name>/enabled", methods=["GET"])
def is_feature_enabled(feature_name):
    """
    Check if a feature is enabled
    
    Args:
        feature_name: Name of the feature to check
        
    Returns:
        JSON response with result
    """
    environment = request.args.get("environment")
    user_id = request.args.get("user_id")
    user_groups = request.args.getlist("user_groups")
    
    enabled = feature_manager.is_feature_enabled(
        feature_name,
        environment=environment,
        user_id=user_id,
        user_groups=user_groups
    )
    
    return jsonify({"enabled": enabled})

@feature_bp.route("/api/features/<feature_name>/variant", methods=["GET"])
def get_variant(feature_name):
    """
    Get A/B testing variant for a feature
    
    Args:
        feature_name: Name of the feature
        
    Returns:
        JSON response with result
    """
    user_id = request.args.get("user_id")
    default_variant = request.args.get("default", "default")
    
    variant = feature_manager.get_variant(
        feature_name,
        user_id=user_id,
        default_variant=default_variant
    )
    
    return jsonify({"variant": variant})

def register_blueprint(app):
    """
    Register feature flag blueprint with the application
    
    Args:
        app: Flask application
    """
    app.register_blueprint(feature_bp)
    
    # Add feature checking function to template context
    @app.context_processor
    def inject_features():
        return {
            "feature_enabled": feature_manager.is_feature_enabled,
            "feature_variant": feature_manager.get_variant
        }
    
    logger.info("Feature flag system registered")
    
    # Register feature flag middleware to automatically include available features in response
    @app.after_request
    def add_feature_headers(response):
        # Only add headers if requested
        if request.args.get("include_features") == "true":
            features = {
                name: feature_manager.is_feature_enabled(name)
                for name in request.args.getlist("features")
            }
            
            if features:
                response.headers["X-Features"] = json.dumps(features)
        
        return response
    
    return feature_manager

def feature_enabled(feature_name: str, default: bool = False):
    """
    Decorator to enable/disable a route based on a feature flag
    
    Args:
        feature_name: Name of the feature
        default: Default value if feature not found
        
    Returns:
        Decorator function
    """
    def decorator(f):
        def wrapped(*args, **kwargs):
            if not feature_manager.is_feature_enabled(feature_name, default=default):
                from flask import abort
                return abort(404)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def initialize_feature_flags():
    """Initialize feature flags with some defaults for testing"""
    # Only add default flags if none exist
    if not feature_manager.get_all_features():
        # Add some default features
        feature_manager.add_feature(Feature(
            name="new_dashboard",
            description="New dashboard UI",
            enabled=True,
            environments=["development", "training"],
            rollout_percentage=100,
            tags=["ui", "dashboard"]
        ))
        
        feature_manager.add_feature(Feature(
            name="advanced_search",
            description="Advanced search capabilities",
            enabled=True,
            environments=["development"],
            rollout_percentage=50,
            tags=["search", "experimental"]
        ))
        
        feature_manager.add_feature(Feature(
            name="multi_environment_support",
            description="Support for multiple environments",
            enabled=True,
            environments=["development", "training", "production"],
            tags=["infrastructure", "core"]
        ))
        
        feature_manager.add_feature(Feature(
            name="property_value_preview",
            description="Previewing property values with AI",
            enabled=False,
            environments=["development"],
            tags=["ai", "valuation", "experimental"],
            variant_weights={"control": 50, "variant_a": 25, "variant_b": 25}
        ))
        
        logger.info("Initialized default feature flags")

if __name__ == "__main__":
    # This is mainly for testing
    initialize_feature_flags()
    features = feature_manager.get_all_features()
    
    print(f"Loaded {len(features)} features:")
    for feature in features:
        print(f"  - {feature.name}: {feature.enabled}")
    
    # Test feature enabling/disabling
    print(f"Is 'new_dashboard' enabled? {feature_manager.is_feature_enabled('new_dashboard')}")
    print(f"Is 'property_value_preview' enabled? {feature_manager.is_feature_enabled('property_value_preview')}")
    
    # Test A/B testing
    for i in range(5):
        user_id = f"user_{i}"
        variant = feature_manager.get_variant("property_value_preview", user_id=user_id)
        print(f"User {user_id} gets variant: {variant}")