import unittest
import os
import sys
import tempfile
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import User, File, IndexedDocument, QueryLog, db
from rag import initialize_vector_store, get_document_loader, index_document, process_query

class TestRAG(unittest.TestCase):
    """Test the Retrieval Augmented Generation functionality"""
    
    def setUp(self):
        """Set up test app configuration"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create a temp directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create a test user
        with app.app_context():
            self.user = User(username='test_user', email='test@example.com')
            db.session.add(self.user)
            db.session.commit()
            self.user_id = self.user.id
            
            # Create a test file record
            self.file = File(
                filename='test.txt',
                original_filename='test.txt',
                file_path=os.path.join(self.temp_dir, 'test.txt'),
                file_size=100,
                file_type='txt',
                description='Test file for RAG',
                user_id=self.user_id
            )
            db.session.add(self.file)
            db.session.commit()
            self.file_id = self.file.id
            
            # Create a test file
            with open(os.path.join(self.temp_dir, 'test.txt'), 'w') as f:
                f.write("This is a test document for Benton County GIS system. It contains information about parcels in the West Richland area.")
    
    def tearDown(self):
        """Clean up after tests"""
        # Clean up database
        with app.app_context():
            db.session.query(IndexedDocument).filter_by(file_id=self.file_id).delete()
            db.session.query(File).filter_by(id=self.file_id).delete()
            db.session.query(User).filter_by(id=self.user_id).delete()
            db.session.commit()
        
        # Remove temporary directory
        import shutil
        shutil.rmtree(self.temp_dir)
        
        self.app_context.pop()
    
    def test_get_document_loader(self):
        """Test the document loader selection functionality"""
        # Create test files of different types
        txt_path = os.path.join(self.temp_dir, 'test.txt')
        pdf_path = os.path.join(self.temp_dir, 'test.pdf')
        xml_path = os.path.join(self.temp_dir, 'test.xml')
        
        with open(txt_path, 'w') as f:
            f.write("Test content")
        
        # Touch PDF and XML files
        open(pdf_path, 'w').close()
        open(xml_path, 'w').close()
        
        # Test loader selection
        from langchain_community.document_loaders import TextLoader, PyPDFLoader, UnstructuredXMLLoader
        
        txt_loader = get_document_loader(txt_path)
        pdf_loader = get_document_loader(pdf_path)
        xml_loader = get_document_loader(xml_path)
        
        self.assertIsInstance(txt_loader, TextLoader)
        self.assertIsInstance(pdf_loader, PyPDFLoader)
        self.assertIsInstance(xml_loader, UnstructuredXMLLoader)
    
    @patch('rag.OpenAIEmbeddings')
    @patch('rag.LangchainFAISS')
    def test_initialize_vector_store(self, mock_faiss, mock_embeddings):
        """Test vector store initialization"""
        # Mock the embeddings and vector store
        mock_embeddings_instance = MagicMock()
        mock_faiss.from_texts.return_value = MagicMock()
        mock_embeddings.return_value = mock_embeddings_instance
        
        # Set OPENAI_API_KEY environment variable
        os.environ['OPENAI_API_KEY'] = 'test_key'
        
        # Test initialization
        result = initialize_vector_store()
        
        # Check that the vector store was created
        mock_faiss.from_texts.assert_called_once()
        
        # Clean up
        del os.environ['OPENAI_API_KEY']
    
    @patch('rag.initialize_vector_store')
    @patch('rag.get_document_loader')
    def test_index_document(self, mock_get_loader, mock_init_vector_store):
        """Test document indexing"""
        # Set OPENAI_API_KEY environment variable
        os.environ['OPENAI_API_KEY'] = 'test_key'
        
        # Mock vector store
        mock_vector_store = MagicMock()
        # Set up the global vector_store in the rag module
        import rag
        rag.vector_store = mock_vector_store
        
        # Mock document loader
        mock_loader = MagicMock()
        mock_loader.load.return_value = [MagicMock()]
        mock_get_loader.return_value = mock_loader
        
        # Test indexing
        result = index_document(
            file_path=os.path.join(self.temp_dir, 'test.txt'),
            file_id=self.file_id,
            description='Test description'
        )
        
        self.assertTrue(result)
        
        # Check that the document was added to the vector store
        mock_vector_store.add_documents.assert_called_once()
        mock_vector_store.save_local.assert_called_once()
        
        # Check that IndexedDocument was created
        indexed_doc = IndexedDocument.query.filter_by(file_id=self.file_id).first()
        self.assertIsNotNone(indexed_doc)
        self.assertEqual(indexed_doc.status, 'indexed')
        
        # Clean up
        del os.environ['OPENAI_API_KEY']
    
    @patch('rag.initialize_vector_store')
    @patch('rag.openai.chat.completions.create')
    def test_process_query(self, mock_openai_create, mock_init_vector_store):
        """Test query processing"""
        # Set OPENAI_API_KEY environment variable
        os.environ['OPENAI_API_KEY'] = 'test_key'
        
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a test answer about Benton County GIS."
        mock_openai_create.return_value = mock_response
        
        # Mock vector store
        mock_vector_store = MagicMock()
        mock_doc = MagicMock()
        mock_doc.page_content = "Test content"
        mock_doc.metadata = {'file_id': self.file_id}
        mock_vector_store.similarity_search_with_score.return_value = [(mock_doc, 0.95)]
        
        # Set up the global vector_store in the rag module
        import rag
        rag.vector_store = mock_vector_store
        
        # Test query processing
        result = process_query(
            query="What parcels are in West Richland?",
            user_id=self.user_id
        )
        
        self.assertIsNotNone(result)
        self.assertEqual(result['answer'], "This is a test answer about Benton County GIS.")
        self.assertEqual(len(result['files']), 1)
        self.assertEqual(result['files'][0]['id'], self.file_id)
        
        # Check that QueryLog was created
        query_log = QueryLog.query.filter_by(user_id=self.user_id).first()
        self.assertIsNotNone(query_log)
        self.assertEqual(query_log.query, "What parcels are in West Richland?")
        self.assertEqual(query_log.response, "This is a test answer about Benton County GIS.")
        
        # Clean up
        del os.environ['OPENAI_API_KEY']

if __name__ == '__main__':
    unittest.main()