const express = require('express');
const { storage } = require('../storage');
const router = express.Router();

// GET a specific user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

// POST create a new user
router.post('/', async (req, res) => {
  try {
    // Check if username is already taken
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // In a real application, you would hash the password before storing it
    // For example: req.body.password = await bcrypt.hash(req.body.password, 10);
    
    const newUser = await storage.createUser(req.body);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// PUT update a user
router.put('/:id', async (req, res) => {
  try {
    // Check if user exists
    const existingUser = await storage.getUser(parseInt(req.params.id));
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If username is being changed, check if the new username is already taken
    if (req.body.username && req.body.username !== existingUser.username) {
      const userWithSameUsername = await storage.getUserByUsername(req.body.username);
      if (userWithSameUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // In a real application, if password is being updated, hash it
    // if (req.body.password) {
    //   req.body.password = await bcrypt.hash(req.body.password, 10);
    // }
    
    const updatedUser = await storage.updateUser(parseInt(req.params.id), req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// GET all appraisals for a user (appraiser)
router.get('/:id/appraisals', async (req, res) => {
  try {
    // Check if user exists
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is an appraiser
    if (user.role !== 'appraiser' && user.role !== 'admin') {
      return res.status(403).json({ message: 'User is not an appraiser' });
    }
    
    const appraisals = await storage.getAppraisalsByAppraiser(parseInt(req.params.id));
    res.json(appraisals);
  } catch (error) {
    console.error(`Error fetching appraisals for user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch user appraisals', error: error.message });
  }
});

// POST authenticate user (login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Get user by username
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // In a real application, you would compare the hashed password
    // const passwordMatch = await bcrypt.compare(password, user.password);
    const passwordMatch = password === user.password; // This is not secure, just for demo
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // In a real application, generate a JWT token or session
    // const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'your-secret-key', { expiresIn: '1h' });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      // token,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// GET users by role
router.get('/role/:role', async (req, res) => {
  try {
    // This would need to be implemented in the storage layer
    // For now, just return an empty array
    res.json([]);
  } catch (error) {
    console.error(`Error fetching users with role ${req.params.role}:`, error);
    res.status(500).json({ message: 'Failed to fetch users by role', error: error.message });
  }
});

module.exports = router;