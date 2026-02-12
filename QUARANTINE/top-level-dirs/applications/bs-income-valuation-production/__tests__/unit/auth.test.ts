import { hashPassword, comparePassword, generateTokens } from '../../server/auth';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, secret, options) => {
    return 'mocked-token';
  }),
  verify: jest.fn()
}));

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // Hashed password should be different from original
      expect(hashedPassword).not.toBe(password);
      
      // Hashed password should be a string
      expect(typeof hashedPassword).toBe('string');
      
      // Bcrypt hashes typically start with '$2a$', '$2b$', or '$2y$'
      expect(hashedPassword.startsWith('$2')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'securePassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      const tokens = generateTokens(payload);
      
      // Check that tokens exist
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      
      // Check that JWT sign was called twice (once for each token)
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });
});