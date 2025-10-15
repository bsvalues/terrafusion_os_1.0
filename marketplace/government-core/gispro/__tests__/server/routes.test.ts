import fetch from 'node-fetch';
import { WorkflowType } from '../../shared/schema';
import { DocumentType } from '../../shared/document-types';

describe('API Routes', () => {
  const serverUrl = 'http://localhost:5000';
  let cookie: string;

  test('GET /api/user should return 401 when not authenticated', async () => {
    const response = await fetch(`${serverUrl}/api/user`);
    expect(response.status).toBe(401);
  });

  test('GET /api/dev-login should return user data for development', async () => {
    const response = await fetch(`${serverUrl}/api/dev-login`, {
      // @ts-ignore
      credentials: 'include'
    });
    
    expect(response.ok).toBeTruthy();
    const data = await response.json() as any;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('username');
    expect(data.username).toBe('admin');
    
    // Extract the cookie for subsequent authenticated requests
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Extract the connect.sid value
      const match = setCookieHeader.match(/connect\.sid=([^;]+)/);
      if (match) {
        cookie = `connect.sid=${match[1]}`;
      }
    }
  });

  test('GET /api/db-test should connect to the database', async () => {
    const response = await fetch(`${serverUrl}/api/db-test`);
    
    expect(response.ok).toBeTruthy();
    const data = await response.json() as any;
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Database connection successful');
  });
  
  describe('Authenticated Endpoints', () => {
    // Skip these tests if cookie isn't set
    beforeAll(() => {
      if (!cookie) {
        console.warn('⚠️ Authentication cookie not set, skipping authenticated endpoint tests');
      }
    });
    
    test('GET /api/workflows should return workflows for the user', async () => {
      if (!cookie) return;
      
      const response = await fetch(`${serverUrl}/api/workflows`, {
        headers: { Cookie: cookie }
      });
      
      expect(response.ok).toBeTruthy();
      const data = await response.json() as any[];
      expect(Array.isArray(data)).toBeTruthy();
      
      if (data.length > 0) {
        const workflow = data[0];
        expect(workflow).toHaveProperty('id');
        expect(workflow).toHaveProperty('title');
        expect(workflow).toHaveProperty('type');
        expect(['long_plat', 'bla', 'merge_split', 'sm00_report']).toContain(workflow.type);
      }
    });
    
    test('GET /api/map-layers should return map layers', async () => {
      if (!cookie) return;
      
      const response = await fetch(`${serverUrl}/api/map-layers`, {
        headers: { Cookie: cookie }
      });
      
      expect(response.ok).toBeTruthy();
      const data = await response.json() as any[];
      expect(Array.isArray(data)).toBeTruthy();
      
      if (data.length > 0) {
        const layer = data[0];
        expect(layer).toHaveProperty('id');
        expect(layer).toHaveProperty('name');
        expect(layer).toHaveProperty('type');
        expect(layer).toHaveProperty('visible');
      }
    });
  });
});