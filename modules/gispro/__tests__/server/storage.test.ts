import { db } from '../../server/db';
import { IStorage } from '../../server/storage';
import { User, Workflow, WorkflowType } from '../../shared/schema';
import { DocumentType } from '../../shared/document-types';

// Mock the database
jest.mock('../../server/db', () => ({
  db: {
    query: jest.fn()
  }
}));

// Get the mocked database
const mockedDb = db as jest.Mocked<typeof db>;

describe('Storage Layer', () => {
  // Import the storage implementation after mocking the database
  let storage: IStorage;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Reset the mock implementation
    mockedDb.query.mockReset();
    
    // Import the storage module in each test to get a fresh instance
    const { storage: freshStorage } = require('../../server/storage');
    storage = freshStorage;
  });
  
  describe('User Operations', () => {
    test('getUser should return user by ID if found', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        fullName: 'Test User',
        email: 'test@example.com',
        department: 'IT',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      mockedDb.query.mockResolvedValueOnce([mockUser]);
      
      const user = await storage.getUser(1);
      expect(user).toEqual(mockUser);
    });
    
    test('getUser should return undefined if user not found', async () => {
      mockedDb.query.mockResolvedValueOnce([]);
      
      const user = await storage.getUser(999);
      expect(user).toBeUndefined();
    });
    
    test('getUserByUsername should return user if found', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        fullName: 'Test User',
        email: 'test@example.com',
        department: 'IT',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      mockedDb.query.mockResolvedValueOnce([mockUser]);
      
      const user = await storage.getUserByUsername('testuser');
      expect(user).toEqual(mockUser);
    });
  });
  
  describe('Workflow Operations', () => {
    test('getWorkflows should return all workflows for a user', async () => {
      const mockWorkflows: Workflow[] = [
        {
          id: 1,
          userId: 1,
          type: WorkflowType.LONG_PLAT,
          title: 'Test Workflow 1',
          description: 'Description 1',
          status: 'draft',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          type: WorkflowType.BLA,
          title: 'Test Workflow 2',
          description: 'Description 2',
          status: 'in_progress',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockedDb.query.mockResolvedValueOnce(mockWorkflows);
      
      const workflows = await storage.getWorkflows(1);
      expect(workflows).toEqual(mockWorkflows);
      expect(workflows.length).toBe(2);
    });
    
    test('getWorkflow should return a specific workflow by ID', async () => {
      const mockWorkflow: Workflow = {
        id: 1,
        userId: 1,
        type: WorkflowType.LONG_PLAT,
        title: 'Test Workflow',
        description: 'Description',
        status: 'draft',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockedDb.query.mockResolvedValueOnce([mockWorkflow]);
      
      const workflow = await storage.getWorkflow(1);
      expect(workflow).toEqual(mockWorkflow);
    });
  });
  
  describe('Document Operations', () => {
    test('getDocuments should return all documents or filtered by workflowId', async () => {
      const mockDocuments = [
        {
          id: 1,
          workflowId: 1,
          name: 'Test Document 1',
          type: DocumentType.PLAT_MAP,
          contentType: 'application/pdf',
          contentHash: 'hash1',
          storageKey: 'key1',
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          workflowId: 1,
          name: 'Test Document 2',
          type: DocumentType.DEED,
          contentType: 'application/pdf',
          contentHash: 'hash2',
          storageKey: 'key2',
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      mockedDb.query.mockResolvedValueOnce(mockDocuments);
      
      const documents = await storage.getDocuments(1);
      expect(documents).toEqual(mockDocuments);
      expect(documents.length).toBe(2);
    });
  });
});