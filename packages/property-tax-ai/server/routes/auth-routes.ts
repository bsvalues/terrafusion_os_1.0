import { Router } from 'express';
import { AuthService } from '../services/auth-service';
import { SecurityService } from '../services/security';
import { storage } from '../storage';
import { authenticate, authorize } from '../middleware/auth';
import { generateTestToken } from '../middleware/auth-middleware';

export function createAuthRoutes() {
  const router = Router();
  const securityService = new SecurityService();
  const authService = new AuthService(storage, securityService);

  /**
   * Login route - BYPASSED for Windows Authentication integration
   */
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Always return success for the dummy login
      const dummyToken = 'windows-auth-integration-dummy-token-' + Date.now();
      const defaultUser = {
        userId: 1,
        username: 'county_admin',
        role: 'admin',
        scope: ['admin', 'read', 'write']
      };
      
      // Log the login bypass for audit purposes
      securityService.logSecurityEvent({
        eventType: 'authentication',
        component: 'auth-routes',
        userId: 1,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        details: {
          username: username || 'county_admin',
          note: 'Login bypass for Windows Authentication integration'
        },
        severity: 'info'
      }).catch(err => console.error('Failed to log login bypass:', err));
      
      res.json({
        token: dummyToken,
        user: defaultUser
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * Generate a test token (development only)
   * This endpoint is only available in development mode
   */
  router.get('/test-token', (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: 'Test tokens are not available in production environments' 
        });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
      const role = (req.query.role as string) || 'admin';
      
      const token = generateTestToken(userId, role);
      
      res.json({
        token,
        message: 'This token is for testing purposes only. It should not be used in production.',
        usage: 'Add this token to your Authorization header: Bearer [token]'
      });
    } catch (error) {
      console.error('Test token generation error:', error);
      res.status(500).json({ error: 'Failed to generate test token' });
    }
  });
  
  /**
   * Generate API key for external services
   * This route requires authentication and admin privileges
   */
  router.post('/api-key', authenticate, authorize('admin'), async (req, res) => {
    try {
      const { clientId, accessLevel, expiration, ipRestrictions } = req.body;
      
      // Validate required fields
      if (!clientId || !accessLevel) {
        return res.status(400).json({ error: 'Client ID and access level are required' });
      }
      
      // Get user ID from authenticated request
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Generate API key
      const apiKey = await authService.generateApiKey({
        userId,
        clientId,
        accessLevel,
        expiration,
        ipRestrictions: ipRestrictions || []
      });
      
      res.json({ apiKey });
    } catch (error) {
      console.error('API key generation error:', error);
      res.status(500).json({ error: 'Failed to generate API key' });
    }
  });
  
  /**
   * Revoke API key
   */
  router.delete('/api-key/:clientId', authenticate, authorize('admin'), async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Get user ID from authenticated request
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const success = await authService.revokeApiKey(clientId, userId);
      
      if (success) {
        res.json({ message: 'API key revoked successfully' });
      } else {
        res.status(404).json({ error: 'API key not found or not owned by user' });
      }
    } catch (error) {
      console.error('API key revocation error:', error);
      res.status(500).json({ error: 'Failed to revoke API key' });
    }
  });
  
  return router;
}