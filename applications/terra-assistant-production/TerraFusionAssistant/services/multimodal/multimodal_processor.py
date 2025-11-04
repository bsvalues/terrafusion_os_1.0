"""
Multimodal Processor

This module implements the multimodal processor for handling different data modalities
including code, text, diagrams, and other visual representations.
"""
import os
import json
import logging
import time
import uuid
import base64
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Tuple, Set, BinaryIO

class Modality(Enum):
    """Types of modalities supported by the processor."""
    CODE = "code"
    TEXT = "text"
    DIAGRAM = "diagram"
    IMAGE = "image"
    MARKDOWN = "markdown"
    JSON = "json"
    XML = "xml"
    HTML = "html"
    CSV = "csv"


class ContentItem:
    """
    Represents a content item of a specific modality.
    """
    
    def __init__(self, item_id: str, modality: Modality, content: Any,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a content item.
        
        Args:
            item_id: Unique identifier for the item
            modality: Modality of the content
            content: The actual content
            metadata: Optional metadata
        """
        self.id = item_id
        self.modality = modality
        self.content = content
        self.metadata = metadata or {}
        self.created_at = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert content item to a dictionary."""
        return {
            'id': self.id,
            'modality': self.modality.value,
            'content_type': type(self.content).__name__,
            'metadata': self.metadata,
            'created_at': self.created_at
        }


class ModalityConverter:
    """
    Converter between different modalities.
    """
    
    def __init__(self):
        """Initialize the modality converter."""
        self.converters = {}  # (source_modality, target_modality) -> converter function
    
    def register_converter(self, source_modality: Modality, target_modality: Modality,
                         converter_func: callable) -> None:
        """
        Register a converter function.
        
        Args:
            source_modality: Source modality
            target_modality: Target modality
            converter_func: Converter function that takes content of source modality
                          and returns content of target modality
        """
        self.converters[(source_modality, target_modality)] = converter_func
    
    def convert(self, item: ContentItem, target_modality: Modality) -> Optional[ContentItem]:
        """
        Convert a content item to another modality.
        
        Args:
            item: Content item to convert
            target_modality: Target modality
            
        Returns:
            Converted content item or None if conversion not possible
        """
        # If already the target modality, return a copy
        if item.modality == target_modality:
            return ContentItem(
                item_id=str(uuid.uuid4()),
                modality=item.modality,
                content=item.content,
                metadata=item.metadata.copy()
            )
        
        # Check if a converter exists
        converter = self.converters.get((item.modality, target_modality))
        if not converter:
            return None
        
        try:
            # Convert the content
            converted_content = converter(item.content)
            
            # Create a new content item
            return ContentItem(
                item_id=str(uuid.uuid4()),
                modality=target_modality,
                content=converted_content,
                metadata=item.metadata.copy()
            )
        
        except Exception as e:
            logging.error(f"Error converting from {item.modality.value} to {target_modality.value}: {e}")
            return None


class ContentAlignment:
    """
    Alignment between content items of different modalities.
    """
    
    def __init__(self, alignment_id: str, name: str,
               items: Optional[Dict[str, ContentItem]] = None,
               links: Optional[List[Dict[str, Any]]] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a content alignment.
        
        Args:
            alignment_id: Unique identifier for the alignment
            name: Human-readable name
            items: Optional dictionary of content items (item_id -> ContentItem)
            links: Optional list of links between content items
            metadata: Optional metadata
        """
        self.id = alignment_id
        self.name = name
        self.items = items or {}
        self.links = links or []
        self.metadata = metadata or {}
        self.created_at = time.time()
    
    def add_item(self, item: ContentItem) -> None:
        """
        Add a content item to the alignment.
        
        Args:
            item: Content item to add
        """
        self.items[item.id] = item
    
    def remove_item(self, item_id: str) -> bool:
        """
        Remove a content item from the alignment.
        
        Args:
            item_id: ID of the item to remove
            
        Returns:
            Removal success
        """
        if item_id in self.items:
            del self.items[item_id]
            
            # Remove links involving this item
            self.links = [link for link in self.links 
                        if link['source'] != item_id and link['target'] != item_id]
            
            return True
        
        return False
    
    def add_link(self, source_id: str, target_id: str, link_type: str,
              score: float = 1.0, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Add a link between content items.
        
        Args:
            source_id: ID of the source item
            target_id: ID of the target item
            link_type: Type of link
            score: Link score (0.0 to 1.0)
            metadata: Optional link metadata
            
        Returns:
            Addition success
        """
        if source_id not in self.items or target_id not in self.items:
            return False
        
        # Create link
        link = {
            'source': source_id,
            'target': target_id,
            'type': link_type,
            'score': score,
            'metadata': metadata or {}
        }
        
        self.links.append(link)
        return True
    
    def remove_link(self, source_id: str, target_id: str, link_type: Optional[str] = None) -> bool:
        """
        Remove a link between content items.
        
        Args:
            source_id: ID of the source item
            target_id: ID of the target item
            link_type: Optional type of link
            
        Returns:
            Removal success
        """
        original_count = len(self.links)
        
        if link_type:
            self.links = [link for link in self.links 
                       if not (link['source'] == source_id and 
                             link['target'] == target_id and 
                             link['type'] == link_type)]
        else:
            self.links = [link for link in self.links 
                       if not (link['source'] == source_id and 
                             link['target'] == target_id)]
        
        return len(self.links) < original_count
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert content alignment to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'items': {item_id: item.to_dict() for item_id, item in self.items.items()},
            'links': self.links,
            'metadata': self.metadata,
            'created_at': self.created_at
        }


class MultimodalProcessor:
    """
    Processor for multimodal content.
    
    This class provides:
    - Content conversion between modalities
    - Content alignment
    - Multimodal analysis
    - Multimodal generation
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the multimodal processor.
        
        Args:
            storage_dir: Optional directory for persistent storage
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'multimodal_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Set up content directory
        self.content_dir = os.path.join(storage_dir, 'content')
        os.makedirs(self.content_dir, exist_ok=True)
        
        # Set up alignment directory
        self.alignment_dir = os.path.join(storage_dir, 'alignments')
        os.makedirs(self.alignment_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('multimodal_processor')
        
        # Initialize modality converter
        self.converter = ModalityConverter()
        self._register_default_converters()
        
        # Initialize content items
        self.content_items = {}  # item_id -> ContentItem
        
        # Initialize alignments
        self.alignments = {}  # alignment_id -> ContentAlignment
        
        # Load existing data
        self._load_data()
    
    def _register_default_converters(self) -> None:
        """Register default modality converters."""
        # Code to Text
        self.converter.register_converter(
            Modality.CODE, 
            Modality.TEXT,
            lambda code: code  # Simple passthrough for text representation
        )
        
        # Text to Markdown
        self.converter.register_converter(
            Modality.TEXT, 
            Modality.MARKDOWN,
            lambda text: text  # Simple passthrough, assuming plain text
        )
        
        # Markdown to Text
        self.converter.register_converter(
            Modality.MARKDOWN, 
            Modality.TEXT,
            lambda md: md  # Simple passthrough, ignoring markdown formatting
        )
        
        # JSON to Text
        self.converter.register_converter(
            Modality.JSON, 
            Modality.TEXT,
            lambda json_obj: json.dumps(json_obj, indent=2)
        )
        
        # More converters would be implemented in a real system
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load content items (metadata only)
        content_meta_dir = os.path.join(self.storage_dir, 'content_meta')
        if os.path.exists(content_meta_dir):
            for filename in os.listdir(content_meta_dir):
                if filename.endswith('.json'):
                    item_id = filename[:-5]  # Remove '.json'
                    item_path = os.path.join(content_meta_dir, filename)
                    
                    try:
                        with open(item_path, 'r') as f:
                            item_data = json.load(f)
                        
                        # Load content based on modality
                        modality = Modality(item_data['modality'])
                        content = self._load_content(item_id, modality)
                        
                        if content is not None:
                            item = ContentItem(
                                item_id=item_id,
                                modality=modality,
                                content=content,
                                metadata=item_data.get('metadata', {})
                            )
                            
                            item.created_at = item_data.get('created_at', time.time())
                            
                            self.content_items[item_id] = item
                            
                            self.logger.info(f"Loaded content item: {item_id}")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading content item {item_id}: {e}")
        
        # Load alignments
        if os.path.exists(self.alignment_dir):
            for filename in os.listdir(self.alignment_dir):
                if filename.endswith('.json'):
                    alignment_id = filename[:-5]  # Remove '.json'
                    alignment_path = os.path.join(self.alignment_dir, filename)
                    
                    try:
                        with open(alignment_path, 'r') as f:
                            alignment_data = json.load(f)
                        
                        alignment = ContentAlignment(
                            alignment_id=alignment_id,
                            name=alignment_data['name'],
                            links=alignment_data.get('links', []),
                            metadata=alignment_data.get('metadata', {})
                        )
                        
                        alignment.created_at = alignment_data.get('created_at', time.time())
                        
                        # Add items to alignment
                        for item_id in alignment_data.get('items', {}).keys():
                            if item_id in self.content_items:
                                alignment.items[item_id] = self.content_items[item_id]
                        
                        self.alignments[alignment_id] = alignment
                        
                        self.logger.info(f"Loaded alignment: {alignment.name} (ID: {alignment_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading alignment {alignment_id}: {e}")
    
    def _save_content_item_metadata(self, item: ContentItem) -> None:
        """
        Save content item metadata to storage.
        
        Args:
            item: Content item to save
        """
        content_meta_dir = os.path.join(self.storage_dir, 'content_meta')
        os.makedirs(content_meta_dir, exist_ok=True)
        
        item_path = os.path.join(content_meta_dir, f"{item.id}.json")
        
        with open(item_path, 'w') as f:
            json.dump(item.to_dict(), f, indent=2)
    
    def _save_content(self, item: ContentItem) -> None:
        """
        Save content to storage.
        
        Args:
            item: Content item to save
        """
        # Create directory for this item
        item_dir = os.path.join(self.content_dir, item.id)
        os.makedirs(item_dir, exist_ok=True)
        
        # Save content based on modality
        if item.modality == Modality.TEXT or item.modality == Modality.CODE or item.modality == Modality.MARKDOWN:
            # Save as text file
            with open(os.path.join(item_dir, 'content.txt'), 'w') as f:
                f.write(item.content)
        
        elif item.modality == Modality.JSON:
            # Save as JSON file
            with open(os.path.join(item_dir, 'content.json'), 'w') as f:
                json.dump(item.content, f, indent=2)
        
        elif item.modality == Modality.XML or item.modality == Modality.HTML:
            # Save as XML/HTML file
            with open(os.path.join(item_dir, f"content.{item.modality.value}"), 'w') as f:
                f.write(item.content)
        
        elif item.modality == Modality.IMAGE:
            # Save as image file (assuming base64 encoded)
            if isinstance(item.content, str) and item.content.startswith('data:image'):
                # Extract base64 data
                header, encoded = item.content.split(",", 1)
                with open(os.path.join(item_dir, 'content.png'), 'wb') as f:
                    f.write(base64.b64decode(encoded))
            elif isinstance(item.content, bytes):
                with open(os.path.join(item_dir, 'content.png'), 'wb') as f:
                    f.write(item.content)
            else:
                self.logger.error(f"Unsupported image content format for item {item.id}")
        
        elif item.modality == Modality.DIAGRAM:
            # Save as diagram file (format depends on diagram type)
            diagram_format = item.metadata.get('format', 'svg')
            
            if diagram_format == 'svg' and isinstance(item.content, str):
                with open(os.path.join(item_dir, 'content.svg'), 'w') as f:
                    f.write(item.content)
            elif diagram_format == 'png' and isinstance(item.content, str) and item.content.startswith('data:image'):
                # Extract base64 data
                header, encoded = item.content.split(",", 1)
                with open(os.path.join(item_dir, 'content.png'), 'wb') as f:
                    f.write(base64.b64decode(encoded))
            elif isinstance(item.content, bytes):
                with open(os.path.join(item_dir, f"content.{diagram_format}"), 'wb') as f:
                    f.write(item.content)
            else:
                self.logger.error(f"Unsupported diagram content format for item {item.id}")
        
        else:
            # For other modalities, save as binary
            try:
                with open(os.path.join(item_dir, 'content.bin'), 'wb') as f:
                    f.write(item.content if isinstance(item.content, bytes) else str(item.content).encode())
            except Exception as e:
                self.logger.error(f"Error saving content for item {item.id}: {e}")
    
    def _load_content(self, item_id: str, modality: Modality) -> Any:
        """
        Load content from storage.
        
        Args:
            item_id: ID of the content item
            modality: Modality of the content
            
        Returns:
            Loaded content or None if not found
        """
        # Check if directory exists
        item_dir = os.path.join(self.content_dir, item_id)
        if not os.path.exists(item_dir):
            return None
        
        try:
            # Load content based on modality
            if modality == Modality.TEXT or modality == Modality.CODE or modality == Modality.MARKDOWN:
                # Load from text file
                content_path = os.path.join(item_dir, 'content.txt')
                if os.path.exists(content_path):
                    with open(content_path, 'r') as f:
                        return f.read()
            
            elif modality == Modality.JSON:
                # Load from JSON file
                content_path = os.path.join(item_dir, 'content.json')
                if os.path.exists(content_path):
                    with open(content_path, 'r') as f:
                        return json.load(f)
            
            elif modality == Modality.XML:
                # Load from XML file
                content_path = os.path.join(item_dir, 'content.xml')
                if os.path.exists(content_path):
                    with open(content_path, 'r') as f:
                        return f.read()
            
            elif modality == Modality.HTML:
                # Load from HTML file
                content_path = os.path.join(item_dir, 'content.html')
                if os.path.exists(content_path):
                    with open(content_path, 'r') as f:
                        return f.read()
            
            elif modality == Modality.IMAGE:
                # Load from image file
                content_path = os.path.join(item_dir, 'content.png')
                if os.path.exists(content_path):
                    with open(content_path, 'rb') as f:
                        return f.read()
            
            elif modality == Modality.DIAGRAM:
                # Try different diagram formats
                for ext in ['svg', 'png', 'dot']:
                    content_path = os.path.join(item_dir, f'content.{ext}')
                    if os.path.exists(content_path):
                        if ext in ['svg', 'dot']:
                            with open(content_path, 'r') as f:
                                return f.read()
                        else:
                            with open(content_path, 'rb') as f:
                                return f.read()
            
            else:
                # For other modalities, try binary
                content_path = os.path.join(item_dir, 'content.bin')
                if os.path.exists(content_path):
                    with open(content_path, 'rb') as f:
                        return f.read()
            
            return None
        
        except Exception as e:
            self.logger.error(f"Error loading content for item {item_id}: {e}")
            return None
    
    def _save_alignment(self, alignment: ContentAlignment) -> None:
        """
        Save an alignment to storage.
        
        Args:
            alignment: Alignment to save
        """
        alignment_path = os.path.join(self.alignment_dir, f"{alignment.id}.json")
        
        with open(alignment_path, 'w') as f:
            json.dump(alignment.to_dict(), f, indent=2)
    
    def create_content_item(self, content: Any, modality: Union[str, Modality],
                         metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new content item.
        
        Args:
            content: The content
            modality: Modality of the content
            metadata: Optional metadata
            
        Returns:
            Content item ID
        """
        # Convert modality from string if needed
        if isinstance(modality, str):
            modality = Modality(modality)
        
        # Generate item ID
        item_id = str(uuid.uuid4())
        
        # Create content item
        item = ContentItem(
            item_id=item_id,
            modality=modality,
            content=content,
            metadata=metadata
        )
        
        # Store content item
        self.content_items[item_id] = item
        
        # Save to storage
        self._save_content_item_metadata(item)
        self._save_content(item)
        
        self.logger.info(f"Created content item: {item_id} ({modality.value})")
        return item_id
    
    def get_content_item(self, item_id: str) -> Optional[ContentItem]:
        """
        Get a content item by ID.
        
        Args:
            item_id: ID of the content item
            
        Returns:
            Content item or None if not found
        """
        return self.content_items.get(item_id)
    
    def update_content_item(self, item_id: str, content: Any = None,
                         metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update a content item.
        
        Args:
            item_id: ID of the content item
            content: Optional new content
            metadata: Optional new metadata
            
        Returns:
            Update success
        """
        if item_id not in self.content_items:
            return False
        
        item = self.content_items[item_id]
        
        # Update content if provided
        if content is not None:
            item.content = content
        
        # Update metadata if provided
        if metadata is not None:
            item.metadata.update(metadata)
        
        # Save to storage
        self._save_content_item_metadata(item)
        
        if content is not None:
            self._save_content(item)
        
        self.logger.info(f"Updated content item: {item_id}")
        return True
    
    def delete_content_item(self, item_id: str) -> bool:
        """
        Delete a content item.
        
        Args:
            item_id: ID of the content item
            
        Returns:
            Deletion success
        """
        if item_id not in self.content_items:
            return False
        
        # Remove from content items
        del self.content_items[item_id]
        
        # Remove from alignments
        for alignment in self.alignments.values():
            alignment.remove_item(item_id)
        
        # Remove from storage
        content_meta_path = os.path.join(self.storage_dir, 'content_meta', f"{item_id}.json")
        if os.path.exists(content_meta_path):
            os.remove(content_meta_path)
        
        content_dir = os.path.join(self.content_dir, item_id)
        if os.path.exists(content_dir):
            import shutil
            shutil.rmtree(content_dir)
        
        # Save updated alignments
        for alignment in self.alignments.values():
            self._save_alignment(alignment)
        
        self.logger.info(f"Deleted content item: {item_id}")
        return True
    
    def convert_content(self, item_id: str, target_modality: Union[str, Modality]) -> Optional[str]:
        """
        Convert a content item to another modality.
        
        Args:
            item_id: ID of the content item
            target_modality: Target modality
            
        Returns:
            ID of the converted content item or None if conversion not possible
        """
        # Get content item
        item = self.get_content_item(item_id)
        if not item:
            return None
        
        # Convert modality from string if needed
        if isinstance(target_modality, str):
            target_modality = Modality(target_modality)
        
        # Perform conversion
        converted_item = self.converter.convert(item, target_modality)
        if not converted_item:
            return None
        
        # Add conversion metadata
        converted_item.metadata['converted_from'] = item_id
        converted_item.metadata['original_modality'] = item.modality.value
        
        # Store converted item
        self.content_items[converted_item.id] = converted_item
        
        # Save to storage
        self._save_content_item_metadata(converted_item)
        self._save_content(converted_item)
        
        self.logger.info(f"Converted content item {item_id} from {item.modality.value} to {target_modality.value}")
        return converted_item.id
    
    def create_alignment(self, name: str, item_ids: Optional[List[str]] = None,
                       metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Create a new content alignment.
        
        Args:
            name: Name of the alignment
            item_ids: Optional list of content item IDs to include
            metadata: Optional metadata
            
        Returns:
            Alignment ID or None if not all items found
        """
        # Check if all items exist
        if item_ids:
            for item_id in item_ids:
                if item_id not in self.content_items:
                    return None
        
        # Generate alignment ID
        alignment_id = str(uuid.uuid4())
        
        # Create alignment
        alignment = ContentAlignment(
            alignment_id=alignment_id,
            name=name,
            metadata=metadata
        )
        
        # Add items
        if item_ids:
            for item_id in item_ids:
                alignment.items[item_id] = self.content_items[item_id]
        
        # Store alignment
        self.alignments[alignment_id] = alignment
        
        # Save to storage
        self._save_alignment(alignment)
        
        self.logger.info(f"Created alignment: {name} (ID: {alignment_id})")
        return alignment_id
    
    def get_alignment(self, alignment_id: str) -> Optional[ContentAlignment]:
        """
        Get an alignment by ID.
        
        Args:
            alignment_id: ID of the alignment
            
        Returns:
            Alignment or None if not found
        """
        return self.alignments.get(alignment_id)
    
    def update_alignment(self, alignment_id: str, name: Optional[str] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update an alignment.
        
        Args:
            alignment_id: ID of the alignment
            name: Optional new name
            metadata: Optional new metadata
            
        Returns:
            Update success
        """
        if alignment_id not in self.alignments:
            return False
        
        alignment = self.alignments[alignment_id]
        
        # Update name if provided
        if name is not None:
            alignment.name = name
        
        # Update metadata if provided
        if metadata is not None:
            alignment.metadata.update(metadata)
        
        # Save to storage
        self._save_alignment(alignment)
        
        self.logger.info(f"Updated alignment: {alignment_id}")
        return True
    
    def delete_alignment(self, alignment_id: str) -> bool:
        """
        Delete an alignment.
        
        Args:
            alignment_id: ID of the alignment
            
        Returns:
            Deletion success
        """
        if alignment_id not in self.alignments:
            return False
        
        # Remove from alignments
        del self.alignments[alignment_id]
        
        # Remove from storage
        alignment_path = os.path.join(self.alignment_dir, f"{alignment_id}.json")
        if os.path.exists(alignment_path):
            os.remove(alignment_path)
        
        self.logger.info(f"Deleted alignment: {alignment_id}")
        return True
    
    def add_item_to_alignment(self, alignment_id: str, item_id: str) -> bool:
        """
        Add a content item to an alignment.
        
        Args:
            alignment_id: ID of the alignment
            item_id: ID of the content item
            
        Returns:
            Addition success
        """
        if alignment_id not in self.alignments or item_id not in self.content_items:
            return False
        
        alignment = self.alignments[alignment_id]
        alignment.add_item(self.content_items[item_id])
        
        # Save to storage
        self._save_alignment(alignment)
        
        self.logger.info(f"Added item {item_id} to alignment {alignment_id}")
        return True
    
    def remove_item_from_alignment(self, alignment_id: str, item_id: str) -> bool:
        """
        Remove a content item from an alignment.
        
        Args:
            alignment_id: ID of the alignment
            item_id: ID of the content item
            
        Returns:
            Removal success
        """
        if alignment_id not in self.alignments:
            return False
        
        alignment = self.alignments[alignment_id]
        result = alignment.remove_item(item_id)
        
        if result:
            # Save to storage
            self._save_alignment(alignment)
            
            self.logger.info(f"Removed item {item_id} from alignment {alignment_id}")
        
        return result
    
    def add_link_to_alignment(self, alignment_id: str, source_id: str, target_id: str,
                          link_type: str, score: float = 1.0,
                          metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Add a link between content items in an alignment.
        
        Args:
            alignment_id: ID of the alignment
            source_id: ID of the source item
            target_id: ID of the target item
            link_type: Type of link
            score: Link score (0.0 to 1.0)
            metadata: Optional link metadata
            
        Returns:
            Addition success
        """
        if alignment_id not in self.alignments:
            return False
        
        alignment = self.alignments[alignment_id]
        result = alignment.add_link(source_id, target_id, link_type, score, metadata)
        
        if result:
            # Save to storage
            self._save_alignment(alignment)
            
            self.logger.info(f"Added link from {source_id} to {target_id} in alignment {alignment_id}")
        
        return result
    
    def remove_link_from_alignment(self, alignment_id: str, source_id: str, target_id: str,
                               link_type: Optional[str] = None) -> bool:
        """
        Remove a link between content items in an alignment.
        
        Args:
            alignment_id: ID of the alignment
            source_id: ID of the source item
            target_id: ID of the target item
            link_type: Optional type of link
            
        Returns:
            Removal success
        """
        if alignment_id not in self.alignments:
            return False
        
        alignment = self.alignments[alignment_id]
        result = alignment.remove_link(source_id, target_id, link_type)
        
        if result:
            # Save to storage
            self._save_alignment(alignment)
            
            self.logger.info(f"Removed link from {source_id} to {target_id} in alignment {alignment_id}")
        
        return result
    
    def analyze_alignment(self, alignment_id: str) -> Dict[str, Any]:
        """
        Analyze a content alignment.
        
        Args:
            alignment_id: ID of the alignment
            
        Returns:
            Analysis results
        """
        if alignment_id not in self.alignments:
            return {'error': 'Alignment not found'}
        
        alignment = self.alignments[alignment_id]
        
        # Count modalities
        modality_counts = {}
        for item in alignment.items.values():
            modality = item.modality.value
            modality_counts[modality] = modality_counts.get(modality, 0) + 1
        
        # Analyze links
        link_types = {}
        for link in alignment.links:
            link_type = link['type']
            link_types[link_type] = link_types.get(link_type, 0) + 1
        
        # Calculate link density
        item_count = len(alignment.items)
        link_count = len(alignment.links)
        max_links = item_count * (item_count - 1) if item_count > 1 else 0
        link_density = link_count / max_links if max_links > 0 else 0
        
        # Calculate average link score
        avg_link_score = sum(link['score'] for link in alignment.links) / link_count if link_count > 0 else 0
        
        # Identify central items
        item_degree = {}
        for link in alignment.links:
            item_degree[link['source']] = item_degree.get(link['source'], 0) + 1
            item_degree[link['target']] = item_degree.get(link['target'], 0) + 1
        
        central_items = sorted(item_degree.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'alignment_id': alignment_id,
            'name': alignment.name,
            'item_count': item_count,
            'link_count': link_count,
            'modality_counts': modality_counts,
            'link_types': link_types,
            'link_density': link_density,
            'average_link_score': avg_link_score,
            'central_items': [
                {
                    'item_id': item_id,
                    'degree': degree,
                    'modality': alignment.items[item_id].modality.value if item_id in alignment.items else None
                }
                for item_id, degree in central_items
            ]
        }
    
    def generate_uml_from_code(self, code_item_id: str) -> Optional[str]:
        """
        Generate a UML diagram from code.
        
        Args:
            code_item_id: ID of the code content item
            
        Returns:
            ID of the generated diagram content item or None if generation failed
        """
        # Get code content item
        code_item = self.get_content_item(code_item_id)
        if not code_item or code_item.modality != Modality.CODE:
            return None
        
        # Simple placeholder implementation - in a real system, this would use a proper UML generator
        try:
            # Extract class/function definitions (very basic)
            import re
            code = code_item.content
            
            # Extract class definitions
            class_pattern = r'class\s+(\w+)(?:\(([^)]*)\))?:'
            classes = re.findall(class_pattern, code)
            
            # Extract function definitions
            function_pattern = r'def\s+(\w+)\s*\(([^)]*)\)'
            functions = re.findall(function_pattern, code)
            
            # Generate a simple PlantUML diagram
            uml = ['@startuml']
            
            # Add classes
            for class_name, parent_classes in classes:
                if parent_classes:
                    parents = [p.strip() for p in parent_classes.split(',')]
                    uml.append(f'class {class_name} extends {" ".join(parents)} {{')
                else:
                    uml.append(f'class {class_name} {{')
                
                # Add class functions (simplistic approach)
                for func_name, params in functions:
                    if f"def {func_name}" in code.split(f"class {class_name}")[1].split("class")[0]:
                        uml.append(f'    +{func_name}({params})')
                
                uml.append('}')
            
            # Add standalone functions
            standalone_functions = []
            for func_name, params in functions:
                is_method = False
                for class_name, _ in classes:
                    if f"def {func_name}" in code.split(f"class {class_name}")[1].split("class")[0]:
                        is_method = True
                        break
                
                if not is_method:
                    standalone_functions.append(f'function {func_name}({params})')
            
            uml.extend(standalone_functions)
            uml.append('@enduml')
            
            # Create diagram content item
            diagram_content = '\n'.join(uml)
            diagram_id = self.create_content_item(
                content=diagram_content,
                modality=Modality.DIAGRAM,
                metadata={
                    'format': 'plantuml',
                    'generated_from': code_item_id,
                    'content_type': 'uml'
                }
            )
            
            return diagram_id
        
        except Exception as e:
            self.logger.error(f"Error generating UML from code: {e}")
            return None
    
    def extract_documentation_from_code(self, code_item_id: str) -> Optional[str]:
        """
        Extract documentation from code.
        
        Args:
            code_item_id: ID of the code content item
            
        Returns:
            ID of the extracted documentation content item or None if extraction failed
        """
        # Get code content item
        code_item = self.get_content_item(code_item_id)
        if not code_item or code_item.modality != Modality.CODE:
            return None
        
        # Simple placeholder implementation - in a real system, this would use a proper documentation extractor
        try:
            # Extract docstrings and comments
            import re
            code = code_item.content
            
            # Extract docstrings
            docstring_pattern = r'"""(.*?)"""'
            docstrings = re.findall(docstring_pattern, code, re.DOTALL)
            
            # Extract single line comments
            comment_pattern = r'#\s*(.*)'
            comments = re.findall(comment_pattern, code)
            
            # Generate documentation
            documentation = ['# Extracted Documentation', '']
            
            if docstrings:
                documentation.append('## Docstrings')
                documentation.append('')
                for i, docstring in enumerate(docstrings):
                    documentation.append(f'### Docstring {i+1}')
                    documentation.append('')
                    documentation.append(docstring.strip())
                    documentation.append('')
            
            if comments:
                documentation.append('## Comments')
                documentation.append('')
                for comment in comments:
                    documentation.append(f'- {comment.strip()}')
            
            # Create documentation content item
            documentation_content = '\n'.join(documentation)
            documentation_id = self.create_content_item(
                content=documentation_content,
                modality=Modality.MARKDOWN,
                metadata={
                    'extracted_from': code_item_id,
                    'content_type': 'documentation'
                }
            )
            
            return documentation_id
        
        except Exception as e:
            self.logger.error(f"Error extracting documentation from code: {e}")
            return None
    
    def verify_code_documentation_alignment(self, code_item_id: str, 
                                        documentation_item_id: str) -> Dict[str, Any]:
        """
        Verify the alignment between code and documentation.
        
        Args:
            code_item_id: ID of the code content item
            documentation_item_id: ID of the documentation content item
            
        Returns:
            Alignment verification results
        """
        # Get content items
        code_item = self.get_content_item(code_item_id)
        doc_item = self.get_content_item(documentation_item_id)
        
        if not code_item or code_item.modality != Modality.CODE:
            return {'error': 'Code item not found or not code'}
        
        if not doc_item or doc_item.modality not in [Modality.TEXT, Modality.MARKDOWN]:
            return {'error': 'Documentation item not found or not text/markdown'}
        
        # Simple placeholder implementation - in a real system, this would use more sophisticated analysis
        try:
            code = code_item.content
            doc = doc_item.content
            
            # Extract function and class names from code
            import re
            class_pattern = r'class\s+(\w+)'
            function_pattern = r'def\s+(\w+)'
            
            classes = re.findall(class_pattern, code)
            functions = re.findall(function_pattern, code)
            
            # Check if these names appear in the documentation
            documented_classes = [cls for cls in classes if cls in doc]
            documented_functions = [func for func in functions if func in doc]
            
            # Calculate coverage
            class_coverage = len(documented_classes) / len(classes) if classes else 1.0
            function_coverage = len(documented_functions) / len(functions) if functions else 1.0
            overall_coverage = (class_coverage + function_coverage) / 2
            
            # Identify undocumented elements
            undocumented_classes = [cls for cls in classes if cls not in doc]
            undocumented_functions = [func for func in functions if func not in doc]
            
            return {
                'class_coverage': class_coverage,
                'function_coverage': function_coverage,
                'overall_coverage': overall_coverage,
                'documented_classes': documented_classes,
                'documented_functions': documented_functions,
                'undocumented_classes': undocumented_classes,
                'undocumented_functions': undocumented_functions,
                'total_classes': len(classes),
                'total_functions': len(functions)
            }
        
        except Exception as e:
            self.logger.error(f"Error verifying code-documentation alignment: {e}")
            return {'error': str(e)}