"""
Academic Framework

This module implements an academic framework that integrates with research papers,
tracks citations, and facilitates the application of cutting-edge research to code analysis.
"""
import os
import json
import logging
import time
import uuid
import re
import requests
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Tuple, Set
from datetime import datetime

class PaperType(Enum):
    """Types of academic papers in the system."""
    RESEARCH = "research"
    SURVEY = "survey"
    THESIS = "thesis"
    TECHNICAL_REPORT = "technical_report"
    WORKSHOP = "workshop"
    BOOK_CHAPTER = "book_chapter"


class Paper:
    """
    Represents an academic paper in the system.
    """
    
    def __init__(self, paper_id: str, title: str, authors: List[str],
               abstract: str, publication_date: str, 
               paper_type: PaperType = PaperType.RESEARCH,
               venue: Optional[str] = None,
               doi: Optional[str] = None,
               url: Optional[str] = None,
               pdf_url: Optional[str] = None,
               keywords: Optional[List[str]] = None,
               citations: Optional[List[str]] = None,
               references: Optional[List[str]] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a paper.
        
        Args:
            paper_id: Unique identifier for the paper
            title: Paper title
            authors: List of author names
            abstract: Paper abstract
            publication_date: Publication date (ISO format: YYYY-MM-DD)
            paper_type: Type of paper
            venue: Optional publication venue
            doi: Optional DOI (Digital Object Identifier)
            url: Optional URL to the paper
            pdf_url: Optional URL to the PDF
            keywords: Optional list of keywords
            citations: Optional list of papers citing this paper
            references: Optional list of papers referenced by this paper
            metadata: Optional paper metadata
        """
        self.id = paper_id
        self.title = title
        self.authors = authors
        self.abstract = abstract
        self.publication_date = publication_date
        self.paper_type = paper_type
        self.venue = venue
        self.doi = doi
        self.url = url
        self.pdf_url = pdf_url
        self.keywords = keywords or []
        self.citations = citations or []
        self.references = references or []
        self.metadata = metadata or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert paper to a dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'authors': self.authors,
            'abstract': self.abstract,
            'publication_date': self.publication_date,
            'paper_type': self.paper_type.value,
            'venue': self.venue,
            'doi': self.doi,
            'url': self.url,
            'pdf_url': self.pdf_url,
            'keywords': self.keywords,
            'citations': self.citations,
            'references': self.references,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Paper':
        """
        Create a paper from a dictionary.
        
        Args:
            data: Paper data dictionary
        
        Returns:
            Paper instance
        """
        paper = cls(
            paper_id=data['id'],
            title=data['title'],
            authors=data['authors'],
            abstract=data['abstract'],
            publication_date=data['publication_date'],
            paper_type=PaperType(data['paper_type']),
            venue=data.get('venue'),
            doi=data.get('doi'),
            url=data.get('url'),
            pdf_url=data.get('pdf_url'),
            keywords=data.get('keywords', []),
            citations=data.get('citations', []),
            references=data.get('references', []),
            metadata=data.get('metadata', {})
        )
        
        paper.created_at = data.get('created_at', time.time())
        paper.updated_at = data.get('updated_at', time.time())
        
        return paper


class ResearchTopic:
    """
    Represents a research topic in the system.
    """
    
    def __init__(self, topic_id: str, name: str, description: str,
               parent_topic: Optional[str] = None,
               related_topics: Optional[List[str]] = None,
               papers: Optional[List[str]] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a research topic.
        
        Args:
            topic_id: Unique identifier for the topic
            name: Topic name
            description: Topic description
            parent_topic: Optional ID of the parent topic
            related_topics: Optional list of related topic IDs
            papers: Optional list of paper IDs
            metadata: Optional topic metadata
        """
        self.id = topic_id
        self.name = name
        self.description = description
        self.parent_topic = parent_topic
        self.related_topics = related_topics or []
        self.papers = papers or []
        self.metadata = metadata or {}
        self.created_at = time.time()
        self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert topic to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parent_topic': self.parent_topic,
            'related_topics': self.related_topics,
            'papers': self.papers,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ResearchTopic':
        """
        Create a topic from a dictionary.
        
        Args:
            data: Topic data dictionary
        
        Returns:
            ResearchTopic instance
        """
        topic = cls(
            topic_id=data['id'],
            name=data['name'],
            description=data['description'],
            parent_topic=data.get('parent_topic'),
            related_topics=data.get('related_topics', []),
            papers=data.get('papers', []),
            metadata=data.get('metadata', {})
        )
        
        topic.created_at = data.get('created_at', time.time())
        topic.updated_at = data.get('updated_at', time.time())
        
        return topic


class CitationFormat(Enum):
    """Citation formats supported by the system."""
    APA = "apa"
    MLA = "mla"
    CHICAGO = "chicago"
    IEEE = "ieee"
    HARVARD = "harvard"
    BIBTEX = "bibtex"


class AcademicFramework:
    """
    Academic framework for research paper integration.
    
    This class provides:
    - Paper management and search
    - Citation tracking and generation
    - Research topic organization
    - Integration with external academic APIs
    """
    
    def __init__(self, storage_dir: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the academic framework.
        
        Args:
            storage_dir: Optional directory for persistent storage
            api_key: Optional API key for external academic services
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'academic_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Set up papers directory
        self.papers_dir = os.path.join(storage_dir, 'papers')
        os.makedirs(self.papers_dir, exist_ok=True)
        
        # Set up topics directory
        self.topics_dir = os.path.join(storage_dir, 'topics')
        os.makedirs(self.topics_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('academic_framework')
        
        # Initialize API key
        self.api_key = api_key
        
        # Initialize papers and topics
        self.papers = {}  # paper_id -> Paper
        self.topics = {}  # topic_id -> ResearchTopic
        
        # Initialize indices
        self.keyword_index = {}  # keyword -> Set[paper_id]
        self.author_index = {}  # author -> Set[paper_id]
        self.year_index = {}  # year -> Set[paper_id]
        self.topic_paper_index = {}  # topic_id -> Set[paper_id]
        self.paper_topic_index = {}  # paper_id -> Set[topic_id]
        
        # Load existing data
        self._load_data()
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load papers
        if os.path.exists(self.papers_dir):
            for filename in os.listdir(self.papers_dir):
                if filename.endswith('.json'):
                    paper_id = filename[:-5]  # Remove '.json'
                    paper_path = os.path.join(self.papers_dir, filename)
                    
                    try:
                        with open(paper_path, 'r') as f:
                            paper_data = json.load(f)
                        
                        paper = Paper.from_dict(paper_data)
                        self.papers[paper_id] = paper
                        
                        # Update indices
                        # Update keyword index
                        for keyword in paper.keywords:
                            if keyword not in self.keyword_index:
                                self.keyword_index[keyword] = set()
                            
                            self.keyword_index[keyword].add(paper_id)
                        
                        # Update author index
                        for author in paper.authors:
                            if author not in self.author_index:
                                self.author_index[author] = set()
                            
                            self.author_index[author].add(paper_id)
                        
                        # Update year index
                        try:
                            year = int(paper.publication_date.split('-')[0])
                            if year not in self.year_index:
                                self.year_index[year] = set()
                            
                            self.year_index[year].add(paper_id)
                        
                        except (ValueError, IndexError):
                            # Skip if publication date is not in the expected format
                            pass
                        
                        # Initialize paper-topic index
                        self.paper_topic_index[paper_id] = set()
                        
                        self.logger.info(f"Loaded paper: {paper.title} (ID: {paper_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading paper from {paper_path}: {e}")
        
        # Load topics
        if os.path.exists(self.topics_dir):
            for filename in os.listdir(self.topics_dir):
                if filename.endswith('.json'):
                    topic_id = filename[:-5]  # Remove '.json'
                    topic_path = os.path.join(self.topics_dir, filename)
                    
                    try:
                        with open(topic_path, 'r') as f:
                            topic_data = json.load(f)
                        
                        topic = ResearchTopic.from_dict(topic_data)
                        self.topics[topic_id] = topic
                        
                        # Update topic-paper index
                        self.topic_paper_index[topic_id] = set(topic.papers)
                        
                        # Update paper-topic index
                        for paper_id in topic.papers:
                            if paper_id in self.paper_topic_index:
                                self.paper_topic_index[paper_id].add(topic_id)
                        
                        self.logger.info(f"Loaded topic: {topic.name} (ID: {topic_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading topic from {topic_path}: {e}")
    
    def _save_paper(self, paper: Paper) -> None:
        """
        Save a paper to storage.
        
        Args:
            paper: Paper to save
        """
        paper_path = os.path.join(self.papers_dir, f"{paper.id}.json")
        
        with open(paper_path, 'w') as f:
            json.dump(paper.to_dict(), f, indent=2)
    
    def _save_topic(self, topic: ResearchTopic) -> None:
        """
        Save a topic to storage.
        
        Args:
            topic: Topic to save
        """
        topic_path = os.path.join(self.topics_dir, f"{topic.id}.json")
        
        with open(topic_path, 'w') as f:
            json.dump(topic.to_dict(), f, indent=2)
    
    def add_paper(self, title: str, authors: List[str], abstract: str,
                publication_date: str, paper_type: Union[str, PaperType] = PaperType.RESEARCH,
                venue: Optional[str] = None, doi: Optional[str] = None,
                url: Optional[str] = None, pdf_url: Optional[str] = None,
                keywords: Optional[List[str]] = None, references: Optional[List[str]] = None,
                metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a paper to the framework.
        
        Args:
            title: Paper title
            authors: List of author names
            abstract: Paper abstract
            publication_date: Publication date (ISO format: YYYY-MM-DD)
            paper_type: Type of paper
            venue: Optional publication venue
            doi: Optional DOI (Digital Object Identifier)
            url: Optional URL to the paper
            pdf_url: Optional URL to the PDF
            keywords: Optional list of keywords
            references: Optional list of papers referenced by this paper
            metadata: Optional paper metadata
            
        Returns:
            Paper ID
        """
        # Convert paper_type from string if needed
        if isinstance(paper_type, str):
            paper_type = PaperType(paper_type)
        
        # Generate paper ID
        paper_id = str(uuid.uuid4())
        
        # Create paper
        paper = Paper(
            paper_id=paper_id,
            title=title,
            authors=authors,
            abstract=abstract,
            publication_date=publication_date,
            paper_type=paper_type,
            venue=venue,
            doi=doi,
            url=url,
            pdf_url=pdf_url,
            keywords=keywords,
            references=references,
            metadata=metadata
        )
        
        # Add to framework
        self.papers[paper_id] = paper
        
        # Update indices
        # Update keyword index
        for keyword in paper.keywords:
            if keyword not in self.keyword_index:
                self.keyword_index[keyword] = set()
            
            self.keyword_index[keyword].add(paper_id)
        
        # Update author index
        for author in paper.authors:
            if author not in self.author_index:
                self.author_index[author] = set()
            
            self.author_index[author].add(paper_id)
        
        # Update year index
        try:
            year = int(publication_date.split('-')[0])
            if year not in self.year_index:
                self.year_index[year] = set()
            
            self.year_index[year].add(paper_id)
        
        except (ValueError, IndexError):
            # Skip if publication date is not in the expected format
            pass
        
        # Initialize paper-topic index
        self.paper_topic_index[paper_id] = set()
        
        # Update reference papers' citations
        if references:
            for ref_id in references:
                if ref_id in self.papers:
                    if paper_id not in self.papers[ref_id].citations:
                        self.papers[ref_id].citations.append(paper_id)
                        self.papers[ref_id].updated_at = time.time()
                        self._save_paper(self.papers[ref_id])
        
        # Save to storage
        self._save_paper(paper)
        
        self.logger.info(f"Added paper: {title} (ID: {paper_id})")
        return paper_id
    
    def update_paper(self, paper_id: str, title: Optional[str] = None,
                  authors: Optional[List[str]] = None, abstract: Optional[str] = None,
                  publication_date: Optional[str] = None,
                  paper_type: Optional[Union[str, PaperType]] = None,
                  venue: Optional[str] = None, doi: Optional[str] = None,
                  url: Optional[str] = None, pdf_url: Optional[str] = None,
                  keywords: Optional[List[str]] = None, references: Optional[List[str]] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update a paper in the framework.
        
        Args:
            paper_id: ID of the paper to update
            title: Optional new title
            authors: Optional new list of author names
            abstract: Optional new abstract
            publication_date: Optional new publication date
            paper_type: Optional new type of paper
            venue: Optional new publication venue
            doi: Optional new DOI
            url: Optional new URL
            pdf_url: Optional new PDF URL
            keywords: Optional new list of keywords
            references: Optional new list of references
            metadata: Optional new metadata (will be merged)
            
        Returns:
            Update success
        """
        if paper_id not in self.papers:
            return False
        
        paper = self.papers[paper_id]
        old_keywords = paper.keywords.copy()
        old_authors = paper.authors.copy()
        old_references = paper.references.copy()
        old_year = None
        
        try:
            old_year = int(paper.publication_date.split('-')[0])
        except (ValueError, IndexError):
            pass
        
        # Update fields
        if title is not None:
            paper.title = title
        
        if authors is not None:
            paper.authors = authors
        
        if abstract is not None:
            paper.abstract = abstract
        
        if publication_date is not None:
            paper.publication_date = publication_date
        
        if paper_type is not None:
            # Convert from string if needed
            if isinstance(paper_type, str):
                paper_type = PaperType(paper_type)
            
            paper.paper_type = paper_type
        
        if venue is not None:
            paper.venue = venue
        
        if doi is not None:
            paper.doi = doi
        
        if url is not None:
            paper.url = url
        
        if pdf_url is not None:
            paper.pdf_url = pdf_url
        
        if keywords is not None:
            paper.keywords = keywords
        
        if references is not None:
            paper.references = references
        
        if metadata is not None:
            paper.metadata.update(metadata)
        
        # Update timestamp
        paper.updated_at = time.time()
        
        # Update indices if necessary
        # Update keyword index
        if keywords is not None:
            # Remove old keywords from index
            for keyword in old_keywords:
                if keyword in self.keyword_index:
                    self.keyword_index[keyword].discard(paper_id)
            
            # Add new keywords to index
            for keyword in paper.keywords:
                if keyword not in self.keyword_index:
                    self.keyword_index[keyword] = set()
                
                self.keyword_index[keyword].add(paper_id)
        
        # Update author index
        if authors is not None:
            # Remove old authors from index
            for author in old_authors:
                if author in self.author_index:
                    self.author_index[author].discard(paper_id)
            
            # Add new authors to index
            for author in paper.authors:
                if author not in self.author_index:
                    self.author_index[author] = set()
                
                self.author_index[author].add(paper_id)
        
        # Update year index
        if publication_date is not None:
            # Remove from old year index
            if old_year is not None and old_year in self.year_index:
                self.year_index[old_year].discard(paper_id)
            
            # Add to new year index
            try:
                new_year = int(publication_date.split('-')[0])
                if new_year not in self.year_index:
                    self.year_index[new_year] = set()
                
                self.year_index[new_year].add(paper_id)
            
            except (ValueError, IndexError):
                # Skip if publication date is not in the expected format
                pass
        
        # Update reference papers' citations
        if references is not None:
            # Remove from old reference papers' citations
            for ref_id in old_references:
                if ref_id in self.papers and paper_id in self.papers[ref_id].citations:
                    self.papers[ref_id].citations.remove(paper_id)
                    self.papers[ref_id].updated_at = time.time()
                    self._save_paper(self.papers[ref_id])
            
            # Add to new reference papers' citations
            for ref_id in paper.references:
                if ref_id in self.papers and paper_id not in self.papers[ref_id].citations:
                    self.papers[ref_id].citations.append(paper_id)
                    self.papers[ref_id].updated_at = time.time()
                    self._save_paper(self.papers[ref_id])
        
        # Save to storage
        self._save_paper(paper)
        
        self.logger.info(f"Updated paper: {paper.title} (ID: {paper_id})")
        return True
    
    def remove_paper(self, paper_id: str) -> bool:
        """
        Remove a paper from the framework.
        
        Args:
            paper_id: ID of the paper to remove
            
        Returns:
            Removal success
        """
        if paper_id not in self.papers:
            return False
        
        paper = self.papers[paper_id]
        
        # Update indices
        # Update keyword index
        for keyword in paper.keywords:
            if keyword in self.keyword_index:
                self.keyword_index[keyword].discard(paper_id)
        
        # Update author index
        for author in paper.authors:
            if author in self.author_index:
                self.author_index[author].discard(paper_id)
        
        # Update year index
        try:
            year = int(paper.publication_date.split('-')[0])
            if year in self.year_index:
                self.year_index[year].discard(paper_id)
        
        except (ValueError, IndexError):
            pass
        
        # Update reference papers' citations
        for ref_id in paper.references:
            if ref_id in self.papers and paper_id in self.papers[ref_id].citations:
                self.papers[ref_id].citations.remove(paper_id)
                self.papers[ref_id].updated_at = time.time()
                self._save_paper(self.papers[ref_id])
        
        # Update citation papers' references
        for citing_id in paper.citations:
            if citing_id in self.papers and paper_id in self.papers[citing_id].references:
                self.papers[citing_id].references.remove(paper_id)
                self.papers[citing_id].updated_at = time.time()
                self._save_paper(self.papers[citing_id])
        
        # Update paper-topic index
        if paper_id in self.paper_topic_index:
            # Get topics for this paper
            topics = self.paper_topic_index[paper_id].copy()
            
            # Remove paper from topics
            for topic_id in topics:
                if topic_id in self.topics:
                    if paper_id in self.topics[topic_id].papers:
                        self.topics[topic_id].papers.remove(paper_id)
                        self.topics[topic_id].updated_at = time.time()
                        self._save_topic(self.topics[topic_id])
                    
                    if topic_id in self.topic_paper_index:
                        self.topic_paper_index[topic_id].discard(paper_id)
            
            # Remove from paper-topic index
            del self.paper_topic_index[paper_id]
        
        # Remove from papers
        del self.papers[paper_id]
        
        # Remove from storage
        paper_path = os.path.join(self.papers_dir, f"{paper_id}.json")
        if os.path.exists(paper_path):
            os.remove(paper_path)
        
        self.logger.info(f"Removed paper: {paper.title} (ID: {paper_id})")
        return True
    
    def add_topic(self, name: str, description: str,
                parent_topic: Optional[str] = None,
                related_topics: Optional[List[str]] = None,
                papers: Optional[List[str]] = None,
                metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a research topic to the framework.
        
        Args:
            name: Topic name
            description: Topic description
            parent_topic: Optional ID of the parent topic
            related_topics: Optional list of related topic IDs
            papers: Optional list of paper IDs
            metadata: Optional topic metadata
            
        Returns:
            Topic ID
        """
        # Validate parent topic
        if parent_topic is not None and parent_topic not in self.topics:
            parent_topic = None
        
        # Validate related topics
        if related_topics is not None:
            related_topics = [topic_id for topic_id in related_topics if topic_id in self.topics]
        
        # Validate papers
        if papers is not None:
            papers = [paper_id for paper_id in papers if paper_id in self.papers]
        else:
            papers = []
        
        # Generate topic ID
        topic_id = str(uuid.uuid4())
        
        # Create topic
        topic = ResearchTopic(
            topic_id=topic_id,
            name=name,
            description=description,
            parent_topic=parent_topic,
            related_topics=related_topics,
            papers=papers,
            metadata=metadata
        )
        
        # Add to framework
        self.topics[topic_id] = topic
        
        # Update topic-paper index
        self.topic_paper_index[topic_id] = set(papers)
        
        # Update paper-topic index
        for paper_id in papers:
            if paper_id not in self.paper_topic_index:
                self.paper_topic_index[paper_id] = set()
            
            self.paper_topic_index[paper_id].add(topic_id)
        
        # Save to storage
        self._save_topic(topic)
        
        self.logger.info(f"Added topic: {name} (ID: {topic_id})")
        return topic_id
    
    def update_topic(self, topic_id: str, name: Optional[str] = None,
                  description: Optional[str] = None,
                  parent_topic: Optional[str] = None,
                  related_topics: Optional[List[str]] = None,
                  papers: Optional[List[str]] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update a research topic in the framework.
        
        Args:
            topic_id: ID of the topic to update
            name: Optional new name
            description: Optional new description
            parent_topic: Optional new parent topic ID
            related_topics: Optional new list of related topic IDs
            papers: Optional new list of paper IDs
            metadata: Optional new metadata (will be merged)
            
        Returns:
            Update success
        """
        if topic_id not in self.topics:
            return False
        
        topic = self.topics[topic_id]
        old_papers = topic.papers.copy()
        
        # Update fields
        if name is not None:
            topic.name = name
        
        if description is not None:
            topic.description = description
        
        if parent_topic is not None:
            # Validate parent topic
            if parent_topic not in self.topics or parent_topic == topic_id:
                parent_topic = None
            
            topic.parent_topic = parent_topic
        
        if related_topics is not None:
            # Validate related topics
            validated_topics = []
            for related_id in related_topics:
                if related_id in self.topics and related_id != topic_id:
                    validated_topics.append(related_id)
            
            topic.related_topics = validated_topics
        
        if papers is not None:
            # Validate papers
            validated_papers = [paper_id for paper_id in papers if paper_id in self.papers]
            topic.papers = validated_papers
        
        if metadata is not None:
            topic.metadata.update(metadata)
        
        # Update timestamp
        topic.updated_at = time.time()
        
        # Update topic-paper index if papers changed
        if papers is not None:
            # Update topic-paper index
            self.topic_paper_index[topic_id] = set(topic.papers)
            
            # Update paper-topic index
            # Remove topic from old papers
            for paper_id in old_papers:
                if paper_id in self.paper_topic_index:
                    self.paper_topic_index[paper_id].discard(topic_id)
            
            # Add topic to new papers
            for paper_id in topic.papers:
                if paper_id not in self.paper_topic_index:
                    self.paper_topic_index[paper_id] = set()
                
                self.paper_topic_index[paper_id].add(topic_id)
        
        # Save to storage
        self._save_topic(topic)
        
        self.logger.info(f"Updated topic: {topic.name} (ID: {topic_id})")
        return True
    
    def remove_topic(self, topic_id: str) -> bool:
        """
        Remove a research topic from the framework.
        
        Args:
            topic_id: ID of the topic to remove
            
        Returns:
            Removal success
        """
        if topic_id not in self.topics:
            return False
        
        topic = self.topics[topic_id]
        
        # Update related topics
        for related_id in topic.related_topics:
            if related_id in self.topics:
                if topic_id in self.topics[related_id].related_topics:
                    self.topics[related_id].related_topics.remove(topic_id)
                    self.topics[related_id].updated_at = time.time()
                    self._save_topic(self.topics[related_id])
        
        # Update parent-child relationships
        for other_id, other_topic in self.topics.items():
            if other_topic.parent_topic == topic_id:
                other_topic.parent_topic = topic.parent_topic  # Move children up to parent
                other_topic.updated_at = time.time()
                self._save_topic(other_topic)
        
        # Update paper-topic index
        for paper_id in topic.papers:
            if paper_id in self.paper_topic_index:
                self.paper_topic_index[paper_id].discard(topic_id)
        
        # Update topic-paper index
        if topic_id in self.topic_paper_index:
            del self.topic_paper_index[topic_id]
        
        # Remove from topics
        del self.topics[topic_id]
        
        # Remove from storage
        topic_path = os.path.join(self.topics_dir, f"{topic_id}.json")
        if os.path.exists(topic_path):
            os.remove(topic_path)
        
        self.logger.info(f"Removed topic: {topic.name} (ID: {topic_id})")
        return True
    
    def get_paper(self, paper_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a paper by ID.
        
        Args:
            paper_id: ID of the paper
            
        Returns:
            Paper data dictionary or None if not found
        """
        if paper_id not in self.papers:
            return None
        
        paper = self.papers[paper_id]
        
        # Get paper data
        paper_data = paper.to_dict()
        
        # Add topics
        if paper_id in self.paper_topic_index:
            topic_ids = list(self.paper_topic_index[paper_id])
            topics = []
            
            for topic_id in topic_ids:
                if topic_id in self.topics:
                    topics.append({
                        'id': topic_id,
                        'name': self.topics[topic_id].name
                    })
            
            paper_data['topics'] = topics
        else:
            paper_data['topics'] = []
        
        return paper_data
    
    def get_topic(self, topic_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a topic by ID.
        
        Args:
            topic_id: ID of the topic
            
        Returns:
            Topic data dictionary or None if not found
        """
        if topic_id not in self.topics:
            return None
        
        topic = self.topics[topic_id]
        
        # Get topic data
        topic_data = topic.to_dict()
        
        # Add paper details
        paper_details = []
        for paper_id in topic.papers:
            if paper_id in self.papers:
                paper = self.papers[paper_id]
                paper_details.append({
                    'id': paper_id,
                    'title': paper.title,
                    'authors': paper.authors,
                    'publication_date': paper.publication_date
                })
        
        topic_data['paper_details'] = paper_details
        
        # Add parent topic details
        if topic.parent_topic and topic.parent_topic in self.topics:
            parent = self.topics[topic.parent_topic]
            topic_data['parent_topic_details'] = {
                'id': parent.id,
                'name': parent.name
            }
        else:
            topic_data['parent_topic_details'] = None
        
        # Add related topic details
        related_topic_details = []
        for related_id in topic.related_topics:
            if related_id in self.topics:
                related = self.topics[related_id]
                related_topic_details.append({
                    'id': related.id,
                    'name': related.name
                })
        
        topic_data['related_topic_details'] = related_topic_details
        
        return topic_data
    
    def search_papers(self, query: str, keywords: Optional[List[str]] = None,
                   authors: Optional[List[str]] = None,
                   year_range: Optional[Tuple[int, int]] = None,
                   paper_type: Optional[Union[str, PaperType]] = None,
                   topic_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for papers based on various criteria.
        
        Args:
            query: Search query (matches title and abstract)
            keywords: Optional list of keywords to filter by
            authors: Optional list of authors to filter by
            year_range: Optional (start_year, end_year) tuple
            paper_type: Optional paper type to filter by
            topic_id: Optional topic ID to filter by
            
        Returns:
            List of matching paper data dictionaries
        """
        # Convert paper_type from string if needed
        if isinstance(paper_type, str):
            paper_type = PaperType(paper_type)
        
        # Initialize result set
        result_ids = set(self.papers.keys())
        
        # Filter by query
        if query:
            query = query.lower()
            query_matches = set()
            
            for paper_id, paper in self.papers.items():
                if (query in paper.title.lower() or
                    query in paper.abstract.lower() or
                    any(query in keyword.lower() for keyword in paper.keywords)):
                    query_matches.add(paper_id)
            
            result_ids &= query_matches
        
        # Filter by keywords
        if keywords:
            keyword_matches = set()
            
            for keyword in keywords:
                if keyword in self.keyword_index:
                    keyword_matches.update(self.keyword_index[keyword])
            
            result_ids &= keyword_matches
        
        # Filter by authors
        if authors:
            author_matches = set()
            
            for author in authors:
                if author in self.author_index:
                    author_matches.update(self.author_index[author])
            
            result_ids &= author_matches
        
        # Filter by year range
        if year_range:
            start_year, end_year = year_range
            year_matches = set()
            
            for year in range(start_year, end_year + 1):
                if year in self.year_index:
                    year_matches.update(self.year_index[year])
            
            result_ids &= year_matches
        
        # Filter by paper type
        if paper_type:
            type_matches = set()
            
            for paper_id, paper in self.papers.items():
                if paper.paper_type == paper_type:
                    type_matches.add(paper_id)
            
            result_ids &= type_matches
        
        # Filter by topic
        if topic_id and topic_id in self.topic_paper_index:
            result_ids &= self.topic_paper_index[topic_id]
        
        # Convert to list of dictionaries
        results = []
        
        for paper_id in result_ids:
            paper = self.papers[paper_id]
            
            # Get paper data
            paper_data = paper.to_dict()
            
            # Add topics
            if paper_id in self.paper_topic_index:
                topic_ids = list(self.paper_topic_index[paper_id])
                topics = []
                
                for topic_id in topic_ids:
                    if topic_id in self.topics:
                        topics.append({
                            'id': topic_id,
                            'name': self.topics[topic_id].name
                        })
                
                paper_data['topics'] = topics
            else:
                paper_data['topics'] = []
            
            results.append(paper_data)
        
        # Sort by publication date (newest first)
        results.sort(key=lambda x: x['publication_date'], reverse=True)
        
        return results
    
    def search_topics(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for topics based on a query.
        
        Args:
            query: Search query
            
        Returns:
            List of matching topic data dictionaries
        """
        query = query.lower()
        results = []
        
        for topic_id, topic in self.topics.items():
            if query in topic.name.lower() or query in topic.description.lower():
                # Get topic data
                topic_data = topic.to_dict()
                
                # Add paper count
                topic_data['paper_count'] = len(topic.papers)
                
                # Add parent topic details
                if topic.parent_topic and topic.parent_topic in self.topics:
                    parent = self.topics[topic.parent_topic]
                    topic_data['parent_topic_details'] = {
                        'id': parent.id,
                        'name': parent.name
                    }
                else:
                    topic_data['parent_topic_details'] = None
                
                results.append(topic_data)
        
        return results
    
    def get_topic_hierarchy(self) -> Dict[str, Any]:
        """
        Get the complete topic hierarchy.
        
        Returns:
            Dictionary representing the topic hierarchy
        """
        # Find all root topics (topics without a parent)
        root_topics = []
        
        for topic_id, topic in self.topics.items():
            if not topic.parent_topic:
                root_topics.append(topic_id)
        
        # Build hierarchy recursively
        def build_tree(topic_id: str) -> Dict[str, Any]:
            topic = self.topics[topic_id]
            
            return {
                'id': topic_id,
                'name': topic.name,
                'paper_count': len(topic.papers),
                'children': [
                    build_tree(child_id)
                    for child_id, child in self.topics.items()
                    if child.parent_topic == topic_id
                ]
            }
        
        # Build trees for all root topics
        forest = [build_tree(root_id) for root_id in root_topics]
        
        return {
            'topics': forest,
            'total_topics': len(self.topics)
        }
    
    def get_paper_citations(self, paper_id: str) -> Dict[str, Any]:
        """
        Get citations for a paper.
        
        Args:
            paper_id: ID of the paper
            
        Returns:
            Dictionary with citation information
        """
        if paper_id not in self.papers:
            return {'error': 'Paper not found'}
        
        paper = self.papers[paper_id]
        
        # Get citation papers
        citing_papers = []
        
        for citing_id in paper.citations:
            if citing_id in self.papers:
                citing = self.papers[citing_id]
                citing_papers.append({
                    'id': citing_id,
                    'title': citing.title,
                    'authors': citing.authors,
                    'publication_date': citing.publication_date,
                    'venue': citing.venue
                })
        
        # Get reference papers
        reference_papers = []
        
        for ref_id in paper.references:
            if ref_id in self.papers:
                ref = self.papers[ref_id]
                reference_papers.append({
                    'id': ref_id,
                    'title': ref.title,
                    'authors': ref.authors,
                    'publication_date': ref.publication_date,
                    'venue': ref.venue
                })
        
        return {
            'paper_id': paper_id,
            'title': paper.title,
            'citation_count': len(paper.citations),
            'reference_count': len(paper.references),
            'citing_papers': citing_papers,
            'reference_papers': reference_papers
        }
    
    def generate_citation(self, paper_id: str, format: Union[str, CitationFormat] = CitationFormat.APA) -> Optional[str]:
        """
        Generate a citation for a paper in the specified format.
        
        Args:
            paper_id: ID of the paper
            format: Citation format
            
        Returns:
            Citation string or None if paper not found
        """
        if paper_id not in self.papers:
            return None
        
        # Convert format from string if needed
        if isinstance(format, str):
            format = CitationFormat(format)
        
        paper = self.papers[paper_id]
        
        if format == CitationFormat.APA:
            # APA format: Author, A. A., & Author, B. B. (Year). Title of the paper. Journal Name, Volume(Issue), Pages. DOI
            authors_str = ""
            if paper.authors:
                if len(paper.authors) == 1:
                    authors_str = self._format_author_apa(paper.authors[0])
                elif len(paper.authors) == 2:
                    authors_str = f"{self._format_author_apa(paper.authors[0])} & {self._format_author_apa(paper.authors[1])}"
                else:
                    authors_list = [self._format_author_apa(author) for author in paper.authors[:-1]]
                    authors_str = f"{', '.join(authors_list)}, & {self._format_author_apa(paper.authors[-1])}"
            
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            citation = f"{authors_str} ({year}). {paper.title}."
            
            if paper.venue:
                citation += f" {paper.venue}."
            
            if paper.doi:
                citation += f" https://doi.org/{paper.doi}"
            
            return citation
        
        elif format == CitationFormat.MLA:
            # MLA format: Author, First Name. "Title of the Paper." Journal Name, Volume, Issue, Year, Pages. DOI
            authors_str = ""
            if paper.authors:
                if len(paper.authors) == 1:
                    authors_str = self._format_author_mla(paper.authors[0])
                elif len(paper.authors) == 2:
                    authors_str = f"{self._format_author_mla(paper.authors[0])} and {self._format_author_mla(paper.authors[1])}"
                else:
                    authors_str = f"{self._format_author_mla(paper.authors[0])} et al."
            
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            citation = f"{authors_str}. \"{paper.title}\"."
            
            if paper.venue:
                citation += f" {paper.venue}, {year}."
            else:
                citation += f" {year}."
            
            if paper.doi:
                citation += f" https://doi.org/{paper.doi}"
            
            return citation
        
        elif format == CitationFormat.CHICAGO:
            # Chicago format: Author, First Name. "Title of the Paper." Journal Name Volume, no. Issue (Year): Pages. DOI
            authors_str = ""
            if paper.authors:
                if len(paper.authors) == 1:
                    authors_str = self._format_author_chicago(paper.authors[0])
                elif len(paper.authors) > 1:
                    authors_list = [self._format_author_chicago(author) for author in paper.authors]
                    authors_str = ", ".join(authors_list)
            
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            citation = f"{authors_str}. \"{paper.title}\"."
            
            if paper.venue:
                citation += f" {paper.venue} ({year})."
            else:
                citation += f" {year}."
            
            if paper.doi:
                citation += f" https://doi.org/{paper.doi}"
            
            return citation
        
        elif format == CitationFormat.IEEE:
            # IEEE format: [1] A. A. Author and B. B. Author, "Title of the paper," Journal Name, vol. Volume, no. Issue, pp. Pages, Year. DOI
            authors_str = ""
            if paper.authors:
                authors_list = [self._format_author_ieee(author) for author in paper.authors]
                authors_str = ", ".join(authors_list)
            
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            citation = f"{authors_str}, \"{paper.title}\","
            
            if paper.venue:
                citation += f" {paper.venue}, {year}."
            else:
                citation += f" {year}."
            
            if paper.doi:
                citation += f" https://doi.org/{paper.doi}"
            
            return citation
        
        elif format == CitationFormat.HARVARD:
            # Harvard format: Author, A. and Author, B. (Year) 'Title of the paper', Journal Name, Volume(Issue), pp. Pages. DOI
            authors_str = ""
            if paper.authors:
                if len(paper.authors) == 1:
                    authors_str = self._format_author_harvard(paper.authors[0])
                elif len(paper.authors) == 2:
                    authors_str = f"{self._format_author_harvard(paper.authors[0])} and {self._format_author_harvard(paper.authors[1])}"
                else:
                    authors_list = [self._format_author_harvard(author) for author in paper.authors[:-1]]
                    authors_str = f"{', '.join(authors_list)} and {self._format_author_harvard(paper.authors[-1])}"
            
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            citation = f"{authors_str} ({year}) '{paper.title}'."
            
            if paper.venue:
                citation += f" {paper.venue}."
            
            if paper.doi:
                citation += f" https://doi.org/{paper.doi}"
            
            return citation
        
        elif format == CitationFormat.BIBTEX:
            # BibTeX format
            year = paper.publication_date.split('-')[0] if '-' in paper.publication_date else paper.publication_date
            
            # Generate a key based on first author's last name and year
            key = "paper"
            if paper.authors:
                key = f"{paper.authors[0].split()[-1].lower()}{year}"
            
            bibtex = f"@article{{{key},\n"
            bibtex += f"  title = {{{paper.title}}},\n"
            
            if paper.authors:
                authors_str = " and ".join(paper.authors)
                bibtex += f"  author = {{{authors_str}}},\n"
            
            bibtex += f"  year = {{{year}}},\n"
            
            if paper.venue:
                bibtex += f"  journal = {{{paper.venue}}},\n"
            
            if paper.doi:
                bibtex += f"  doi = {{{paper.doi}}},\n"
            
            if paper.url:
                bibtex += f"  url = {{{paper.url}}},\n"
            
            bibtex += "}"
            
            return bibtex
        
        return None
    
    def _format_author_apa(self, author: str) -> str:
        """Format an author name for APA citation."""
        parts = author.split()
        if len(parts) == 1:
            return author
        
        last_name = parts[-1]
        initials = "".join(f"{p[0]}." for p in parts[:-1])
        
        return f"{last_name}, {initials}"
    
    def _format_author_mla(self, author: str) -> str:
        """Format an author name for MLA citation."""
        parts = author.split()
        if len(parts) == 1:
            return author
        
        last_name = parts[-1]
        first_name = " ".join(parts[:-1])
        
        return f"{last_name}, {first_name}"
    
    def _format_author_chicago(self, author: str) -> str:
        """Format an author name for Chicago citation."""
        parts = author.split()
        if len(parts) == 1:
            return author
        
        last_name = parts[-1]
        first_name = " ".join(parts[:-1])
        
        return f"{last_name}, {first_name}"
    
    def _format_author_ieee(self, author: str) -> str:
        """Format an author name for IEEE citation."""
        parts = author.split()
        if len(parts) == 1:
            return author
        
        last_name = parts[-1]
        initials = "".join(f"{p[0]}." for p in parts[:-1])
        
        return f"{initials} {last_name}"
    
    def _format_author_harvard(self, author: str) -> str:
        """Format an author name for Harvard citation."""
        parts = author.split()
        if len(parts) == 1:
            return author
        
        last_name = parts[-1]
        initials = "".join(f"{p[0]}." for p in parts[:-1])
        
        return f"{last_name}, {initials}"
    
    def fetch_paper_by_doi(self, doi: str) -> Optional[str]:
        """
        Fetch a paper from external sources by DOI.
        
        Args:
            doi: DOI of the paper
            
        Returns:
            Paper ID if found and added, None otherwise
        """
        if not self.api_key:
            self.logger.warning("No API key provided for external academic services")
            return None
        
        try:
            # Check if paper already exists
            for paper_id, paper in self.papers.items():
                if paper.doi == doi:
                    return paper_id
            
            # Fetch paper data from external API
            # This is a placeholder for actual API calls to services like Semantic Scholar, CrossRef, or DOI.org
            
            # Simulate a paper fetch
            paper_data = self._fetch_paper_data_from_doi(doi)
            
            if not paper_data:
                return None
            
            # Add paper to framework
            paper_id = self.add_paper(
                title=paper_data['title'],
                authors=paper_data['authors'],
                abstract=paper_data['abstract'],
                publication_date=paper_data['publication_date'],
                paper_type=PaperType.RESEARCH,
                venue=paper_data.get('venue'),
                doi=doi,
                url=paper_data.get('url'),
                pdf_url=paper_data.get('pdf_url'),
                keywords=paper_data.get('keywords'),
                references=paper_data.get('references'),
                metadata=paper_data.get('metadata')
            )
            
            return paper_id
        
        except Exception as e:
            self.logger.error(f"Error fetching paper with DOI {doi}: {e}")
            return None
    
    def _fetch_paper_data_from_doi(self, doi: str) -> Optional[Dict[str, Any]]:
        """
        Fetch paper data from a DOI using external APIs.
        
        Args:
            doi: DOI to fetch
            
        Returns:
            Paper data dictionary or None if not found
        """
        # This is a placeholder for actual API integration
        # In a real implementation, you would call APIs like:
        # - Semantic Scholar API
        # - CrossRef API
        # - DOI.org API
        
        try:
            # Example using CrossRef API
            headers = {
                'User-Agent': 'CodeDeepDiveAnalyzer/1.0 (https://example.com; mailto:example@example.com)'
            }
            
            response = requests.get(f"https://api.crossref.org/works/{doi}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'message' in data:
                    message = data['message']
                    
                    # Extract data
                    title = message.get('title', ['Unknown Title'])[0]
                    
                    authors = []
                    for author in message.get('author', []):
                        if 'given' in author and 'family' in author:
                            authors.append(f"{author['given']} {author['family']}")
                        elif 'family' in author:
                            authors.append(author['family'])
                    
                    abstract = message.get('abstract', 'No abstract available')
                    
                    publication_date = 'Unknown'
                    if 'published-print' in message and 'date-parts' in message['published-print']:
                        date_parts = message['published-print']['date-parts'][0]
                        if len(date_parts) >= 3:
                            publication_date = f"{date_parts[0]}-{date_parts[1]:02d}-{date_parts[2]:02d}"
                        elif len(date_parts) >= 1:
                            publication_date = f"{date_parts[0]}"
                    
                    venue = None
                    if 'container-title' in message and message['container-title']:
                        venue = message['container-title'][0]
                    
                    url = message.get('URL')
                    
                    return {
                        'title': title,
                        'authors': authors,
                        'abstract': abstract,
                        'publication_date': publication_date,
                        'venue': venue,
                        'url': url,
                        'pdf_url': None,
                        'keywords': [],
                        'references': [],
                        'metadata': {
                            'crossref': message
                        }
                    }
            
            return None
        
        except Exception as e:
            self.logger.error(f"Error in _fetch_paper_data_from_doi: {e}")
            return None
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the academic framework.
        
        Returns:
            Dictionary of statistics
        """
        # Count papers by type
        paper_type_counts = {}
        for paper in self.papers.values():
            paper_type = paper.paper_type.value
            paper_type_counts[paper_type] = paper_type_counts.get(paper_type, 0) + 1
        
        # Count papers by year
        paper_year_counts = {}
        for paper in self.papers.values():
            try:
                year = int(paper.publication_date.split('-')[0])
                paper_year_counts[year] = paper_year_counts.get(year, 0) + 1
            except (ValueError, IndexError):
                pass
        
        # Get top authors
        author_paper_counts = {}
        for author, paper_ids in self.author_index.items():
            author_paper_counts[author] = len(paper_ids)
        
        top_authors = sorted(
            author_paper_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # Get top keywords
        keyword_paper_counts = {}
        for keyword, paper_ids in self.keyword_index.items():
            keyword_paper_counts[keyword] = len(paper_ids)
        
        top_keywords = sorted(
            keyword_paper_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]
        
        # Get citation statistics
        citation_counts = []
        reference_counts = []
        
        for paper in self.papers.values():
            citation_counts.append(len(paper.citations))
            reference_counts.append(len(paper.references))
        
        avg_citations = sum(citation_counts) / len(citation_counts) if citation_counts else 0
        avg_references = sum(reference_counts) / len(reference_counts) if reference_counts else 0
        
        max_citations = max(citation_counts) if citation_counts else 0
        max_references = max(reference_counts) if reference_counts else 0
        
        # Get most cited papers
        most_cited_papers = []
        
        for paper_id, paper in self.papers.items():
            most_cited_papers.append((paper_id, paper, len(paper.citations)))
        
        most_cited_papers.sort(key=lambda x: x[2], reverse=True)
        
        most_cited_paper_details = []
        for paper_id, paper, citation_count in most_cited_papers[:10]:
            most_cited_paper_details.append({
                'id': paper_id,
                'title': paper.title,
                'authors': paper.authors,
                'publication_date': paper.publication_date,
                'citation_count': citation_count
            })
        
        return {
            'paper_count': len(self.papers),
            'topic_count': len(self.topics),
            'paper_type_counts': paper_type_counts,
            'paper_year_counts': paper_year_counts,
            'top_authors': [{'name': author, 'paper_count': count} for author, count in top_authors],
            'top_keywords': [{'keyword': keyword, 'paper_count': count} for keyword, count in top_keywords],
            'citation_statistics': {
                'average_citations': avg_citations,
                'average_references': avg_references,
                'max_citations': max_citations,
                'max_references': max_references
            },
            'most_cited_papers': most_cited_paper_details
        }