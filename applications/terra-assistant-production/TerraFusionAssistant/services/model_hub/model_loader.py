"""
Model Loader

This module implements functionality for loading and serving AI models.
"""
import os
import json
import logging
import importlib
from typing import Dict, Any, Optional, List, Union, Callable
from enum import Enum

# Import model registry types
from .model_registry import ModelType, ModelFamily, ModelRegistry

class ModelLoader:
    """
    Model loader for handling model loading and inference.
    
    This class provides:
    - Loading models from different providers
    - Caching loaded models
    - Standardized inference interface
    """
    
    def __init__(self, model_registry: ModelRegistry):
        """
        Initialize the model loader.
        
        Args:
            model_registry: Model registry instance
        """
        self.model_registry = model_registry
        self.loaded_models = {}
        self.logger = logging.getLogger('model_loader')
        
        # Initialize provider-specific clients
        self._init_model_providers()
    
    def _init_model_providers(self) -> None:
        """Initialize provider-specific clients."""
        # Map of model family to initialization function
        self.provider_init = {
            ModelFamily.OPENAI.value: self._init_openai,
            ModelFamily.ANTHROPIC.value: self._init_anthropic,
            ModelFamily.HUGGINGFACE.value: self._init_huggingface,
            ModelFamily.CUSTOM.value: self._init_custom
        }
        
        # Map of model family to inference function
        self.provider_infer = {
            ModelFamily.OPENAI.value: self._infer_openai,
            ModelFamily.ANTHROPIC.value: self._infer_anthropic,
            ModelFamily.HUGGINGFACE.value: self._infer_huggingface,
            ModelFamily.CUSTOM.value: self._infer_custom
        }
        
        # Initialize all providers
        for provider, init_func in self.provider_init.items():
            try:
                init_func()
                self.logger.info(f"Initialized {provider} model provider")
            except Exception as e:
                self.logger.error(f"Failed to initialize {provider} model provider: {str(e)}")
    
    def _init_openai(self) -> None:
        """Initialize OpenAI client."""
        try:
            import openai
            self.openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        except ImportError:
            self.logger.warning("OpenAI package not installed, OpenAI models will not be available")
            self.openai_client = None
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            self.openai_client = None
    
    def _init_anthropic(self) -> None:
        """Initialize Anthropic client."""
        try:
            import anthropic
            self.anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        except ImportError:
            self.logger.warning("Anthropic package not installed, Anthropic models will not be available")
            self.anthropic_client = None
        except Exception as e:
            self.logger.error(f"Failed to initialize Anthropic client: {str(e)}")
            self.anthropic_client = None
    
    def _init_huggingface(self) -> None:
        """Initialize Hugging Face client."""
        try:
            from huggingface_hub import HfApi
            self.hf_api = HfApi(token=os.environ.get("HUGGINGFACE_TOKEN"))
            self.hf_inference_enabled = True
        except ImportError:
            self.logger.warning("Hugging Face Hub package not installed, Hugging Face models will not be available")
            self.hf_api = None
            self.hf_inference_enabled = False
        except Exception as e:
            self.logger.error(f"Failed to initialize Hugging Face client: {str(e)}")
            self.hf_api = None
            self.hf_inference_enabled = False
    
    def _init_custom(self) -> None:
        """Initialize custom models infrastructure."""
        # In a real implementation, this would set up infrastructure for custom models
        # For this example, we'll just create an empty dictionary
        self.custom_models = {}
    
    def load_model(self, model_id: str, version_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Load a model for inference.
        
        Args:
            model_id: ID of the model to load
            version_id: Optional specific version ID to load
            
        Returns:
            Model metadata with loaded model
        """
        # Check if model is already loaded
        cache_key = f"{model_id}:{version_id}" if version_id else f"{model_id}:latest"
        if cache_key in self.loaded_models:
            return self.loaded_models[cache_key]
        
        # Get model and version metadata
        model = self.model_registry.get_model(model_id)
        if not model:
            raise ValueError(f"Model with ID {model_id} not found")
        
        if version_id:
            version = self.model_registry.get_model_version(model_id, version_id)
            if not version:
                raise ValueError(f"Version {version_id} of model {model_id} not found")
        else:
            # Get the production or latest version
            version = self.model_registry.get_production_version(model_id)
            if not version:
                version = self.model_registry.get_latest_version(model_id)
                if not version:
                    raise ValueError(f"No versions available for model {model_id}")
        
        # Load the model based on its family
        model_family = model['family']
        if model_family not in self.provider_init:
            raise ValueError(f"Unsupported model family: {model_family}")
        
        # Call the appropriate loading function
        loaded_info = self._load_model_by_family(model_family, model, version)
        
        # Cache the loaded model
        self.loaded_models[cache_key] = loaded_info
        
        self.logger.info(f"Loaded model {model_id} version {version['id']}")
        return loaded_info
    
    def _load_model_by_family(self, family: str, model: Dict[str, Any], version: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load a model based on its family.
        
        Args:
            family: Model family
            model: Model metadata
            version: Version metadata
            
        Returns:
            Loaded model information
        """
        if family == ModelFamily.OPENAI.value:
            return self._load_openai_model(model, version)
        elif family == ModelFamily.ANTHROPIC.value:
            return self._load_anthropic_model(model, version)
        elif family == ModelFamily.HUGGINGFACE.value:
            return self._load_huggingface_model(model, version)
        elif family == ModelFamily.CUSTOM.value:
            return self._load_custom_model(model, version)
        else:
            raise ValueError(f"Unsupported model family: {family}")
    
    def _load_openai_model(self, model: Dict[str, Any], version: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load an OpenAI model.
        
        Args:
            model: Model metadata
            version: Version metadata
            
        Returns:
            Loaded model information
        """
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        # For API-based models like OpenAI, we don't actually "load" the model,
        # we just prepare configuration for API calls
        config = version['configuration']
        
        # Keep track of model details for inference
        return {
            'model_id': model['id'],
            'version_id': version['id'],
            'family': ModelFamily.OPENAI.value,
            'config': config,
            'loaded': True,
            'model_name': config.get('model_name', 'gpt-4o')  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        }
    
    def _load_anthropic_model(self, model: Dict[str, Any], version: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load an Anthropic model.
        
        Args:
            model: Model metadata
            version: Version metadata
            
        Returns:
            Loaded model information
        """
        if not self.anthropic_client:
            raise RuntimeError("Anthropic client not initialized")
        
        # For API-based models like Anthropic, we don't actually "load" the model,
        # we just prepare configuration for API calls
        config = version['configuration']
        
        # Keep track of model details for inference
        return {
            'model_id': model['id'],
            'version_id': version['id'],
            'family': ModelFamily.ANTHROPIC.value,
            'config': config,
            'loaded': True,
            'model_name': config.get('model_name', 'claude-3-5-sonnet-20241022')  # the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024. do not change this unless explicitly requested by the user
        }
    
    def _load_huggingface_model(self, model: Dict[str, Any], version: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load a Hugging Face model.
        
        Args:
            model: Model metadata
            version: Version metadata
            
        Returns:
            Loaded model information
        """
        if not self.hf_inference_enabled:
            raise RuntimeError("Hugging Face inference not enabled")
        
        config = version['configuration']
        model_name = config.get('model_name', 'gpt2')
        use_local = config.get('use_local', False)
        
        # In a real implementation, this would download and load the model
        # For this example, we'll simulate loading
        
        # For local models
        if use_local:
            try:
                from transformers import AutoModel, AutoTokenizer
                
                # Load tokenizer and model
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                hf_model = AutoModel.from_pretrained(model_name)
                
                return {
                    'model_id': model['id'],
                    'version_id': version['id'],
                    'family': ModelFamily.HUGGINGFACE.value,
                    'config': config,
                    'loaded': True,
                    'model_name': model_name,
                    'model': hf_model,
                    'tokenizer': tokenizer
                }
            except Exception as e:
                self.logger.error(f"Failed to load Hugging Face model {model_name}: {str(e)}")
                raise
        
        # For API-based inference
        return {
            'model_id': model['id'],
            'version_id': version['id'],
            'family': ModelFamily.HUGGINGFACE.value,
            'config': config,
            'loaded': True,
            'model_name': model_name,
            'use_api': True
        }
    
    def _load_custom_model(self, model: Dict[str, Any], version: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load a custom model.
        
        Args:
            model: Model metadata
            version: Version metadata
            
        Returns:
            Loaded model information
        """
        config = version['configuration']
        artifact_uri = version['artifact_uri']
        
        # In a real implementation, this would load the custom model from the artifact URI
        # For this example, we'll simulate loading
        
        # Check if module information is provided
        if 'module_path' in config and 'class_name' in config:
            try:
                # Dynamically import the module and instantiate the model
                module_path = config['module_path']
                class_name = config['class_name']
                
                module = importlib.import_module(module_path)
                model_class = getattr(module, class_name)
                
                # Initialize the model with configuration
                custom_model = model_class(**config.get('init_params', {}))
                
                return {
                    'model_id': model['id'],
                    'version_id': version['id'],
                    'family': ModelFamily.CUSTOM.value,
                    'config': config,
                    'loaded': True,
                    'model': custom_model
                }
            except Exception as e:
                self.logger.error(f"Failed to load custom model: {str(e)}")
                raise
        
        # If no module information, just return metadata
        return {
            'model_id': model['id'],
            'version_id': version['id'],
            'family': ModelFamily.CUSTOM.value,
            'config': config,
            'loaded': True,
            'artifact_uri': artifact_uri
        }
    
    def infer(self, model_info: Dict[str, Any], 
             input_data: Union[str, Dict[str, Any], List[Dict[str, Any]]],
             options: Optional[Dict[str, Any]] = None) -> Any:
        """
        Perform inference with a loaded model.
        
        Args:
            model_info: Loaded model information
            input_data: Input data for inference
            options: Optional inference options
            
        Returns:
            Inference result
        """
        family = model_info['family']
        
        # Call the appropriate inference function
        if family not in self.provider_infer:
            raise ValueError(f"Unsupported model family for inference: {family}")
        
        return self.provider_infer[family](model_info, input_data, options or {})
    
    def _infer_openai(self, model_info: Dict[str, Any], 
                     input_data: Union[str, Dict[str, Any], List[Dict[str, Any]]],
                     options: Dict[str, Any]) -> Any:
        """
        Perform inference with an OpenAI model.
        
        Args:
            model_info: Loaded model information
            input_data: Input data for inference
            options: Inference options
            
        Returns:
            Inference result
        """
        if not self.openai_client:
            raise RuntimeError("OpenAI client not initialized")
        
        model_name = model_info['model_name']
        config = model_info['config']
        
        # Prepare messages
        if isinstance(input_data, str):
            messages = [{"role": "user", "content": input_data}]
        elif isinstance(input_data, dict):
            messages = [input_data]
        else:
            messages = input_data
        
        # Extract parameters
        params = {
            'model': model_name,
            'messages': messages,
            'temperature': options.get('temperature', config.get('temperature', 0.7)),
            'max_tokens': options.get('max_tokens', config.get('max_tokens', 1000)),
        }
        
        # Add response format if specified
        if 'response_format' in options:
            params['response_format'] = options['response_format']
        elif 'response_format' in config:
            params['response_format'] = config['response_format']
        
        try:
            response = self.openai_client.chat.completions.create(**params)
            return response.choices[0].message.content
        except Exception as e:
            self.logger.error(f"OpenAI inference error: {str(e)}")
            raise
    
    def _infer_anthropic(self, model_info: Dict[str, Any], 
                        input_data: Union[str, Dict[str, Any], List[Dict[str, Any]]],
                        options: Dict[str, Any]) -> Any:
        """
        Perform inference with an Anthropic model.
        
        Args:
            model_info: Loaded model information
            input_data: Input data for inference
            options: Inference options
            
        Returns:
            Inference result
        """
        if not self.anthropic_client:
            raise RuntimeError("Anthropic client not initialized")
        
        model_name = model_info['model_name']
        config = model_info['config']
        
        # Prepare messages
        if isinstance(input_data, str):
            # For simple string input, use it as the user message
            prompt = input_data
            system_prompt = options.get('system_prompt', config.get('system_prompt', ''))
        else:
            # For more complex inputs, we need to format them for Anthropic
            # This is a simplified approach and may need to be adapted
            messages = input_data if isinstance(input_data, list) else [input_data]
            
            # Extract system prompt if any
            system_messages = [m for m in messages if m.get('role') == 'system']
            system_prompt = system_messages[0]['content'] if system_messages else ''
            
            # Combine user and assistant messages
            user_assistant_messages = [m for m in messages if m.get('role') != 'system']
            prompt = '\n'.join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in user_assistant_messages])
        
        # Extract parameters
        params = {
            'model': model_name,
            'max_tokens': options.get('max_tokens', config.get('max_tokens', 1000)),
            'temperature': options.get('temperature', config.get('temperature', 0.7)),
        }
        
        # Add system prompt if specified
        if system_prompt:
            params['system'] = system_prompt
        
        # Add messages or prompt
        if isinstance(input_data, list) and all(isinstance(m, dict) for m in input_data):
            params['messages'] = input_data
        else:
            params['prompt'] = prompt
        
        try:
            response = self.anthropic_client.completions.create(**params)
            return response.completion
        except Exception as e:
            self.logger.error(f"Anthropic inference error: {str(e)}")
            raise
    
    def _infer_huggingface(self, model_info: Dict[str, Any], 
                          input_data: Union[str, Dict[str, Any], List[Dict[str, Any]]],
                          options: Dict[str, Any]) -> Any:
        """
        Perform inference with a Hugging Face model.
        
        Args:
            model_info: Loaded model information
            input_data: Input data for inference
            options: Inference options
            
        Returns:
            Inference result
        """
        # Check if using API or local model
        if model_info.get('use_api', False):
            # Using Hugging Face Inference API
            try:
                from huggingface_hub.inference_api import InferenceApi
                
                model_name = model_info['model_name']
                inference = InferenceApi(repo_id=model_name, token=os.environ.get("HUGGINGFACE_TOKEN"))
                
                # Determine the task type based on model info or options
                task = options.get('task', model_info['config'].get('task', 'text-generation'))
                
                # Perform inference based on task
                if task == 'text-generation':
                    return inference(input_data, options)
                elif task == 'question-answering':
                    return inference(
                        {
                            'question': input_data['question'],
                            'context': input_data['context']
                        }, 
                        options
                    )
                else:
                    return inference(input_data, options)
            except Exception as e:
                self.logger.error(f"Hugging Face API inference error: {str(e)}")
                raise
        else:
            # Using local model
            if 'model' not in model_info or 'tokenizer' not in model_info:
                raise RuntimeError("Model or tokenizer not found in model info")
            
            model = model_info['model']
            tokenizer = model_info['tokenizer']
            
            # Prepare input based on task
            task = options.get('task', model_info['config'].get('task', 'text-generation'))
            
            try:
                if task == 'text-generation':
                    inputs = tokenizer(input_data, return_tensors="pt")
                    outputs = model.generate(
                        inputs['input_ids'],
                        max_length=options.get('max_length', 100),
                        num_return_sequences=options.get('num_return_sequences', 1),
                        temperature=options.get('temperature', 1.0)
                    )
                    return tokenizer.decode(outputs[0], skip_special_tokens=True)
                elif task == 'question-answering':
                    inputs = tokenizer(input_data['question'], input_data['context'], return_tensors="pt")
                    outputs = model(**inputs)
                    start_idx = outputs.start_logits.argmax()
                    end_idx = outputs.end_logits.argmax() + 1
                    answer = tokenizer.decode(inputs['input_ids'][0][start_idx:end_idx])
                    return {'answer': answer}
                else:
                    inputs = tokenizer(input_data, return_tensors="pt")
                    outputs = model(**inputs)
                    return outputs
            except Exception as e:
                self.logger.error(f"Hugging Face local inference error: {str(e)}")
                raise
    
    def _infer_custom(self, model_info: Dict[str, Any], 
                     input_data: Union[str, Dict[str, Any], List[Dict[str, Any]]],
                     options: Dict[str, Any]) -> Any:
        """
        Perform inference with a custom model.
        
        Args:
            model_info: Loaded model information
            input_data: Input data for inference
            options: Inference options
            
        Returns:
            Inference result
        """
        if 'model' not in model_info:
            raise RuntimeError("Model object not found in model info")
        
        model = model_info['model']
        
        # Determine the inference method to call
        method_name = options.get('method', 'predict')
        
        if not hasattr(model, method_name):
            raise ValueError(f"Model does not have method '{method_name}'")
        
        # Call the inference method
        method = getattr(model, method_name)
        
        try:
            return method(input_data, **options)
        except Exception as e:
            self.logger.error(f"Custom model inference error: {str(e)}")
            raise
    
    def unload_model(self, model_id: str, version_id: Optional[str] = None) -> bool:
        """
        Unload a model from memory.
        
        Args:
            model_id: ID of the model to unload
            version_id: Optional specific version ID to unload
            
        Returns:
            Success flag
        """
        cache_key = f"{model_id}:{version_id}" if version_id else f"{model_id}:latest"
        
        if cache_key in self.loaded_models:
            # Remove from cache
            del self.loaded_models[cache_key]
            self.logger.info(f"Unloaded model {cache_key}")
            return True
        
        return False
    
    def refresh_models(self) -> None:
        """Refresh all loaded models."""
        # In a real implementation, this would reload models that need updating
        # For this example, we'll just log a message
        self.logger.info("Refreshing loaded models")
        
        # Get the list of loaded models
        loaded_models = list(self.loaded_models.keys())
        
        # Reload each model
        for cache_key in loaded_models:
            parts = cache_key.split(':')
            if len(parts) == 2:
                model_id, version_id = parts
                if version_id == 'latest':
                    version_id = None
                
                try:
                    # Unload the model
                    self.unload_model(model_id, version_id)
                    
                    # Load the model again
                    self.load_model(model_id, version_id)
                    
                    self.logger.info(f"Refreshed model {cache_key}")
                except Exception as e:
                    self.logger.error(f"Failed to refresh model {cache_key}: {str(e)}")
    
    def clear_cache(self) -> None:
        """Clear the model cache."""
        self.loaded_models.clear()
        self.logger.info("Cleared model cache")