"""
Neuro-Symbolic Reasoning Engine

This module implements a hybrid reasoning engine that combines neural networks with
symbolic reasoning to provide explainable AI with robust logical reasoning capabilities.
"""
import os
import json
import logging
import time
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple, Set, Callable
from enum import Enum
import re

class ReasoningMode(Enum):
    """Reasoning modes supported by the engine."""
    NEURAL = "neural"
    SYMBOLIC = "symbolic"
    HYBRID = "hybrid"


class SymbolicRule:
    """
    Represents a symbolic rule in the reasoning system.
    
    A rule has the form:
    IF <conditions> THEN <conclusions>
    
    where conditions and conclusions are logical expressions.
    """
    
    def __init__(self, rule_id: str, name: str, conditions: str, conclusions: str,
               confidence: float = 1.0, context: Optional[str] = None):
        """
        Initialize a symbolic rule.
        
        Args:
            rule_id: Unique identifier for the rule
            name: Human-readable name
            conditions: Conditions part of the rule (IF part)
            conclusions: Conclusions part of the rule (THEN part)
            confidence: Confidence score (0.0 to 1.0)
            context: Optional context where the rule applies
        """
        self.id = rule_id
        self.name = name
        self.conditions = conditions
        self.conclusions = conclusions
        self.confidence = confidence
        self.context = context
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert rule to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'conditions': self.conditions,
            'conclusions': self.conclusions,
            'confidence': self.confidence,
            'context': self.context
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SymbolicRule':
        """
        Create a rule from a dictionary.
        
        Args:
            data: Rule data dictionary
        
        Returns:
            SymbolicRule instance
        """
        return cls(
            rule_id=data['id'],
            name=data['name'],
            conditions=data['conditions'],
            conclusions=data['conclusions'],
            confidence=data.get('confidence', 1.0),
            context=data.get('context')
        )
    
    def __str__(self) -> str:
        """Get string representation of the rule."""
        return f"IF {self.conditions} THEN {self.conclusions}"


class KnowledgeBase:
    """
    Knowledge base containing symbolic facts and rules.
    """
    
    def __init__(self, name: str, domain: Optional[str] = None):
        """
        Initialize a knowledge base.
        
        Args:
            name: Name of the knowledge base
            domain: Optional domain of the knowledge base
        """
        self.name = name
        self.domain = domain
        self.facts = set()  # Set of fact strings
        self.rules = {}  # rule_id -> SymbolicRule
    
    def add_fact(self, fact: str) -> None:
        """
        Add a fact to the knowledge base.
        
        Args:
            fact: Fact to add
        """
        self.facts.add(fact.strip())
    
    def remove_fact(self, fact: str) -> bool:
        """
        Remove a fact from the knowledge base.
        
        Args:
            fact: Fact to remove
            
        Returns:
            Removal success
        """
        if fact in self.facts:
            self.facts.remove(fact)
            return True
        return False
    
    def add_rule(self, rule: SymbolicRule) -> None:
        """
        Add a rule to the knowledge base.
        
        Args:
            rule: Rule to add
        """
        self.rules[rule.id] = rule
    
    def remove_rule(self, rule_id: str) -> bool:
        """
        Remove a rule from the knowledge base.
        
        Args:
            rule_id: ID of the rule to remove
            
        Returns:
            Removal success
        """
        if rule_id in self.rules:
            del self.rules[rule_id]
            return True
        return False
    
    def get_matching_rules(self, context: Optional[str] = None) -> List[SymbolicRule]:
        """
        Get rules matching a context.
        
        Args:
            context: Context to match
            
        Returns:
            List of matching rules
        """
        if context is None:
            return list(self.rules.values())
        
        return [rule for rule in self.rules.values() if rule.context is None or rule.context == context]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert knowledge base to a dictionary."""
        return {
            'name': self.name,
            'domain': self.domain,
            'facts': list(self.facts),
            'rules': [rule.to_dict() for rule in self.rules.values()]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KnowledgeBase':
        """
        Create a knowledge base from a dictionary.
        
        Args:
            data: Knowledge base data dictionary
        
        Returns:
            KnowledgeBase instance
        """
        kb = cls(name=data['name'], domain=data.get('domain'))
        
        for fact in data.get('facts', []):
            kb.add_fact(fact)
        
        for rule_data in data.get('rules', []):
            kb.add_rule(SymbolicRule.from_dict(rule_data))
        
        return kb


class InferenceResult:
    """
    Result of an inference operation.
    """
    
    def __init__(self, inferred_facts: List[str], 
               rule_activations: List[Dict[str, Any]],
               confidence: float):
        """
        Initialize an inference result.
        
        Args:
            inferred_facts: List of inferred facts
            rule_activations: List of rule activations
            confidence: Overall confidence score
        """
        self.inferred_facts = inferred_facts
        self.rule_activations = rule_activations
        self.confidence = confidence
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert inference result to a dictionary."""
        return {
            'inferred_facts': self.inferred_facts,
            'rule_activations': self.rule_activations,
            'confidence': self.confidence
        }


