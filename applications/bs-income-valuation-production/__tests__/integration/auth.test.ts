import { Express } from 'express';
import request from 'supertest';
import express from 'express';
import { MockStorage } from '../mocks/mockstorage';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation(() => 'test-token'),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (token === 'valid-token') {
      if (callback) {
        callback(null, { userId: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      }
      return { userId: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
    } else {
      if (callback) {
        callback(new Error('Invalid token'), null);
      }
      throw new Error('Invalid token');
    }
  })
}));

// Mock the db and storage modules
jest.mock('../../server/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      }
    ])
  }
}));

jest.mock('../../server/storage', () => {
  const mockStorage = new MockStorage();
  return {
    storage: mockStorage,
    get _getMockStorage() {
      return mockStorage;
    }
  };
});

// Import auth-related modules after mocking
import { authRouter } from '../../server/authRoutes';

describe('Authentication Routes', () => {
  let app: Express;
  let mockStorage: MockStorage;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    
    // Get reference to mock storage
    mockStorage = (jest.requireMock('../../server/storage') as any)._getMockStorage;
  });

  beforeEach(() => {
    mockStorage.reset();
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
        role: 'user',
        fullName: 'New User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        username: 'us', // Too short
        password: 'pass', // Too short
        email: 'invalid-email', // Invalid email format
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Mock implementation for this specific test
      jest.spyOn(mockStorage, 'getUserByUsername').mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$somehashedpassword', // This doesn't need to be real for our mock
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      });

      // Mock password comparison to return true
      jest.spyOn(require('../../server/auth'), 'comparePassword').mockResolvedValueOnce(true);

      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid credentials', async () => {
      // Mock implementation for this specific test
      jest.spyOn(mockStorage, 'getUserByUsername').mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: '$2a$10$somehashedpassword',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      });

      // Mock password comparison to return false
      jest.spyOn(require('../../server/auth'), 'comparePassword').mockResolvedValueOnce(false);

      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid username or password');
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should issue new tokens with a valid refresh token', async () => {
      // Mock verification to succeed
      jest.spyOn(require('../../server/auth'), 'verifyRefreshToken').mockResolvedValueOnce({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });

      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject an invalid refresh token', async () => {
      // Mock verification to fail
      jest.spyOn(require('../../server/auth'), 'verifyRefreshToken').mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout a user', async () => {
      // Mock the revoke function
      jest.spyOn(require('../../server/auth'), 'revokeRefreshToken').mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should require a refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Refresh token is required');
    });
  });

  describe('GET /auth/me', () => {
    it('should return the authenticated user', async () => {
      // Mock jwt verification to succeed
      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementationOnce((token, secret, callback) => {
        callback(null, { userId: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Authorization token required');
    });
  });
});