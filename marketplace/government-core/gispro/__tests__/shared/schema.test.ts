import { 
  User, InsertUser, 
  Workflow, InsertWorkflow,
  WorkflowState, InsertWorkflowState,
  WorkflowEvent, InsertWorkflowEvent,
  ChecklistItem, InsertChecklistItem,
  Document, InsertDocument,
  DocumentParcelLink, InsertDocumentParcelLink,
  DocumentVersion, InsertDocumentVersion,
  Parcel, InsertParcel,
  MapLayer, InsertMapLayer
} from "../../shared/schema";
import { DocumentType } from "../../shared/document-types";

describe('Schema Types', () => {
  test('User types should be properly defined', () => {
    const mockUser: Partial<User> = {
      id: 1,
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com'
    };
    
    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('username');
    expect(mockUser).toHaveProperty('fullName');
    expect(mockUser).toHaveProperty('email');
  });
  
  test('Workflow types should be properly defined', () => {
    const mockWorkflow: Partial<Workflow> = {
      id: 1,
      userId: 1,
      type: 'long_plat',
      title: 'Test Workflow',
      status: 'draft'
    };
    
    expect(mockWorkflow).toHaveProperty('id');
    expect(mockWorkflow).toHaveProperty('userId');
    expect(mockWorkflow).toHaveProperty('type');
    expect(mockWorkflow).toHaveProperty('title');
    expect(mockWorkflow).toHaveProperty('status');
  });
  
  test('Document types should be properly defined', () => {
    const mockDocument: Partial<Document> = {
      id: 1,
      name: 'Test Document',
      type: DocumentType.DEED,
      contentType: 'application/pdf',
      contentHash: 'abc123',
      storageKey: 'documents/test.pdf'
    };
    
    expect(mockDocument).toHaveProperty('id');
    expect(mockDocument).toHaveProperty('name');
    expect(mockDocument).toHaveProperty('type');
    expect(mockDocument).toHaveProperty('contentType');
    expect(mockDocument).toHaveProperty('contentHash');
    expect(mockDocument).toHaveProperty('storageKey');
  });
  
  test('DocumentType enum should contain expected values', () => {
    expect(DocumentType.PLAT_MAP).toBe('plat_map');
    expect(DocumentType.DEED).toBe('deed');
    expect(DocumentType.SURVEY).toBe('survey');
    expect(DocumentType.LEGAL_DESCRIPTION).toBe('legal_description');
    expect(DocumentType.BOUNDARY_LINE_ADJUSTMENT).toBe('boundary_line_adjustment');
    expect(DocumentType.TAX_FORM).toBe('tax_form');
    expect(DocumentType.UNCLASSIFIED).toBe('unclassified');
  });

  test('Parcel types should be properly defined', () => {
    const mockParcel: Partial<Parcel> = {
      id: 1,
      parcelNumber: '123456789',
      address: '123 Main St',
      city: 'Kennewick',
      zip: '99336',
      owner: 'John Doe'
    };
    
    expect(mockParcel).toHaveProperty('id');
    expect(mockParcel).toHaveProperty('parcelNumber');
    expect(mockParcel).toHaveProperty('address');
    expect(mockParcel).toHaveProperty('city');
    expect(mockParcel).toHaveProperty('zip');
    expect(mockParcel).toHaveProperty('owner');
  });
});