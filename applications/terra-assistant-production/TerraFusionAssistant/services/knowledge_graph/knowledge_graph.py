"""
Knowledge Graph

This module implements a knowledge graph for code repositories, enabling cross-repository
learning, pattern detection, and knowledge transfer.
"""
import os
import json
import logging
import time
import uuid
import re
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Tuple, Set

class NodeType(Enum):
    """Types of nodes in the knowledge graph."""
    REPOSITORY = "repository"
    FILE = "file"
    CLASS = "class"
    FUNCTION = "function"
    METHOD = "method"
    VARIABLE = "variable"
    PATTERN = "pattern"
    DATABASE_MODEL = "database_model"
    DATABASE_TABLE = "database_table"
    DATABASE_COLUMN = "database_column"
    API_ENDPOINT = "api_endpoint"
    WORKFLOW = "workflow"
    CONCEPT = "concept"
    DOCUMENTATION = "documentation"


class EdgeType(Enum):
    """Types of edges in the knowledge graph."""
    CONTAINS = "contains"
    IMPORTS = "imports"
    CALLS = "calls"
    INHERITS = "inherits"
    IMPLEMENTS = "implements"
    DEPENDS_ON = "depends_on"
    RELATES_TO = "relates_to"
    DEFINES = "defines"
    USES = "uses"
    SIMILAR_TO = "similar_to"
    REFERENCED_BY = "referenced_by"
    EQUIVALENT_TO = "equivalent_to"
    EVOLVES_TO = "evolves_to"


