import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, KeyRound, LogIn  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { AIDevBadge } from "@/components/AIDevBadge";

export default function DevLogin() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  // Add auto-login for development
  const handleAutoLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a development admin user and get token
      const response = await fetch("/api/dev-auth/auto-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Development auto-login failed");
        setIsLoading(false);
        return;
      }
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Auto-login error:", error);
      setError("Failed to auto-login. Try the token method instead.");
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError("Please enter a development token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dev-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store tokens in localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (err) {
      console.error("Dev login error:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between"><>

            <CardTitle className="text-2xl">Developer Login</CardTitle>
            <AIDevBadge
</>

/>
          </div>
          <CardDescription>
            Enter your one-time developer token to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDevLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" /><>

                <AlertTitle>Error</AlertTitle>
                <AlertDescription
</>

</>>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2"><>

              <Label htmlFor="token">Development Token</Label>
              <div
</>

className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-muted-foreground" /><>

                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your one-time token"
                  className="flex-1"
                  autoComplete="off"
                />
              </div>
              <p
</>

className="text-sm text-muted-foreground">
                This token can only be used once and expires after a set period
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
</>

className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Authenticate
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="button" 
            variant="secondary"
            className="w-full"
            onClick={handleAutoLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
</>

className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <LogIn className="mr-2 h-4 w-4" />
                Auto-Login (Dev Only)
              </span>
            )}
          </Button>
          <div className="text-sm text-center w-full">
            <button 
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline"
            >
              Return to regular login
            </button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            For development use only. Not for production.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}