class NeuralNetworkInfo:
    """
    Information about a neural network used in the reasoning system.
    """
    
    def __init__(self, network_id: str, name: str, task: str,
               model_registry_id: Optional[str] = None,
               embedding_dimension: Optional[int] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize neural network information.
        
        Args:
            network_id: Unique identifier for the network
            name: Human-readable name
            task: Task the network is designed for
            model_registry_id: Optional ID in the model registry
            embedding_dimension: Optional dimension of the embeddings
            metadata: Optional network metadata
        """
        self.id = network_id
        self.name = name
        self.task = task
        self.model_registry_id = model_registry_id
        self.embedding_dimension = embedding_dimension
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert neural network info to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'task': self.task,
            'model_registry_id': self.model_registry_id,
            'embedding_dimension': self.embedding_dimension,
            'metadata': self.metadata
        }


class NeuroSymbolicEngine:
    """
    Neuro-symbolic reasoning engine.
    
    This class provides:
    - Hybrid reasoning combining neural networks and symbolic logic
    - Forward and backward chaining inference
    - Knowledge base management
    - Explanation generation
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the reasoning engine.
        
        Args:
            storage_dir: Optional directory for persistent storage
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'neuro_symbolic_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('neuro_symbolic_engine')
        
        # Initialize knowledge bases
        self.knowledge_bases = {}  # name -> KnowledgeBase
        
        # Initialize neural networks
        self.neural_networks = {}  # network_id -> NeuralNetworkInfo
        
        # Initialize neural network proxies (for actual model access)
        self.network_proxies = {}  # network_id -> callable
        
        # Default embeddings cache
        self.embeddings_cache = {}  # term -> numpy array
        
        # Load existing data
        self._load_data()
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load knowledge bases
        kb_dir = os.path.join(self.storage_dir, 'knowledge_bases')
        if os.path.exists(kb_dir):
            for filename in os.listdir(kb_dir):
                if filename.endswith('.json'):
                    kb_path = os.path.join(kb_dir, filename)
                    try:
                        with open(kb_path, 'r') as f:
                            kb_data = json.load(f)
                        
                        kb = KnowledgeBase.from_dict(kb_data)
                        self.knowledge_bases[kb.name] = kb
                        
                        self.logger.info(f"Loaded knowledge base: {kb.name}")
                    except Exception as e:
                        self.logger.error(f"Error loading knowledge base from {kb_path}: {e}")
        
        # Load neural network info
        nn_dir = os.path.join(self.storage_dir, 'neural_networks')
        if os.path.exists(nn_dir):
            for filename in os.listdir(nn_dir):
                if filename.endswith('.json'):
                    nn_path = os.path.join(nn_dir, filename)
                    try:
                        with open(nn_path, 'r') as f:
                            nn_data = json.load(f)
                        
                        network_id = nn_data['id']
                        nn_info = NeuralNetworkInfo(
                            network_id=network_id,
                            name=nn_data['name'],
                            task=nn_data['task'],
                            model_registry_id=nn_data.get('model_registry_id'),
                            embedding_dimension=nn_data.get('embedding_dimension'),
                            metadata=nn_data.get('metadata', {})
                        )
                        
                        self.neural_networks[network_id] = nn_info
                        
                        self.logger.info(f"Loaded neural network info: {nn_info.name}")
                    except Exception as e:
                        self.logger.error(f"Error loading neural network info from {nn_path}: {e}")
    
    def _save_knowledge_base(self, kb: KnowledgeBase) -> None:
        """
        Save a knowledge base to storage.
        
        Args:
            kb: Knowledge base to save
        """
        kb_dir = os.path.join(self.storage_dir, 'knowledge_bases')
        os.makedirs(kb_dir, exist_ok=True)
        
        kb_path = os.path.join(kb_dir, f"{kb.name}.json")
        
        with open(kb_path, 'w') as f:
            json.dump(kb.to_dict(), f, indent=2)
    
    def _save_neural_network_info(self, nn_info: NeuralNetworkInfo) -> None:
        """
        Save neural network info to storage.
        
        Args:
            nn_info: Neural network info to save
        """
        nn_dir = os.path.join(self.storage_dir, 'neural_networks')
        os.makedirs(nn_dir, exist_ok=True)
        
        nn_path = os.path.join(nn_dir, f"{nn_info.id}.json")
        
        with open(nn_path, 'w') as f:
            json.dump(nn_info.to_dict(), f, indent=2)
    
    def create_knowledge_base(self, name: str, domain: Optional[str] = None) -> KnowledgeBase:
        """
        Create a new knowledge base.
        
        Args:
            name: Name of the knowledge base
            domain: Optional domain of the knowledge base
            
        Returns:
            Created knowledge base
        """
        kb = KnowledgeBase(name=name, domain=domain)
        self.knowledge_bases[name] = kb
        
        # Save to storage
        self._save_knowledge_base(kb)
        
        self.logger.info(f"Created knowledge base: {name}")
        return kb
    
    def get_knowledge_base(self, name: str) -> Optional[KnowledgeBase]:
        """
        Get a knowledge base by name.
        
        Args:
            name: Name of the knowledge base
            
        Returns:
            Knowledge base or None if not found
        """
        return self.knowledge_bases.get(name)
    
    def list_knowledge_bases(self) -> List[Dict[str, Any]]:
        """
        List all knowledge bases.
        
        Returns:
            List of knowledge base info dictionaries
        """
        return [
            {
                'name': kb.name,
                'domain': kb.domain,
                'fact_count': len(kb.facts),
                'rule_count': len(kb.rules)
            }
            for kb in self.knowledge_bases.values()
        ]
    
    def delete_knowledge_base(self, name: str) -> bool:
        """
        Delete a knowledge base.
        
        Args:
            name: Name of the knowledge base
            
        Returns:
            Deletion success
        """
        if name not in self.knowledge_bases:
            return False
        
        # Remove from memory
        del self.knowledge_bases[name]
        
        # Remove from storage
        kb_path = os.path.join(self.storage_dir, 'knowledge_bases', f"{name}.json")
        if os.path.exists(kb_path):
            os.remove(kb_path)
        
        self.logger.info(f"Deleted knowledge base: {name}")
        return True
    
    def register_neural_network(self, name: str, task: str,
                              model_registry_id: Optional[str] = None,
                              embedding_dimension: Optional[int] = None,
                              metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Register a neural network.
        
        Args:
            name: Human-readable name
            task: Task the network is designed for
            model_registry_id: Optional ID in the model registry
            embedding_dimension: Optional dimension of the embeddings
            metadata: Optional network metadata
            
        Returns:
            Network ID
        """
        # Generate network ID
        network_id = str(uuid.uuid4())
        
        # Create neural network info
        nn_info = NeuralNetworkInfo(
            network_id=network_id,
            name=name,
            task=task,
            model_registry_id=model_registry_id,
            embedding_dimension=embedding_dimension,
            metadata=metadata
        )
        
        # Store neural network info
        self.neural_networks[network_id] = nn_info
        
        # Save to storage
        self._save_neural_network_info(nn_info)
        
        self.logger.info(f"Registered neural network: {name} (ID: {network_id})")
        return network_id
    
    def set_network_proxy(self, network_id: str, proxy_function: Callable) -> bool:
        """
        Set the proxy function for a neural network.
        
        This function will be called to access the actual neural network model.
        
        Args:
            network_id: ID of the neural network
            proxy_function: Function to call to access the model
            
        Returns:
            Success
        """
        if network_id not in self.neural_networks:
            return False
        
        self.network_proxies[network_id] = proxy_function
        return True
    
    def get_network_proxy(self, network_id: str) -> Optional[Callable]:
        """
        Get the proxy function for a neural network.
        
        Args:
            network_id: ID of the neural network
            
        Returns:
            Proxy function or None if not found
        """
        return self.network_proxies.get(network_id)
    
    def list_neural_networks(self) -> List[Dict[str, Any]]:
        """
        List all registered neural networks.
        
        Returns:
            List of neural network info dictionaries
        """
        return [nn_info.to_dict() for nn_info in self.neural_networks.values()]
    
    def delete_neural_network(self, network_id: str) -> bool:
        """
        Delete a neural network.
        
        Args:
            network_id: ID of the neural network
            
        Returns:
            Deletion success
        """
        if network_id not in self.neural_networks:
            return False
        
        # Remove from memory
        del self.neural_networks[network_id]
        
        if network_id in self.network_proxies:
            del self.network_proxies[network_id]
        
        # Remove from storage
        nn_path = os.path.join(self.storage_dir, 'neural_networks', f"{network_id}.json")
        if os.path.exists(nn_path):
            os.remove(nn_path)
        
        self.logger.info(f"Deleted neural network: {network_id}")
        return True
    
    def forward_chaining(self, kb_name: str, facts: List[str],
                       context: Optional[str] = None,
                       max_iterations: int = 10) -> InferenceResult:
        """
        Perform forward chaining inference.
        
        Args:
            kb_name: Name of the knowledge base
            facts: Initial facts
            context: Optional context for rule selection
            max_iterations: Maximum number of inference iterations
            
        Returns:
            Inference result
        """
        kb = self.get_knowledge_base(kb_name)
        if not kb:
            return InferenceResult([], [], 0.0)
        
        # Merge initial facts with knowledge base facts
        all_facts = set(facts) | kb.facts
        inferred_facts = set()
        rule_activations = []
        
        # Get rules for the context
        rules = kb.get_matching_rules(context)
        
        # Forward chaining
        iterations = 0
        while iterations < max_iterations:
            new_facts = set()
            activated_rules = []
            
            for rule in rules:
                # Check if rule conditions are satisfied
                if self._check_conditions(rule.conditions, all_facts):
                    # Apply rule to infer new facts
                    conclusions = self._parse_conclusions(rule.conclusions)
                    
                    # Add only new facts
                    new_conclusions = set(conclusions) - all_facts
                    
                    if new_conclusions:
                        new_facts |= new_conclusions
                        
                        # Record rule activation
                        activated_rules.append({
                            'rule_id': rule.id,
                            'name': rule.name,
                            'confidence': rule.confidence,
                            'inferred': list(new_conclusions)
                        })
            
            # Stop if no new facts were inferred
            if not new_facts:
                break
            
            # Add new facts to all facts
            all_facts |= new_facts
            inferred_facts |= new_facts
            rule_activations.extend(activated_rules)
            
            iterations += 1
        
        # Calculate overall confidence
        if not rule_activations:
            confidence = 1.0
        else:
            confidence = sum(a['confidence'] for a in rule_activations) / len(rule_activations)
        
        return InferenceResult(
            inferred_facts=list(inferred_facts),
            rule_activations=rule_activations,
            confidence=confidence
        )
    
    def backward_chaining(self, kb_name: str, query: str,
                        facts: List[str],
                        context: Optional[str] = None,
                        max_depth: int = 10) -> InferenceResult:
        """
        Perform backward chaining inference.
        
        Args:
            kb_name: Name of the knowledge base
            query: Query to prove
            facts: Initial facts
            context: Optional context for rule selection
            max_depth: Maximum recursion depth
            
        Returns:
            Inference result
        """
        kb = self.get_knowledge_base(kb_name)
        if not kb:
            return InferenceResult([], [], 0.0)
        
        # Merge initial facts with knowledge base facts
        all_facts = set(facts) | kb.facts
        
        # Get rules for the context
        rules = kb.get_matching_rules(context)
        
        # Initialize inference result
        inferred_facts = set()
        rule_activations = []
        
        # Recursive helper function
        def prove(subgoal: str, depth: int) -> bool:
            # Base case: maximum depth reached
            if depth >= max_depth:
                return False
            
            # Base case: subgoal is already in facts
            if subgoal in all_facts:
                return True
            
            # Find rules that can infer the subgoal
            for rule in rules:
                # Check if rule can infer the subgoal
                conclusions = self._parse_conclusions(rule.conclusions)
                
                if subgoal in conclusions:
                    # Get conditions that need to be satisfied
                    conditions = self._parse_conditions(rule.conditions)
                    
                    # Try to prove all conditions
                    all_conditions_met = True
                    for condition in conditions:
                        if not prove(condition, depth + 1):
                            all_conditions_met = False
                            break
                    
                    # If all conditions are met, the subgoal is proved
                    if all_conditions_met:
                        # Record rule activation
                        rule_activations.append({
                            'rule_id': rule.id,
                            'name': rule.name,
                            'confidence': rule.confidence,
                            'inferred': [subgoal]
                        })
                        
                        # Add to inferred facts
                        inferred_facts.add(subgoal)
                        all_facts.add(subgoal)
                        
                        return True
            
            return False
        
        # Prove the query
        result = prove(query, 0)
        
        # Calculate overall confidence
        if not rule_activations:
            confidence = 0.0 if not result else 1.0
        else:
            confidence = sum(a['confidence'] for a in rule_activations) / len(rule_activations)
        
        return InferenceResult(
            inferred_facts=list(inferred_facts),
            rule_activations=rule_activations,
            confidence=confidence
        )
    
    def hybrid_inference(self, kb_name: str, facts: List[str],
                       queries: Optional[List[str]] = None,
                       context: Optional[str] = None,
                       network_id: Optional[str] = None,
                       confidence_threshold: float = 0.5) -> InferenceResult:
        """
        Perform hybrid neural-symbolic inference.
        
        Args:
            kb_name: Name of the knowledge base
            facts: Initial facts
            queries: Optional specific queries to prove
            context: Optional context for rule selection
            network_id: Optional neural network to use
            confidence_threshold: Threshold for neural predictions
            
        Returns:
            Inference result
        """
        # Perform symbolic inference first
        if queries:
            # Use backward chaining for specific queries
            results = []
            for query in queries:
                result = self.backward_chaining(kb_name, query, facts, context)
                results.append(result)
            
            # Combine results
            combined_inferred = []
            combined_activations = []
            combined_confidence = 0.0
            
            for result in results:
                combined_inferred.extend(result.inferred_facts)
                combined_activations.extend(result.rule_activations)
                combined_confidence += result.confidence
            
            if results:
                combined_confidence /= len(results)
            
            symbolic_result = InferenceResult(
                inferred_facts=combined_inferred,
                rule_activations=combined_activations,
                confidence=combined_confidence
            )
        else:
            # Use forward chaining for general inference
            symbolic_result = self.forward_chaining(kb_name, facts, context)
        
        # If no neural network specified, return symbolic result
        if not network_id or network_id not in self.neural_networks:
            return symbolic_result
        
        # Get neural network proxy
        proxy = self.get_network_proxy(network_id)
        if not proxy:
            return symbolic_result
        
        # Combine all facts for neural processing
        all_facts = facts + symbolic_result.inferred_facts
        
        try:
            # Use neural network to predict additional facts
            neural_predictions = proxy(all_facts)
            
            # Filter predictions by confidence threshold
            neural_inferred = []
            neural_activations = []
            
            for prediction in neural_predictions:
                if prediction['confidence'] >= confidence_threshold:
                    neural_inferred.append(prediction['fact'])
                    neural_activations.append({
                        'neural': True,
                        'fact': prediction['fact'],
                        'confidence': prediction['confidence']
                    })
            
            # Combine symbolic and neural results
            combined_inferred = symbolic_result.inferred_facts + neural_inferred
            combined_activations = symbolic_result.rule_activations + neural_activations
            
            # Calculate combined confidence
            if not combined_activations:
                combined_confidence = 0.0
            else:
                combined_confidence = sum(a.get('confidence', 0.5) for a in combined_activations) / len(combined_activations)
            
            return InferenceResult(
                inferred_facts=combined_inferred,
                rule_activations=combined_activations,
                confidence=combined_confidence
            )
        
        except Exception as e:
            self.logger.error(f"Error in neural inference: {e}")
            return symbolic_result
    
    def _check_conditions(self, conditions_expr: str, facts: Set[str]) -> bool:
        """
        Check if conditions are satisfied by facts.
        
        Args:
            conditions_expr: Conditions expression
            facts: Set of facts
            
        Returns:
            True if conditions are satisfied
        """
        # Parse conditions
        conditions = self._parse_conditions(conditions_expr)
        
        # Check each condition
        for condition in conditions:
            if condition.startswith('NOT '):
                # Negation
                if condition[4:] in facts:
                    return False
            else:
                # Positive condition
                if condition not in facts:
                    return False
        
        return True
    
    def _parse_conditions(self, conditions_expr: str) -> List[str]:
        """
        Parse a conditions expression into individual conditions.
        
        Args:
            conditions_expr: Conditions expression
            
        Returns:
            List of individual conditions
        """
        # Split by AND
        conditions = conditions_expr.split(' AND ')
        
        # Strip whitespace
        conditions = [c.strip() for c in conditions]
        
        return conditions
    
    def _parse_conclusions(self, conclusions_expr: str) -> List[str]:
        """
        Parse a conclusions expression into individual conclusions.
        
        Args:
            conclusions_expr: Conclusions expression
            
        Returns:
            List of individual conclusions
        """
        # Split by comma or AND
        conclusions = re.split(r',|\sAND\s', conclusions_expr)
        
        # Strip whitespace
        conclusions = [c.strip() for c in conclusions]
        
        return conclusions
    
    def generate_explanation(self, inference_result: InferenceResult) -> str:
        """
        Generate a human-readable explanation of an inference result.
        
        Args:
            inference_result: Inference result to explain
            
        Returns:
            Explanation string
        """
        if not inference_result.rule_activations:
            return "No rules were activated during inference."
        
        explanation = []
        explanation.append("Inference process:")
        
        # Organize rule activations by inferred facts
        fact_explanations = {}
        
        for activation in inference_result.rule_activations:
            if 'neural' in activation and activation['neural']:
                # Neural inference
                fact = activation['fact']
                if fact not in fact_explanations:
                    fact_explanations[fact] = []
                
                fact_explanations[fact].append(
                    f"Neural prediction with confidence {activation['confidence']:.2f}"
                )
            else:
                # Symbolic inference
                for fact in activation.get('inferred', []):
                    if fact not in fact_explanations:
                        fact_explanations[fact] = []
                    
                    fact_explanations[fact].append(
                        f"Applied rule '{activation['name']}' with confidence {activation['confidence']:.2f}"
                    )
        
        # Generate explanation for each inferred fact
        for i, fact in enumerate(inference_result.inferred_facts):
            explanation.append(f"\n{i+1}. Inferred: {fact}")
            
            if fact in fact_explanations:
                for exp in fact_explanations[fact]:
                    explanation.append(f"   - {exp}")
            else:
                explanation.append("   - No explanation available")
        
        # Add overall confidence
        explanation.append(f"\nOverall confidence: {inference_result.confidence:.2f}")
        
        return "\n".join(explanation)
    
    def store_embedding(self, term: str, embedding: np.ndarray) -> None:
        """
        Store an embedding for a term.
        
        Args:
            term: Term to store embedding for
            embedding: Embedding vector
        """
        self.embeddings_cache[term] = embedding
    
    def get_embedding(self, term: str) -> Optional[np.ndarray]:
        """
        Get embedding for a term.
        
        Args:
            term: Term to get embedding for
            
        Returns:
            Embedding vector or None if not found
        """
        return self.embeddings_cache.get(term)
    
    def compute_similarity(self, term1: str, term2: str) -> Optional[float]:
        """
        Compute similarity between two terms using embeddings.
        
        Args:
            term1: First term
            term2: Second term
            
        Returns:
            Similarity score or None if embeddings not available
        """
        embedding1 = self.get_embedding(term1)
        embedding2 = self.get_embedding(term2)
        
        if embedding1 is None or embedding2 is None:
            return None
        
        # Compute cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def clear_embeddings_cache(self) -> None:
        """Clear the embeddings cache."""
        self.embeddings_cache = {}
    
    def export_knowledge_base(self, kb_name: str, file_path: str) -> bool:
        """
        Export a knowledge base to a file.
        
        Args:
            kb_name: Name of the knowledge base
            file_path: Path to export to
            
        Returns:
            Export success
        """
        kb = self.get_knowledge_base(kb_name)
        if not kb:
            return False
        
        try:
            with open(file_path, 'w') as f:
                json.dump(kb.to_dict(), f, indent=2)
            
            return True
        except Exception as e:
            self.logger.error(f"Error exporting knowledge base: {e}")
            return False
    
    def import_knowledge_base(self, file_path: str, overwrite: bool = False) -> Optional[str]:
        """
        Import a knowledge base from a file.
        
        Args:
            file_path: Path to import from
            overwrite: Whether to overwrite existing knowledge base
            
        Returns:
            Name of imported knowledge base or None on failure
        """
        try:
            with open(file_path, 'r') as f:
                kb_data = json.load(f)
            
            kb = KnowledgeBase.from_dict(kb_data)
            
            if kb.name in self.knowledge_bases and not overwrite:
                return None
            
            self.knowledge_bases[kb.name] = kb
            
            # Save to storage
            self._save_knowledge_base(kb)
            
            self.logger.info(f"Imported knowledge base: {kb.name}")
            return kb.name
        
        except Exception as e:
            self.logger.error(f"Error importing knowledge base: {e}")
            return None