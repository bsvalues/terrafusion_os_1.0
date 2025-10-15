const request = require('supertest');
const fetch = require('node-fetch');

describe('API Tests', () => {
  let serverUrl = 'http://localhost:5000';

  test('GET /api/user should return 401 when not authenticated', async () => {
    const response = await fetch(`${serverUrl}/api/user`);
    expect(response.status).toBe(401);
  });

  test('GET /api/dev-login should return user data for development', async () => {
    const response = await fetch(`${serverUrl}/api/dev-login`, {
      credentials: 'include'
    });
    
    expect(response.ok).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('username');
    expect(data.username).toBe('admin');
  });
});