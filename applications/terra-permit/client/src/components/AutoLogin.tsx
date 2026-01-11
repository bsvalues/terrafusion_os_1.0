import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const AutoLogin: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  
  useEffect(() => {
    // Only attempt auto-login if not already authenticated and we haven't tried yet
    if (!isAuthenticated && !attemptedLogin) {
      const attemptAutoLogin = async () => {
        try {
          console.log('Attempting auto dev-login...');
          setAttemptedLogin(true);
          
          // Use the dev-login endpoint instead of normal login
          const response = await fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: 1 }),
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Auto dev-login successful');
            
            // Store auth token in sessionStorage
            if (data.authToken) {
              sessionStorage.setItem('x-auth-token', data.authToken);
              console.log('Auth token stored in sessionStorage with key: x-auth-token');
            }
            
            // Show success toast
            toast({
              title: 'Logged in',
              description: 'Auto-login successful. Welcome back!',
              variant: 'default',
            });
            
            // Reload the page to apply the auth state
            window.location.href = '/';
          } else {
            throw new Error('Dev login failed');
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
          toast({
            title: 'Auto-login failed',
            description: 'Please log in manually.',
            variant: 'destructive',
          });
        }
      };
      
      attemptAutoLogin();
    }
  }, [isAuthenticated, setLocation, toast, attemptedLogin]);
  
  // This component doesn't render anything
  return null;
};

export default AutoLogin;