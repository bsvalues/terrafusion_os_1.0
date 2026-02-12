import os
import logging
import datetime
from models import Document, db
from app import app
import trafilatura

# Get logger
logger = logging.getLogger("pacs_assistant")

def extract_text_from_url(url):
    """
    Extract main text content from a URL using trafilatura.
    
    Args:
        url (str): URL to scrape
        
    Returns:
        str: Extracted text content
    """
    try:
        # Send a request to the website
        downloaded = trafilatura.fetch_url(url)
        
        if not downloaded:
            logger.error(f"Failed to download content from URL: {url}")
            return None
            
        # Extract main content
        text = trafilatura.extract(downloaded)
        
        if not text:
            logger.warning(f"No content extracted from URL: {url}")
            return None
            
        logger.info(f"Successfully extracted {len(text)} characters from URL: {url}")
        return text
        
    except Exception as e:
        logger.error(f"Error extracting text from URL: {str(e)}")
        return None

def process_document(title, content, document_type="webpage", source_url=None, description=None):
    """
    Process document content and store it in the database.
    
    Args:
        title (str): Document title
        content (str): Document content text
        document_type (str): Type of document (webpage, report, regulation, etc.)
        source_url (str): Source URL of the document
        description (str): Brief description of the document
        
    Returns:
        Document: Created document object
    """
    try:
        # Create document entry
        with app.app_context():
            # Check if document with same source_url already exists
            if source_url:
                existing_doc = Document.query.filter_by(source_url=source_url).first()
                if existing_doc:
                    logger.info(f"Updating existing document from {source_url}")
                    # Update existing document
                    existing_doc.title = title
                    existing_doc.content = content
                    existing_doc.description = description
                    existing_doc.document_type = document_type
                    existing_doc.updated_at = datetime.datetime.utcnow()
                    db.session.commit()
                    return existing_doc
            
            # Create new document
            document = Document(
                title=title,
                content=content,
                document_type=document_type,
                source_url=source_url,
                description=description,
                published_date=datetime.datetime.utcnow(),
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow()
            )
            
            db.session.add(document)
            db.session.commit()
            
            logger.info(f"Document stored in database: {title} (ID: {document.id})")
            return document
            
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return None

def process_document_from_url(url, title=None, document_type="webpage", description=None):
    """
    Process a document from a URL and store it in the database.
    
    Args:
        url (str): URL to process
        title (str): Document title (if None, will be extracted or use URL)
        document_type (str): Type of document (webpage, report, regulation, etc.)
        description (str): Brief description of the document
        
    Returns:
        Document: Created document object or None if processing failed
    """
    try:
        # Extract content from URL
        content = extract_text_from_url(url)
        
        if not content:
            logger.error(f"No content extracted from URL: {url}")
            return None
            
        # If no title provided, try to extract from URL
        if not title:
            # Try to get title from URL
            import urllib.parse
            parsed_url = urllib.parse.urlparse(url)
            domain = parsed_url.netloc
            path = parsed_url.path
            
            if path and path != "/":
                # Use the last part of the path as title
                path_parts = path.rstrip("/").split("/")
                title_candidate = path_parts[-1].replace("-", " ").replace("_", " ").title()
                title = f"{title_candidate} - {domain}"
            else:
                title = f"Document from {domain}"
                
        # Process document
        document = process_document(
            title=title,
            content=content,
            document_type=document_type,
            source_url=url,
            description=description
        )
        
        return document
        
    except Exception as e:
        logger.error(f"Error processing document from URL: {str(e)}")
        return None

def get_document_by_id(document_id):
    """
    Retrieve a document by its ID.
    
    Args:
        document_id (int): Document ID
        
    Returns:
        Document: Document object or None if not found
    """
    try:
        with app.app_context():
            document = Document.query.get(document_id)
            return document
    except Exception as e:
        logger.error(f"Error retrieving document by ID: {str(e)}")
        return None

def search_documents(query, limit=5):
    """
    Basic search for documents by title and content.
    
    Args:
        query (str): Search query
        limit (int): Maximum number of results
        
    Returns:
        list: List of Document objects matching the query
    """
    try:
        with app.app_context():
            # Simple search using SQLAlchemy
            results = Document.query.filter(
                db.or_(
                    Document.title.ilike(f"%{query}%"),
                    Document.content.ilike(f"%{query}%"),
                    Document.description.ilike(f"%{query}%")
                )
            ).order_by(Document.updated_at.desc()).limit(limit).all()
            
            logger.info(f"Document search for '{query}' returned {len(results)} results")
            return results
            
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return []