import { z } from "zod";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Switch
} from "@/components/ui/switch"; 
import { 
  Server, 
  Database, 
  ClipboardCopy, 
  Lock, 
  User,
  Info,
  Zap
} from "lucide-react";

// Define the login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false);
  const isDevMode = import.meta.env.MODE === 'development';

  // Check and load auto-login setting from localStorage on component mount
  useEffect(() => {
    const disableAutoLogin = localStorage.getItem('disable-auto-login');
    setAutoLoginEnabled(!disableAutoLogin);
  }, []);

  // Toggle the auto-login setting
  const toggleAutoLogin = (enabled: boolean) => {
    if (enabled) {
      localStorage.removeItem('disable-auto-login');
      toast({
        title: "Auto-login enabled",
        description: "You'll be automatically logged in as admin in development mode",
      });
    } else {
      localStorage.setItem('disable-auto-login', 'true');
      toast({
        title: "Auto-login disabled",
        description: "Manual login will be required even in development mode",
      });
    }
    setAutoLoginEnabled(enabled);
    // Refresh to apply the change
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  // Define form with validation
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Set up the login mutation
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof loginSchema>) => {
      setError(null);
      try {
        // Since we get HTML instead of JSON when the server returns an error page,
        // we'll use fetch directly with error handling
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
          credentials: "include"
        });
        
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new ApiError(
              response.status,
              errorData.message || "Authentication failed"
            );
          } else {
            throw new ApiError(
              response.status,
              "Server error: The service is currently unavailable"
            );
          }
        }
        
        return await response.json();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          if (err.status === 401) {
            setShowDemo(true);
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        throw err;
      }
    },
    onSuccess: (userData) => {
      // Invalidate the auth query to update authentication state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}! You have been logged in successfully.`,
      });
      
      // Redirect to dashboard
      setLocation("/");
    },
    onError: () => {
      // Error is already handled in mutationFn
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    mutation.mutate(values);
  }

  const fillDemoCredentials = () => {
    form.setValue("username", "admin");
    form.setValue("password", "password");
    setShowDemo(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">RAG Drive Hub</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your AI-powered data connectors and RAG pipelines
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="font-medium">Authentication Error</AlertTitle>
              <AlertDescription>
                {error}
                {showDemo && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={fillDemoCredentials}
                  >
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Use demo credentials
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field} 
                        className="bg-card"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                        className="bg-card"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground flex items-center">
                <Info className="h-3 w-3 mr-1" />
                For testing, use username: <span className="font-mono mx-1">admin</span> and password: <span className="font-mono mx-1">password</span>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t pt-4">
          {isDevMode && (
            <div className="flex items-center justify-between p-2 bg-muted/40 rounded mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Development auto-login</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch 
                        checked={autoLoginEnabled} 
                        onCheckedChange={toggleAutoLogin} 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {autoLoginEnabled 
                      ? "Disable automatic admin login" 
                      : "Enable automatic admin login"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          <div className="text-sm text-center text-muted-foreground flex items-center justify-center">
            <Server className="h-4 w-4 mr-2" />
            Don't have an account?
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/register")}
          >
            Create an account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}