import React, { useState } from 'react';
import { Building, Lock, User  } from '@mui/icons-material';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would validate credentials with the backend
      // For demo purposes, we're just calling the onLogin callback directly
      setTimeout(() => {
        onLogin(username, password);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center mb-2">
            <Building className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold"><>

              <span className="text-primary">Terra</span>
              <span
</>>Fusion</span>
              <span className="text-xs bg-primary text-white px-1 py-0.5 rounded ml-1 align-top">PRO</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Real Estate Appraisal Platform</p>
        </div>
        
        <div className="bg-card border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Sign In</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div><>

                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <div
</> className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div><>

                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <div
</> className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember me
                  </label>
                </div>
                
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground"><>

          <p className="mb-2">For demo purposes, you can sign in with any credentials</p>
          <p
</>>© 2025 TerraFusionProfessional. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;