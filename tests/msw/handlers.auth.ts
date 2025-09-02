import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'u-admin',
        roles: ['EnterpriseAdmin'],
        permissions: ['read', 'write', 'delete', 'export']
      }
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 'u-admin',
      roles: ['EnterpriseAdmin'],
      permissions: ['read', 'write', 'delete', 'export']
    });
  })
];