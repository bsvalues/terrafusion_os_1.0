import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { LogIn  } from '@mui/icons-material';

// Create login form schema
const loginFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDevLoginLoading, setIsDevLoginLoading] = useState(false);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler
  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    const { username, password } = data;
    
    const result = await login(username, password);
    
    if (result.success) {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/dashboard");
    } else {
      setLoginError(result.error || "Failed to login. Please check your credentials.");
      toast({
        variant: "destructive",
        title: "Login failed",
        description: result.error || "Please check your credentials and try again.",
      });
    }
  }
  
  // Developer auto login for easy access
  async function handleDevAutoLogin() {
    setLoginError(null);
    setIsDevLoginLoading(true);
    
    try {
      const response = await fetch("/api/dev-auth/auto-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setLoginError(data.error || "Development auto-login failed");
        toast({
          variant: "destructive",
          title: "Auto-login failed",
          description: data.error || "Could not create development user",
        });
        return;
      }
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      toast({
        title: "Auto-login successful",
        description: "Welcome to development mode!",
      });
      
      // Force page reload to refresh the auth state
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Auto-login error:", error);
      setLoginError("Failed to auto-login. Server error.");
      toast({
        variant: "destructive",
        title: "Auto-login failed",
        description: "Server error occurred",
      });
    } finally {
      setIsDevLoginLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1"><>

          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription
</>

className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {loginError && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {loginError}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Username</FormLabel>
                    <FormControl
</>

</>><>

                      <Input placeholder="your-username" {...field} />
                    </FormControl>
                    <FormMessage
</>

/>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Password</FormLabel>
                    <FormControl
</>

</>><>

                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage
</>

/>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
          
          {/* DEV ONLY - Skip login button */}
          <div className="pt-2">
            <Separator className="my-4" /><>

            <div className="text-xs text-center text-muted-foreground mb-2">
              Development Options
            </div>
            <Button
</>

              type="button" 
              variant="outline"
              className="w-full border-dashed border-muted-foreground/50"
              onClick={handleDevAutoLogin}
              disabled={isDevLoginLoading}
            >
              {isDevLoginLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
</>

className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Please wait...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Skip Login (Dev Only)
                </span>
              )}
            </Button>
            <div className="text-xs text-center text-muted-foreground mt-2">
              For development use only. Not for production.
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}