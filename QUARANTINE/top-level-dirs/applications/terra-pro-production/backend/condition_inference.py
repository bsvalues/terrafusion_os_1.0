"""
TerraFusion Property Condition Inference
More efficient implementation of property condition scoring with model versioning
"""

import os
import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2
from PIL import Image
import numpy as np
from datetime import datetime

# Import model versioning system
try:
    from backend.model_versioning import (
        get_model_path, 
        get_current_version,
        register_model_version,
        initialize_model_registry
    )
    MODEL_VERSIONING_AVAILABLE = True
except ImportError:
    MODEL_VERSIONING_AVAILABLE = False
    print("Model versioning system not available. Using local model path.")

# Import deployment logger
try:
    from backend.model_deployment_logger import (
        log_deployment_event,
        get_fallback_model_version,
        get_current_deployment_info,
        EVENT_DEPLOYMENT,
        EVENT_ERROR,
        EVENT_RECOVERY
    )
    DEPLOYMENT_LOGGER_AVAILABLE = True
except ImportError:
    DEPLOYMENT_LOGGER_AVAILABLE = False
    print("Deployment logger not available. Deployment events will not be tracked.")

class ConditionScorer:
    """
    Handles loading and inference for the property condition model
    More efficient implementation with versioning support
    """
    def __init__(self, model_path=None, version=None):
        """
        Initialize the model with the specified model path or version
        
        Args:
            model_path: Path to the trained model weights (if None, use versioning system)
            version: Specific version to load (if None, use current version)
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.version = version
        self.model_path = model_path
        self.fallback_model = None
        
        # Initialize the MobileNetV2 model architecture
        self.model = mobilenet_v2(pretrained=True)
        
        # Modify the classifier to output 5 classes (condition levels 1-5)
        num_ftrs = self.model.classifier[1].in_features
        self.model.classifier[1] = torch.nn.Linear(num_ftrs, 5)
        
        # Load model weights using versioning system if available
        self.model_loaded = False
        
        # Track if we're using a fallback version
        self.using_fallback = False
        
        if MODEL_VERSIONING_AVAILABLE and model_path is None:
            try:
                if version is None:
                    # Get current version
                    self.version = get_current_version("condition_model")
                    
                # Get model path for the specified version
                resolved_path = get_model_path("condition_model", self.version)
                print(f"Using versioned model: condition_model v{self.version}")
                self.model_path = resolved_path
                
                # Load the model
                self.model.load_state_dict(torch.load(resolved_path, map_location=self.device))
                self.model.eval()
                self.model_loaded = True
                print(f"Model v{self.version} loaded successfully from {resolved_path}")
                
                # Log deployment event if logger is available
                if DEPLOYMENT_LOGGER_AVAILABLE:
                    metadata = {"device": str(self.device), "path": resolved_path}
                    log_deployment_event(
                        EVENT_DEPLOYMENT,
                        "condition_model",
                        self.version,
                        f"Model v{self.version} loaded successfully",
                        metadata
                    )
                
                # Check if we should preload fallback model
                if DEPLOYMENT_LOGGER_AVAILABLE:
                    fallback_version = get_fallback_model_version()
                    if fallback_version and fallback_version != self.version:
                        try:
                            # Load fallback model
                            fallback_path = get_model_path("condition_model", fallback_version)
                            self.fallback_model = mobilenet_v2(pretrained=True)
                            num_ftrs = self.fallback_model.classifier[1].in_features
                            self.fallback_model.classifier[1] = torch.nn.Linear(num_ftrs, 5)
                            self.fallback_model.load_state_dict(torch.load(fallback_path, map_location=self.device))
                            self.fallback_model.eval()
                            self.fallback_model.to(self.device)
                            print(f"Fallback model v{fallback_version} loaded successfully (ready for automatic fallback)")
                        except Exception as e:
                            print(f"Error loading fallback model: {str(e)}")
                
            except Exception as e:
                print(f"Error loading versioned model: {str(e)}")
                print("Falling back to default model path")
                
                # Log error event
                if DEPLOYMENT_LOGGER_AVAILABLE:
                    log_deployment_event(
                        EVENT_ERROR,
                        "condition_model",
                        str(self.version) if self.version else "unknown",
                        f"Error loading model: {str(e)}",
                        {"error": str(e)}
                    )
                
                # Try to load fallback version if available
                if DEPLOYMENT_LOGGER_AVAILABLE:
                    fallback_version = get_fallback_model_version()
                    if fallback_version:
                        try:
                            # Attempt to load the fallback version
                            fallback_path = get_model_path("condition_model", fallback_version)
                            self.model.load_state_dict(torch.load(fallback_path, map_location=self.device))
                            self.model.eval()
                            self.model_loaded = True
                            self.using_fallback = True
                            self.version = fallback_version
                            print(f"Successfully loaded fallback model v{fallback_version}")
                            
                            # Log recovery event
                            log_deployment_event(
                                EVENT_RECOVERY,
                                "condition_model",
                                fallback_version,
                                f"Recovered using fallback model v{fallback_version}",
                                {"fallback_path": fallback_path}
                            )
                        except Exception as fallback_error:
                            print(f"Error loading fallback model: {str(fallback_error)}")
                
                # Fall back to provided path or default path if all else fails
                if not self.model_loaded:
                    self.model_path = model_path or os.path.join(os.getcwd(), "models", "condition_model.pth")
        
        # Load from specific path if versioning failed or not available
        if not self.model_loaded and self.model_path is not None:
            if os.path.exists(self.model_path):
                try:
                    self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                    self.model.eval()  # Set to evaluation mode
                    self.model_loaded = True
                    print(f"Model loaded successfully from {self.model_path}")
                    
                    # Log deployment event
                    if DEPLOYMENT_LOGGER_AVAILABLE and not self.using_fallback:
                        log_deployment_event(
                            EVENT_DEPLOYMENT,
                            "condition_model",
                            version or "1.0.0",
                            f"Model loaded from path: {self.model_path}",
                            {"path": self.model_path}
                        )
                    
                    # Register this model if versioning is available but it wasn't loaded from registry
                    if MODEL_VERSIONING_AVAILABLE and version is None and not self.model_path.startswith(os.path.join(os.getcwd(), "models", "registry")):
                        try:
                            # Register the current model if it's not already in the registry
                            initialize_model_registry(self.model_path)
                            print(f"Model registered in versioning system")
                        except Exception as e:
                            print(f"Error registering model: {str(e)}")
                except Exception as e:
                    print(f"Error loading model: {str(e)}")
                    
                    # Log error event
                    if DEPLOYMENT_LOGGER_AVAILABLE:
                        log_deployment_event(
                            EVENT_ERROR,
                            "condition_model",
                            version or "unknown",
                            f"Error loading model from path: {str(e)}",
                            {"error": str(e), "path": self.model_path}
                        )
            else:
                print(f"Model file not found at {self.model_path}. Using fallback scoring.")
        
        self.model.to(self.device)
        
        # Define image transformations for model inference
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    
    def predict_condition(self, image_path):
        """
        Predict the condition score (1-5) of a property based on an image
        
        Args:
            image_path: Path to the property image
            
        Returns:
            score: A float between 1.0 and 5.0 representing the property condition
        """
        # If model isn't loaded, use fallback scoring method
        if not self.model_loaded:
            return self._fallback_scoring(image_path)
            
        try:
            # Load and transform the image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                
                # Get softmax probabilities
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
                
                # Calculate weighted average for a more precise score
                weighted_score = 0
                for i in range(5):
                    weighted_score += (i + 1) * probabilities[i].item()
                
                # Return the weighted score (between 1-5)
                return float(weighted_score)
        except Exception as e:
            print(f"Error predicting condition with primary model: {str(e)}")
            
            # Log error event
            if DEPLOYMENT_LOGGER_AVAILABLE:
                log_deployment_event(
                    EVENT_ERROR,
                    "condition_model",
                    str(self.version) if self.version else "unknown",
                    f"Error during prediction: {str(e)}",
                    {"error": str(e), "image_path": image_path}
                )
            
            # Try using the preloaded fallback model if available
            if self.fallback_model is not None:
                try:
                    print("Attempting prediction with fallback model...")
                    # Transform the image again to be safe
                    image = Image.open(image_path).convert('RGB')
                    image_tensor = self.transform(image).unsqueeze(0).to(self.device)
                    
                    # Make prediction with fallback model
                    with torch.no_grad():
                        outputs = self.fallback_model(image_tensor)
                        
                        # Get softmax probabilities
                        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
                        
                        # Calculate weighted average for a more precise score
                        weighted_score = 0
                        for i in range(5):
                            weighted_score += (i + 1) * probabilities[i].item()
                        
                        # Log recovery event
                        if DEPLOYMENT_LOGGER_AVAILABLE:
                            fallback_version = get_fallback_model_version()
                            log_deployment_event(
                                EVENT_RECOVERY,
                                "condition_model",
                                fallback_version or "unknown",
                                f"Successfully used fallback model for prediction",
                                {"image_path": image_path}
                            )
                        
                        print(f"Fallback model prediction successful: {weighted_score}")
                        return float(weighted_score)
                except Exception as fallback_error:
                    print(f"Error using fallback model: {str(fallback_error)}")
            
            # If all else fails, use the algorithmic fallback scoring
            return self._fallback_scoring(image_path)
    
    def _fallback_scoring(self, image_path):
        """
        Fallback method for scoring when the model is not available.
        Uses simple image analysis to estimate condition.
        
        Args:
            image_path: Path to the property image
            
        Returns:
            score: A float between 1.0 and 5.0 representing the property condition
        """
        try:
            # Load the image
            image = Image.open(image_path).convert('RGB')
            
            # Resize for faster processing
            image = image.resize((128, 128))
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Calculate basic image statistics
            brightness = np.mean(img_array)
            contrast = np.std(img_array)
            
            # Simple heuristic based on brightness and contrast
            # Higher brightness and contrast often correlate with better condition
            score_brightness = (brightness / 255) * 2.5  # Scale to 0-2.5
            score_contrast = (min(contrast, 80) / 80) * 2.5  # Scale to 0-2.5, cap at 80
            
            # Combine scores
            score = score_brightness + score_contrast
            
            # Ensure the score is within range 1.0-5.0
            score = max(1.0, min(5.0, score))
            
            return score
        except Exception as e:
            print(f"Error in fallback scoring: {str(e)}")
            # Return a neutral score if all else fails
            return 3.0