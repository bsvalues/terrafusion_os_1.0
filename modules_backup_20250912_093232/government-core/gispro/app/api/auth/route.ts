import { type NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'analyst' | 'viewer';
  name: string;
  created_at: string;
  last_login?: string;
}

// Mock user database - in production, this would be PostgreSQL
const users: User[] = [
  {
    id: 'user_001',
    email: 'admin@gama.ai',
    password: '$2a$10$rOzJqQZQXQXQXQXQXQXQXu', // "admin123"
    role: 'admin',
    name: 'GAMA Administrator',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user_002',
    email: 'analyst@gama.ai',
    password: '$2a$10$rOzJqQZQXQXQXQXQXQXQXu', // "analyst123"
    role: 'analyst',
    name: 'Market Analyst',
    created_at: '2024-01-01T00:00:00Z',
  },
];

const JWT_SECRET = process.env.JWT_SECRET || 'gama-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name } = await request.json();

    if (action === 'login') {
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      // Verify password (simplified for demo)
      const isValidPassword =
        (email === 'admin@gama.ai' && password === 'admin123') ||
        (email === 'analyst@gama.ai' && password === 'analyst123');

      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      user.last_login = new Date().toISOString();

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    }

    if (action === 'register') {
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'User already exists' }, { status: 400 });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        password: hashedPassword,
        role: 'viewer',
        name: name || 'GAMA User',
        created_at: new Date().toISOString(),
      };

      users.push(newUser);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }
}
