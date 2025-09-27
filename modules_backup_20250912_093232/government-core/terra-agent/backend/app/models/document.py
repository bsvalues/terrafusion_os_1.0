"""
Document Model - Knowledge base documents for RAG functionality
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text, nullable=False)
    document_type = Column(String(50))  # 'policy', 'procedure', 'law', 'guideline'
    source_url = Column(String(255))
    published_date = Column(DateTime)
    vector_id = Column(String(100))  # For vector database integration
    embedding_model = Column(String(100))  # Model used for embeddings
    category = Column(String(100))  # Assessment, taxation, compliance, etc.
    tags = Column(Text)  # Comma-separated tags
    author = Column(String(255))
    version = Column(String(20))
    status = Column(String(20), default='active')  # active, archived, draft
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def get_tags_list(self):
        """Get tags as a list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []
    
    def set_tags_list(self, tags_list):
        """Set tags from a list"""
        if tags_list:
            self.tags = ', '.join(tags_list)
        else:
            self.tags = None
    
    def get_content_preview(self, length=200):
        """Get a preview of the document content"""
        if len(self.content) <= length:
            return self.content
        return self.content[:length] + "..."
    
    def to_dict(self):
        """Convert document to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'content': self.content,
            'content_preview': self.get_content_preview(),
            'document_type': self.document_type,
            'source_url': self.source_url,
            'published_date': self.published_date.isoformat() if self.published_date else None,
            'vector_id': self.vector_id,
            'embedding_model': self.embedding_model,
            'category': self.category,
            'tags': self.get_tags_list(),
            'author': self.author,
            'version': self.version,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Document {self.title}: {self.document_type}>'