class GraphNode:
    """
    Represents a node in the knowledge graph.
    """
    
    def __init__(self, node_id: str, node_type: NodeType, name: str,
               repository_id: Optional[str] = None,
               properties: Optional[Dict[str, Any]] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a graph node.
        
        Args:
            node_id: Unique identifier for the node
            node_type: Type of node
            name: Name of the node
            repository_id: Optional ID of the containing repository
            properties: Optional node properties
            metadata: Optional node metadata
        """
        self.id = node_id
        self.node_type = node_type
        self.name = name
        self.repository_id = repository_id
        self.properties = properties or {}
        self.metadata = metadata or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert node to a dictionary."""
        return {
            'id': self.id,
            'node_type': self.node_type.value,
            'name': self.name,
            'repository_id': self.repository_id,
            'properties': self.properties,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GraphNode':
        """
        Create a node from a dictionary.
        
        Args:
            data: Node data dictionary
        
        Returns:
            GraphNode instance
        """
        node = cls(
            node_id=data['id'],
            node_type=NodeType(data['node_type']),
            name=data['name'],
            repository_id=data.get('repository_id'),
            properties=data.get('properties', {}),
            metadata=data.get('metadata', {})
        )
        
        node.created_at = data.get('created_at', time.time())
        node.updated_at = data.get('updated_at', time.time())
        
        return node


class GraphEdge:
    """
    Represents an edge in the knowledge graph.
    """
    
    def __init__(self, edge_id: str, edge_type: EdgeType,
               source_id: str, target_id: str,
               properties: Optional[Dict[str, Any]] = None,
               weight: float = 1.0,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a graph edge.
        
        Args:
            edge_id: Unique identifier for the edge
            edge_type: Type of edge
            source_id: ID of the source node
            target_id: ID of the target node
            properties: Optional edge properties
            weight: Edge weight
            metadata: Optional edge metadata
        """
        self.id = edge_id
        self.edge_type = edge_type
        self.source_id = source_id
        self.target_id = target_id
        self.properties = properties or {}
        self.weight = weight
        self.metadata = metadata or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert edge to a dictionary."""
        return {
            'id': self.id,
            'edge_type': self.edge_type.value,
            'source_id': self.source_id,
            'target_id': self.target_id,
            'properties': self.properties,
            'weight': self.weight,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GraphEdge':
        """
        Create an edge from a dictionary.
        
        Args:
            data: Edge data dictionary
        
        Returns:
            GraphEdge instance
        """
        edge = cls(
            edge_id=data['id'],
            edge_type=EdgeType(data['edge_type']),
            source_id=data['source_id'],
            target_id=data['target_id'],
            properties=data.get('properties', {}),
            weight=data.get('weight', 1.0),
            metadata=data.get('metadata', {})
        )
        
        edge.created_at = data.get('created_at', time.time())
        edge.updated_at = data.get('updated_at', time.time())
        
        return edge


class QueryResult:
    """
    Result of a knowledge graph query.
    """
    
    def __init__(self, nodes: List[GraphNode], edges: List[GraphEdge]):
        """
        Initialize a query result.
        
        Args:
            nodes: List of nodes
            edges: List of edges
        """
        self.nodes = nodes
        self.edges = edges
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert query result to a dictionary."""
        return {
            'nodes': [node.to_dict() for node in self.nodes],
            'edges': [edge.to_dict() for edge in self.edges]
        }


class KnowledgeGraph:
    """
    Knowledge graph for code repositories.
    
    This class provides:
    - Graph construction and management
    - Cross-repository pattern detection
    - Knowledge transfer
    - Graph querying and traversal
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the knowledge graph.
        
        Args:
            storage_dir: Optional directory for persistent storage
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'knowledge_graph_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Set up nodes directory
        self.nodes_dir = os.path.join(storage_dir, 'nodes')
        os.makedirs(self.nodes_dir, exist_ok=True)
        
        # Set up edges directory
        self.edges_dir = os.path.join(storage_dir, 'edges')
        os.makedirs(self.edges_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('knowledge_graph')
        
        # Initialize nodes and edges
        self.nodes = {}  # node_id -> GraphNode
        self.edges = {}  # edge_id -> GraphEdge
        
        # Initialize indices
        self.node_type_index = {}  # node_type -> Set[node_id]
        self.repository_index = {}  # repository_id -> Set[node_id]
        self.edge_type_index = {}  # edge_type -> Set[edge_id]
        self.node_connections = {}  # node_id -> {'in': Set[edge_id], 'out': Set[edge_id]}
        
        # Load existing data
        self._load_data()
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load nodes
        if os.path.exists(self.nodes_dir):
            for filename in os.listdir(self.nodes_dir):
                if filename.endswith('.json'):
                    node_id = filename[:-5]  # Remove '.json'
                    node_path = os.path.join(self.nodes_dir, filename)
                    
                    try:
                        with open(node_path, 'r') as f:
                            node_data = json.load(f)
                        
                        node = GraphNode.from_dict(node_data)
                        self.nodes[node_id] = node
                        
                        # Update indices
                        node_type = node.node_type
                        if node_type not in self.node_type_index:
                            self.node_type_index[node_type] = set()
                        
                        self.node_type_index[node_type].add(node_id)
                        
                        if node.repository_id:
                            if node.repository_id not in self.repository_index:
                                self.repository_index[node.repository_id] = set()
                            
                            self.repository_index[node.repository_id].add(node_id)
                        
                        # Initialize node connections
                        self.node_connections[node_id] = {'in': set(), 'out': set()}
                        
                        self.logger.info(f"Loaded node: {node.name} (ID: {node_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading node from {node_path}: {e}")
        
        # Load edges
        if os.path.exists(self.edges_dir):
            for filename in os.listdir(self.edges_dir):
                if filename.endswith('.json'):
                    edge_id = filename[:-5]  # Remove '.json'
                    edge_path = os.path.join(self.edges_dir, filename)
                    
                    try:
                        with open(edge_path, 'r') as f:
                            edge_data = json.load(f)
                        
                        edge = GraphEdge.from_dict(edge_data)
                        self.edges[edge_id] = edge
                        
                        # Update indices
                        edge_type = edge.edge_type
                        if edge_type not in self.edge_type_index:
                            self.edge_type_index[edge_type] = set()
                        
                        self.edge_type_index[edge_type].add(edge_id)
                        
                        # Update node connections
                        source_id = edge.source_id
                        target_id = edge.target_id
                        
                        if source_id in self.node_connections:
                            self.node_connections[source_id]['out'].add(edge_id)
                        else:
                            self.node_connections[source_id] = {'in': set(), 'out': {edge_id}}
                        
                        if target_id in self.node_connections:
                            self.node_connections[target_id]['in'].add(edge_id)
                        else:
                            self.node_connections[target_id] = {'in': {edge_id}, 'out': set()}
                        
                        self.logger.info(f"Loaded edge: {edge.edge_type.value} (ID: {edge_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading edge from {edge_path}: {e}")
    
    def _save_node(self, node: GraphNode) -> None:
        """
        Save a node to storage.
        
        Args:
            node: Node to save
        """
        node_path = os.path.join(self.nodes_dir, f"{node.id}.json")
        
        with open(node_path, 'w') as f:
            json.dump(node.to_dict(), f, indent=2)
    
    def _save_edge(self, edge: GraphEdge) -> None:
        """
        Save an edge to storage.
        
        Args:
            edge: Edge to save
        """
        edge_path = os.path.join(self.edges_dir, f"{edge.id}.json")
        
        with open(edge_path, 'w') as f:
            json.dump(edge.to_dict(), f, indent=2)
    
    def add_node(self, node_type: Union[str, NodeType], name: str,
               repository_id: Optional[str] = None,
               properties: Optional[Dict[str, Any]] = None,
               metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a node to the graph.
        
        Args:
            node_type: Type of node
            name: Name of the node
            repository_id: Optional ID of the containing repository
            properties: Optional node properties
            metadata: Optional node metadata
            
        Returns:
            Node ID
        """
        # Convert node_type from string if needed
        if isinstance(node_type, str):
            node_type = NodeType(node_type)
        
        # Generate node ID
        node_id = str(uuid.uuid4())
        
        # Create node
        node = GraphNode(
            node_id=node_id,
            node_type=node_type,
            name=name,
            repository_id=repository_id,
            properties=properties,
            metadata=metadata
        )
        
        # Add to graph
        self.nodes[node_id] = node
        
        # Update indices
        if node_type not in self.node_type_index:
            self.node_type_index[node_type] = set()
        
        self.node_type_index[node_type].add(node_id)
        
        if repository_id:
            if repository_id not in self.repository_index:
                self.repository_index[repository_id] = set()
            
            self.repository_index[repository_id].add(node_id)
        
        # Initialize node connections
        self.node_connections[node_id] = {'in': set(), 'out': set()}
        
        # Save to storage
        self._save_node(node)
        
        self.logger.info(f"Added node: {name} (ID: {node_id})")
        return node_id
    
    def update_node(self, node_id: str, name: Optional[str] = None,
                  properties: Optional[Dict[str, Any]] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update a node in the graph.
        
        Args:
            node_id: ID of the node to update
            name: Optional new name
            properties: Optional new properties (will be merged)
            metadata: Optional new metadata (will be merged)
            
        Returns:
            Update success
        """
        if node_id not in self.nodes:
            return False
        
        node = self.nodes[node_id]
        
        # Update fields
        if name is not None:
            node.name = name
        
        if properties is not None:
            node.properties.update(properties)
        
        if metadata is not None:
            node.metadata.update(metadata)
        
        # Update timestamp
        node.updated_at = time.time()
        
        # Save to storage
        self._save_node(node)
        
        self.logger.info(f"Updated node: {node.name} (ID: {node_id})")
        return True
    
    def remove_node(self, node_id: str, remove_edges: bool = True) -> bool:
        """
        Remove a node from the graph.
        
        Args:
            node_id: ID of the node to remove
            remove_edges: Whether to remove connected edges
            
        Returns:
            Removal success
        """
        if node_id not in self.nodes:
            return False
        
        node = self.nodes[node_id]
        
        # Remove connected edges if requested
        if remove_edges:
            # Get connected edges
            connected_edges = set()
            
            if node_id in self.node_connections:
                connected_edges.update(self.node_connections[node_id]['in'])
                connected_edges.update(self.node_connections[node_id]['out'])
            
            # Remove edges
            for edge_id in list(connected_edges):
                self.remove_edge(edge_id)
        
        # Update indices
        node_type = node.node_type
        if node_type in self.node_type_index:
            self.node_type_index[node_type].discard(node_id)
        
        repository_id = node.repository_id
        if repository_id and repository_id in self.repository_index:
            self.repository_index[repository_id].discard(node_id)
        
        # Remove node connections
        if node_id in self.node_connections:
            del self.node_connections[node_id]
        
        # Remove from graph
        del self.nodes[node_id]
        
        # Remove from storage
        node_path = os.path.join(self.nodes_dir, f"{node_id}.json")
        if os.path.exists(node_path):
            os.remove(node_path)
        
        self.logger.info(f"Removed node: {node.name} (ID: {node_id})")
        return True
    
    def add_edge(self, edge_type: Union[str, EdgeType],
               source_id: str, target_id: str,
               properties: Optional[Dict[str, Any]] = None,
               weight: float = 1.0,
               metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Add an edge to the graph.
        
        Args:
            edge_type: Type of edge
            source_id: ID of the source node
            target_id: ID of the target node
            properties: Optional edge properties
            weight: Edge weight
            metadata: Optional edge metadata
            
        Returns:
            Edge ID or None if nodes not found
        """
        # Check if nodes exist
        if source_id not in self.nodes or target_id not in self.nodes:
            return None
        
        # Convert edge_type from string if needed
        if isinstance(edge_type, str):
            edge_type = EdgeType(edge_type)
        
        # Generate edge ID
        edge_id = str(uuid.uuid4())
        
        # Create edge
        edge = GraphEdge(
            edge_id=edge_id,
            edge_type=edge_type,
            source_id=source_id,
            target_id=target_id,
            properties=properties,
            weight=weight,
            metadata=metadata
        )
        
        # Add to graph
        self.edges[edge_id] = edge
        
        # Update indices
        if edge_type not in self.edge_type_index:
            self.edge_type_index[edge_type] = set()
        
        self.edge_type_index[edge_type].add(edge_id)
        
        # Update node connections
        self.node_connections[source_id]['out'].add(edge_id)
        self.node_connections[target_id]['in'].add(edge_id)
        
        # Save to storage
        self._save_edge(edge)
        
        self.logger.info(f"Added edge: {edge_type.value} from {source_id} to {target_id} (ID: {edge_id})")
        return edge_id
    
    def update_edge(self, edge_id: str,
                  properties: Optional[Dict[str, Any]] = None,
                  weight: Optional[float] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update an edge in the graph.
        
        Args:
            edge_id: ID of the edge to update
            properties: Optional new properties (will be merged)
            weight: Optional new weight
            metadata: Optional new metadata (will be merged)
            
        Returns:
            Update success
        """
        if edge_id not in self.edges:
            return False
        
        edge = self.edges[edge_id]
        
        # Update fields
        if properties is not None:
            edge.properties.update(properties)
        
        if weight is not None:
            edge.weight = weight
        
        if metadata is not None:
            edge.metadata.update(metadata)
        
        # Update timestamp
        edge.updated_at = time.time()
        
        # Save to storage
        self._save_edge(edge)
        
        self.logger.info(f"Updated edge: {edge.edge_type.value} (ID: {edge_id})")
        return True
    
    def remove_edge(self, edge_id: str) -> bool:
        """
        Remove an edge from the graph.
        
        Args:
            edge_id: ID of the edge to remove
            
        Returns:
            Removal success
        """
        if edge_id not in self.edges:
            return False
        
        edge = self.edges[edge_id]
        
        # Update indices
        edge_type = edge.edge_type
        if edge_type in self.edge_type_index:
            self.edge_type_index[edge_type].discard(edge_id)
        
        # Update node connections
        source_id = edge.source_id
        target_id = edge.target_id
        
        if source_id in self.node_connections:
            self.node_connections[source_id]['out'].discard(edge_id)
        
        if target_id in self.node_connections:
            self.node_connections[target_id]['in'].discard(edge_id)
        
        # Remove from graph
        del self.edges[edge_id]
        
        # Remove from storage
        edge_path = os.path.join(self.edges_dir, f"{edge_id}.json")
        if os.path.exists(edge_path):
            os.remove(edge_path)
        
        self.logger.info(f"Removed edge: {edge.edge_type.value} (ID: {edge_id})")
        return True
    
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a node by ID.
        
        Args:
            node_id: ID of the node
            
        Returns:
            Node data dictionary or None if not found
        """
        if node_id not in self.nodes:
            return None
        
        return self.nodes[node_id].to_dict()
    
    def get_edge(self, edge_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an edge by ID.
        
        Args:
            edge_id: ID of the edge
            
        Returns:
            Edge data dictionary or None if not found
        """
        if edge_id not in self.edges:
            return None
        
        return self.edges[edge_id].to_dict()
    
    def get_nodes_by_type(self, node_type: Union[str, NodeType]) -> List[Dict[str, Any]]:
        """
        Get nodes by type.
        
        Args:
            node_type: Type of nodes to get
            
        Returns:
            List of node data dictionaries
        """
        # Convert node_type from string if needed
        if isinstance(node_type, str):
            node_type = NodeType(node_type)
        
        # Get nodes
        result = []
        
        if node_type in self.node_type_index:
            for node_id in self.node_type_index[node_type]:
                if node_id in self.nodes:
                    result.append(self.nodes[node_id].to_dict())
        
        return result
    
    def get_nodes_by_repository(self, repository_id: str) -> List[Dict[str, Any]]:
        """
        Get nodes by repository.
        
        Args:
            repository_id: ID of the repository
            
        Returns:
            List of node data dictionaries
        """
        # Get nodes
        result = []
        
        if repository_id in self.repository_index:
            for node_id in self.repository_index[repository_id]:
                if node_id in self.nodes:
                    result.append(self.nodes[node_id].to_dict())
        
        return result
    
    def get_edges_by_type(self, edge_type: Union[str, EdgeType]) -> List[Dict[str, Any]]:
        """
        Get edges by type.
        
        Args:
            edge_type: Type of edges to get
            
        Returns:
            List of edge data dictionaries
        """
        # Convert edge_type from string if needed
        if isinstance(edge_type, str):
            edge_type = EdgeType(edge_type)
        
        # Get edges
        result = []
        
        if edge_type in self.edge_type_index:
            for edge_id in self.edge_type_index[edge_type]:
                if edge_id in self.edges:
                    result.append(self.edges[edge_id].to_dict())
        
        return result
    
    def get_connected_nodes(self, node_id: str, direction: str = 'both',
                         edge_types: Optional[List[Union[str, EdgeType]]] = None) -> List[Dict[str, Any]]:
        """
        Get nodes connected to a node.
        
        Args:
            node_id: ID of the node
            direction: Direction of connections ('in', 'out', or 'both')
            edge_types: Optional list of edge types to filter by
            
        Returns:
            List of connected node data dictionaries
        """
        if node_id not in self.nodes or node_id not in self.node_connections:
            return []
        
        # Convert edge_types from strings if needed
        if edge_types is not None:
            edge_types = [
                EdgeType(et) if isinstance(et, str) else et
                for et in edge_types
            ]
        
        # Get connected nodes
        connected_nodes = set()
        
        # Process incoming edges
        if direction in ['in', 'both']:
            for edge_id in self.node_connections[node_id]['in']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    # Add source node
                    source_id = edge.source_id
                    if source_id in self.nodes:
                        connected_nodes.add(source_id)
        
        # Process outgoing edges
        if direction in ['out', 'both']:
            for edge_id in self.node_connections[node_id]['out']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    # Add target node
                    target_id = edge.target_id
                    if target_id in self.nodes:
                        connected_nodes.add(target_id)
        
        # Convert nodes to dictionaries
        result = []
        
        for connected_id in connected_nodes:
            result.append(self.nodes[connected_id].to_dict())
        
        return result
    
    def get_connected_edges(self, node_id: str, direction: str = 'both',
                         edge_types: Optional[List[Union[str, EdgeType]]] = None) -> List[Dict[str, Any]]:
        """
        Get edges connected to a node.
        
        Args:
            node_id: ID of the node
            direction: Direction of connections ('in', 'out', or 'both')
            edge_types: Optional list of edge types to filter by
            
        Returns:
            List of connected edge data dictionaries
        """
        if node_id not in self.nodes or node_id not in self.node_connections:
            return []
        
        # Convert edge_types from strings if needed
        if edge_types is not None:
            edge_types = [
                EdgeType(et) if isinstance(et, str) else et
                for et in edge_types
            ]
        
        # Get connected edges
        connected_edges = set()
        
        # Process incoming edges
        if direction in ['in', 'both']:
            for edge_id in self.node_connections[node_id]['in']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    # Add edge
                    connected_edges.add(edge_id)
        
        # Process outgoing edges
        if direction in ['out', 'both']:
            for edge_id in self.node_connections[node_id]['out']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    # Add edge
                    connected_edges.add(edge_id)
        
        # Convert edges to dictionaries
        result = []
        
        for edge_id in connected_edges:
            result.append(self.edges[edge_id].to_dict())
        
        return result
    
    def find_nodes(self, query: str, node_types: Optional[List[Union[str, NodeType]]] = None,
                repository_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Find nodes by name or properties.
        
        Args:
            query: Search query
            node_types: Optional list of node types to filter by
            repository_id: Optional repository ID to filter by
            
        Returns:
            List of matching node data dictionaries
        """
        # Convert node_types from strings if needed
        if node_types is not None:
            node_types = [
                NodeType(nt) if isinstance(nt, str) else nt
                for nt in node_types
            ]
        
        # Filter nodes
        query = query.lower()
        matches = []
        
        for node_id, node in self.nodes.items():
            # Apply repository filter
            if repository_id is not None and node.repository_id != repository_id:
                continue
            
            # Apply node type filter
            if node_types is not None and node.node_type not in node_types:
                continue
            
            # Check name
            if query in node.name.lower():
                matches.append(node.to_dict())
                continue
            
            # Check properties
            for key, value in node.properties.items():
                if isinstance(value, str) and query in value.lower():
                    matches.append(node.to_dict())
                    break
        
        return matches
    
    def query_subgraph(self, node_ids: List[str], 
                     include_connected: bool = False,
                     edge_types: Optional[List[Union[str, EdgeType]]] = None) -> QueryResult:
        """
        Query a subgraph containing specific nodes.
        
        Args:
            node_ids: IDs of nodes to include
            include_connected: Whether to include connected nodes
            edge_types: Optional list of edge types to filter by when including connected nodes
            
        Returns:
            Query result with nodes and edges
        """
        # Convert edge_types from strings if needed
        if edge_types is not None:
            edge_types = [
                EdgeType(et) if isinstance(et, str) else et
                for et in edge_types
            ]
        
        # Get nodes
        result_nodes = []
        result_node_ids = set()
        
        # Add specified nodes
        for node_id in node_ids:
            if node_id in self.nodes:
                result_nodes.append(self.nodes[node_id])
                result_node_ids.add(node_id)
        
        # Add connected nodes if requested
        if include_connected:
            for node_id in list(result_node_ids):
                connected_node_dicts = self.get_connected_nodes(
                    node_id=node_id,
                    direction='both',
                    edge_types=edge_types
                )
                
                for connected_node_dict in connected_node_dicts:
                    connected_id = connected_node_dict['id']
                    
                    if connected_id not in result_node_ids and connected_id in self.nodes:
                        result_nodes.append(self.nodes[connected_id])
                        result_node_ids.add(connected_id)
        
        # Get edges between result nodes
        result_edges = []
        
        for node_id in result_node_ids:
            for edge_id in self.node_connections[node_id]['out']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    # Check if edge connects nodes in result
                    if edge.target_id in result_node_ids:
                        result_edges.append(edge)
        
        return QueryResult(nodes=result_nodes, edges=result_edges)
    
    def get_shortest_path(self, source_id: str, target_id: str,
                       edge_types: Optional[List[Union[str, EdgeType]]] = None) -> Optional[QueryResult]:
        """
        Find the shortest path between two nodes.
        
        Args:
            source_id: ID of the source node
            target_id: ID of the target node
            edge_types: Optional list of edge types to consider
            
        Returns:
            Query result with path nodes and edges, or None if no path exists
        """
        if source_id not in self.nodes or target_id not in self.nodes:
            return None
        
        # Convert edge_types from strings if needed
        if edge_types is not None:
            edge_types = [
                EdgeType(et) if isinstance(et, str) else et
                for et in edge_types
            ]
        
        # Use breadth-first search to find shortest path
        visited = {source_id}
        queue = [(source_id, [])]  # (node_id, path_edges)
        
        while queue:
            current_id, path_edges = queue.pop(0)
            
            # Check outgoing edges
            for edge_id in self.node_connections[current_id]['out']:
                if edge_id in self.edges:
                    edge = self.edges[edge_id]
                    
                    # Apply edge type filter
                    if edge_types is not None and edge.edge_type not in edge_types:
                        continue
                    
                    next_id = edge.target_id
                    
                    # Check if target reached
                    if next_id == target_id:
                        # Build result
                        path_edges.append(edge_id)
                        return self._build_path_result(source_id, target_id, path_edges)
                    
                    # Continue search if node not visited
                    if next_id not in visited:
                        visited.add(next_id)
                        queue.append((next_id, path_edges + [edge_id]))
        
        # No path found
        return None
    
    def _build_path_result(self, source_id: str, target_id: str, edge_ids: List[str]) -> QueryResult:
        """
        Build a query result for a path.
        
        Args:
            source_id: ID of the source node
            target_id: ID of the target node
            edge_ids: IDs of edges in the path
            
        Returns:
            Query result with path nodes and edges
        """
        # Initialize with source and target nodes
        result_nodes = []
        result_node_ids = set()
        
        if source_id in self.nodes:
            result_nodes.append(self.nodes[source_id])
            result_node_ids.add(source_id)
        
        if target_id in self.nodes and target_id != source_id:
            result_nodes.append(self.nodes[target_id])
            result_node_ids.add(target_id)
        
        # Add intermediate nodes and edges
        result_edges = []
        
        for edge_id in edge_ids:
            if edge_id in self.edges:
                edge = self.edges[edge_id]
                result_edges.append(edge)
                
                # Add nodes
                if edge.source_id not in result_node_ids and edge.source_id in self.nodes:
                    result_nodes.append(self.nodes[edge.source_id])
                    result_node_ids.add(edge.source_id)
                
                if edge.target_id not in result_node_ids and edge.target_id in self.nodes:
                    result_nodes.append(self.nodes[edge.target_id])
                    result_node_ids.add(edge.target_id)
        
        return QueryResult(nodes=result_nodes, edges=result_edges)
    
    def get_graph_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge graph.
        
        Returns:
            Dictionary of graph statistics
        """
        # Count nodes by type
        node_type_counts = {}
        for node_type, node_ids in self.node_type_index.items():
            node_type_counts[node_type.value] = len(node_ids)
        
        # Count edges by type
        edge_type_counts = {}
        for edge_type, edge_ids in self.edge_type_index.items():
            edge_type_counts[edge_type.value] = len(edge_ids)
        
        # Count repositories
        repository_count = len(self.repository_index)
        
        # Identify most connected nodes
        node_connection_counts = {}
        for node_id, connections in self.node_connections.items():
            connection_count = len(connections['in']) + len(connections['out'])
            node_connection_counts[node_id] = connection_count
        
        most_connected = sorted(
            node_connection_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        most_connected_nodes = []
        for node_id, count in most_connected:
            if node_id in self.nodes:
                most_connected_nodes.append({
                    'id': node_id,
                    'name': self.nodes[node_id].name,
                    'type': self.nodes[node_id].node_type.value,
                    'connection_count': count
                })
        
        return {
            'node_count': len(self.nodes),
            'edge_count': len(self.edges),
            'repository_count': repository_count,
            'node_type_counts': node_type_counts,
            'edge_type_counts': edge_type_counts,
            'most_connected_nodes': most_connected_nodes
        }
    
    def clear_repository(self, repository_id: str) -> int:
        """
        Clear all nodes and edges for a repository.
        
        Args:
            repository_id: ID of the repository to clear
            
        Returns:
            Number of nodes removed
        """
        if repository_id not in self.repository_index:
            return 0
        
        # Get nodes to remove
        nodes_to_remove = list(self.repository_index[repository_id])
        count = len(nodes_to_remove)
        
        # Remove nodes (and connected edges)
        for node_id in nodes_to_remove:
            self.remove_node(node_id, remove_edges=True)
        
        # Clear repository index
        del self.repository_index[repository_id]
        
        self.logger.info(f"Cleared repository: {repository_id} ({count} nodes)")
        return count
    
    def analyze_repository_patterns(self, repository_id: str) -> Dict[str, Any]:
        """
        Analyze patterns in a repository.
        
        Args:
            repository_id: ID of the repository to analyze
            
        Returns:
            Dictionary of analysis results
        """
        if repository_id not in self.repository_index:
            return {'error': 'Repository not found'}
        
        # Get repository nodes
        repository_nodes = self.get_nodes_by_repository(repository_id)
        
        # Count nodes by type
        node_type_counts = {}
        for node in repository_nodes:
            node_type = node['node_type']
            node_type_counts[node_type] = node_type_counts.get(node_type, 0) + 1
        
        # Analyze class inheritance
        class_nodes = [
            node for node in repository_nodes
            if node['node_type'] == NodeType.CLASS.value
        ]
        
        inheritance_patterns = []
        
        for class_node in class_nodes:
            class_id = class_node['id']
            
            # Get incoming "inherits" edges
            inherit_edges = self.get_connected_edges(
                node_id=class_id,
                direction='in',
                edge_types=[EdgeType.INHERITS]
            )
            
            if inherit_edges:
                for edge in inherit_edges:
                    source_id = edge['source_id']
                    
                    if source_id in self.nodes:
                        source_node = self.nodes[source_id]
                        
                        inheritance_patterns.append({
                            'subclass': source_node.name,
                            'subclass_id': source_id,
                            'superclass': class_node['name'],
                            'superclass_id': class_id
                        })
        
        # Analyze function calls
        function_nodes = [
            node for node in repository_nodes
            if node['node_type'] in [NodeType.FUNCTION.value, NodeType.METHOD.value]
        ]
        
        call_patterns = []
        
        for function_node in function_nodes:
            function_id = function_node['id']
            
            # Get outgoing "calls" edges
            call_edges = self.get_connected_edges(
                node_id=function_id,
                direction='out',
                edge_types=[EdgeType.CALLS]
            )
            
            if call_edges:
                for edge in call_edges:
                    target_id = edge['target_id']
                    
                    if target_id in self.nodes:
                        target_node = self.nodes[target_id]
                        
                        call_patterns.append({
                            'caller': function_node['name'],
                            'caller_id': function_id,
                            'callee': target_node.name,
                            'callee_id': target_id,
                            'weight': edge['weight']
                        })
        
        # Analyze dependencies
        dependency_patterns = []
        
        for node in repository_nodes:
            if node['node_type'] in [NodeType.FILE.value, NodeType.CLASS.value]:
                node_id = node['id']
                
                # Get outgoing "depends_on" edges
                dependency_edges = self.get_connected_edges(
                    node_id=node_id,
                    direction='out',
                    edge_types=[EdgeType.DEPENDS_ON]
                )
                
                if dependency_edges:
                    for edge in dependency_edges:
                        target_id = edge['target_id']
                        
                        if target_id in self.nodes:
                            target_node = self.nodes[target_id]
                            
                            dependency_patterns.append({
                                'source': node['name'],
                                'source_id': node_id,
                                'source_type': node['node_type'],
                                'target': target_node.name,
                                'target_id': target_id,
                                'target_type': target_node.node_type.value,
                                'weight': edge['weight']
                            })
        
        return {
            'repository_id': repository_id,
            'node_count': len(repository_nodes),
            'node_type_counts': node_type_counts,
            'inheritance_patterns': inheritance_patterns,
            'call_patterns': call_patterns,
            'dependency_patterns': dependency_patterns
        }
    
    def find_similar_patterns_cross_repository(self, repository_id: str) -> Dict[str, Any]:
        """
        Find patterns in a repository that are similar to patterns in other repositories.
        
        Args:
            repository_id: ID of the repository to analyze
            
        Returns:
            Dictionary of similar patterns
        """
        if repository_id not in self.repository_index:
            return {'error': 'Repository not found'}
        
        # Get all repositories
        repositories = set(self.repository_index.keys())
        
        # Remove current repository
        other_repositories = repositories - {repository_id}
        
        if not other_repositories:
            return {'error': 'No other repositories for comparison'}
        
        # Get current repository nodes
        repository_nodes = self.get_nodes_by_repository(repository_id)
        
        # Analyze class inheritance patterns
        similar_inheritance_patterns = []
        
        class_nodes = [
            node for node in repository_nodes
            if node['node_type'] == NodeType.CLASS.value
        ]
        
        for class_node in class_nodes:
            class_id = class_node['id']
            
            # Get incoming "inherits" edges
            inherit_edges = self.get_connected_edges(
                node_id=class_id,
                direction='in',
                edge_types=[EdgeType.INHERITS]
            )
            
            if inherit_edges:
                # Build pattern signature
                class_name = class_node['name']
                
                for edge in inherit_edges:
                    source_id = edge['source_id']
                    
                    if source_id in self.nodes:
                        source_node = self.nodes[source_id]
                        subclass_name = source_node.name
                        
                        # Search for similar pattern in other repositories
                        for other_repo_id in other_repositories:
                            other_repo_nodes = self.get_nodes_by_repository(other_repo_id)
                            
                            other_class_nodes = [
                                node for node in other_repo_nodes
                                if node['node_type'] == NodeType.CLASS.value
                            ]
                            
                            for other_class_node in other_class_nodes:
                                # Check name similarity
                                if self._name_similarity(class_name, other_class_node['name']) >= 0.7:
                                    other_class_id = other_class_node['id']
                                    
                                    # Get incoming "inherits" edges
                                    other_inherit_edges = self.get_connected_edges(
                                        node_id=other_class_id,
                                        direction='in',
                                        edge_types=[EdgeType.INHERITS]
                                    )
                                    
                                    for other_edge in other_inherit_edges:
                                        other_source_id = other_edge['source_id']
                                        
                                        if other_source_id in self.nodes:
                                            other_source_node = self.nodes[other_source_id]
                                            other_subclass_name = other_source_node.name
                                            
                                            # Check subclass name similarity
                                            if self._name_similarity(subclass_name, other_subclass_name) >= 0.7:
                                                similar_inheritance_patterns.append({
                                                    'repository_id': repository_id,
                                                    'class': class_name,
                                                    'class_id': class_id,
                                                    'subclass': subclass_name,
                                                    'subclass_id': source_id,
                                                    'other_repository_id': other_repo_id,
                                                    'other_class': other_class_node['name'],
                                                    'other_class_id': other_class_id,
                                                    'other_subclass': other_subclass_name,
                                                    'other_subclass_id': other_source_id,
                                                    'similarity': 0.7  # Placeholder, should be calculated
                                                })
        
        # Analyze function call patterns
        similar_call_patterns = []
        
        function_nodes = [
            node for node in repository_nodes
            if node['node_type'] in [NodeType.FUNCTION.value, NodeType.METHOD.value]
        ]
        
        for function_node in function_nodes:
            function_id = function_node['id']
            
            # Get outgoing "calls" edges
            call_edges = self.get_connected_edges(
                node_id=function_id,
                direction='out',
                edge_types=[EdgeType.CALLS]
            )
            
            if len(call_edges) >= 3:  # Only analyze functions with multiple calls
                # Build call signature
                function_name = function_node['name']
                callees = []
                
                for edge in call_edges:
                    target_id = edge['target_id']
                    
                    if target_id in self.nodes:
                        callees.append(self.nodes[target_id].name)
                
                # Search for similar pattern in other repositories
                for other_repo_id in other_repositories:
                    other_repo_nodes = self.get_nodes_by_repository(other_repo_id)
                    
                    other_function_nodes = [
                        node for node in other_repo_nodes
                        if node['node_type'] in [NodeType.FUNCTION.value, NodeType.METHOD.value]
                    ]
                    
                    for other_function_node in other_function_nodes:
                        # Check name similarity
                        if self._name_similarity(function_name, other_function_node['name']) >= 0.7:
                            other_function_id = other_function_node['id']
                            
                            # Get outgoing "calls" edges
                            other_call_edges = self.get_connected_edges(
                                node_id=other_function_id,
                                direction='out',
                                edge_types=[EdgeType.CALLS]
                            )
                            
                            if len(other_call_edges) >= 3:
                                # Build other call signature
                                other_callees = []
                                
                                for other_edge in other_call_edges:
                                    other_target_id = other_edge['target_id']
                                    
                                    if other_target_id in self.nodes:
                                        other_callees.append(self.nodes[other_target_id].name)
                                
                                # Calculate signature similarity
                                signature_similarity = self._signature_similarity(callees, other_callees)
                                
                                if signature_similarity >= 0.6:
                                    similar_call_patterns.append({
                                        'repository_id': repository_id,
                                        'function': function_name,
                                        'function_id': function_id,
                                        'callees': callees,
                                        'other_repository_id': other_repo_id,
                                        'other_function': other_function_node['name'],
                                        'other_function_id': other_function_id,
                                        'other_callees': other_callees,
                                        'similarity': signature_similarity
                                    })
        
        return {
            'repository_id': repository_id,
            'similar_inheritance_patterns': similar_inheritance_patterns,
            'similar_call_patterns': similar_call_patterns
        }
    
    def _name_similarity(self, name1: str, name2: str) -> float:
        """
        Calculate similarity between two names.
        
        Args:
            name1: First name
            name2: Second name
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Simple Jaccard similarity for now
        # A more sophisticated approach would use edit distance, n-grams, or embeddings
        
        # Tokenize names
        tokens1 = set(re.findall(r'[A-Za-z0-9]+', name1.lower()))
        tokens2 = set(re.findall(r'[A-Za-z0-9]+', name2.lower()))
        
        # Calculate Jaccard similarity
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def _signature_similarity(self, items1: List[str], items2: List[str]) -> float:
        """
        Calculate similarity between two signatures (lists of items).
        
        Args:
            items1: First list of items
            items2: Second list of items
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Convert to sets
        set1 = set(items1)
        set2 = set(items2)
        
        # Calculate Jaccard similarity
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    def export_graph(self, format: str = 'json') -> Dict[str, Any]:
        """
        Export the knowledge graph.
        
        Args:
            format: Export format ('json' only for now)
            
        Returns:
            Dictionary with exported graph data
        """
        if format != 'json':
            raise ValueError(f"Unsupported export format: {format}")
        
        # Convert nodes to dictionaries
        nodes_data = [node.to_dict() for node in self.nodes.values()]
        
        # Convert edges to dictionaries
        edges_data = [edge.to_dict() for edge in self.edges.values()]
        
        return {
            'format': format,
            'timestamp': time.time(),
            'nodes': nodes_data,
            'edges': edges_data
        }
    
    def import_graph(self, data: Dict[str, Any], merge: bool = False) -> bool:
        """
        Import a knowledge graph.
        
        Args:
            data: Graph data to import
            merge: Whether to merge with existing graph
            
        Returns:
            Import success
        """
        if not merge:
            # Clear existing graph
            self.nodes = {}
            self.edges = {}
            self.node_type_index = {}
            self.repository_index = {}
            self.edge_type_index = {}
            self.node_connections = {}
        
        try:
            # Import nodes
            for node_data in data.get('nodes', []):
                node = GraphNode.from_dict(node_data)
                
                # Add to graph
                self.nodes[node.id] = node
                
                # Update indices
                node_type = node.node_type
                if node_type not in self.node_type_index:
                    self.node_type_index[node_type] = set()
                
                self.node_type_index[node_type].add(node.id)
                
                if node.repository_id:
                    if node.repository_id not in self.repository_index:
                        self.repository_index[node.repository_id] = set()
                    
                    self.repository_index[node.repository_id].add(node.id)
                
                # Initialize node connections
                self.node_connections[node.id] = {'in': set(), 'out': set()}
                
                # Save to storage
                self._save_node(node)
            
            # Import edges
            for edge_data in data.get('edges', []):
                edge = GraphEdge.from_dict(edge_data)
                
                # Add to graph
                self.edges[edge.id] = edge
                
                # Update indices
                edge_type = edge.edge_type
                if edge_type not in self.edge_type_index:
                    self.edge_type_index[edge_type] = set()
                
                self.edge_type_index[edge_type].add(edge.id)
                
                # Update node connections
                source_id = edge.source_id
                target_id = edge.target_id
                
                if source_id in self.node_connections:
                    self.node_connections[source_id]['out'].add(edge.id)
                
                if target_id in self.node_connections:
                    self.node_connections[target_id]['in'].add(edge.id)
                
                # Save to storage
                self._save_edge(edge)
            
            self.logger.info(f"Imported graph with {len(data.get('nodes', []))} nodes and {len(data.get('edges', []))} edges")
            return True
        
        except Exception as e:
            self.logger.error(f"Error importing graph: {e}")
            return False