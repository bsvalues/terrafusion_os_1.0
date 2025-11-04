import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, JwtPayload } from '../../server/auth';

// Mock the environment variables
const originalNodeEnv = process.env.NODE_ENV;

describe('Authentication Bypass in Development', () => {
  let mockRequest: Partial<Request & { user?: JwtPayload }>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockRequest = {};
    mockResponse = {
      status: jest.fn(() => mockResponse as Response),
      json: jest.fn(() => mockResponse as Response)
    };
    nextFunction = jest.fn();
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('Development mode should bypass authentication and set a mock user', () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';
    
    // Call the authentication middleware
    authenticateJWT(
      mockRequest as Request & { user?: JwtPayload }, 
      mockResponse as Response, 
      nextFunction
    );
    
    // Check that next() was called without errors
    expect(nextFunction).toHaveBeenCalled();
    
    // Verify that a mock user was added to the request
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user).toEqual({
      userId: 1,
      username: 'devuser',
      email: 'dev@example.com',
      role: 'user'
    });
    
    // Ensure no response was sent (bypassed auth check)
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  test('Production mode should not bypass authentication with missing token', () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Call the authentication middleware
    authenticateJWT(
      mockRequest as Request & { user?: JwtPayload }, 
      mockResponse as Response, 
      nextFunction
    );
    
    // Check that next() was not called
    expect(nextFunction).not.toHaveBeenCalled();
    
    // Verify error response was sent
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        message: "Authorization token required"
      })
    }));
  });

  test('Production mode should validate a proper authorization header format', () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Mock an invalid authorization header
    mockRequest = {
      headers: {
        authorization: 'Invalid-Format'
      }
    };
    
    // Call the authentication middleware
    authenticateJWT(
      mockRequest as Request & { user?: JwtPayload }, 
      mockResponse as Response, 
      nextFunction
    );
    
    // Check that next() was not called
    expect(nextFunction).not.toHaveBeenCalled();
    
    // Verify error response was sent
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        message: "Authorization header format must be 'Bearer {token}'"
      })
    }));
  });
});