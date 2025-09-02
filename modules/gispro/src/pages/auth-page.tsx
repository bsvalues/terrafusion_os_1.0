import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Shield, FileText, Users, Loader2  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if user is already logged in
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest("POST", "/api/login", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.fullName || data.username}!`,
      });
      queryClient.setQueryData(["/api/user"], data);
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const response = await apiRequest("POST", "/api/register", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: `Welcome to Benton GIS Workflow Assistant, ${data.fullName || data.username}!`,
      });
      queryClient.setQueryData(["/api/user"], data);
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Enhanced dev auto-login mutation with direct fetch
  const devLoginMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting dev login request with custom implementation");
      console.log("Current cookies:", document.cookie);
      
      // Use direct fetch with explicit credentials and cache control
      const response = await fetch("/api/dev-login", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, private",
          "Pragma": "no-cache",
          "Expires": "0",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        cache: "no-store",
        mode: "cors",
        redirect: "follow"
      });
      
      console.log("Dev login response:", response.status, response.statusText);
      
      // Wait for cookies to be set before proceeding
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Cookies after login attempt:", document.cookie);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Auto-login failed");
      }
      
      const data = await response.json();
      console.log("Dev login data:", data);
      
      // Verify the session was established
      try {
        console.log("Verifying session after login");
        const verifyResponse = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          cache: "no-store"
        });
        
        console.log("Verify response status:", verifyResponse.status);
        
        if (verifyResponse.ok) {
          console.log("Session verification successful");
          const verifiedUser = await verifyResponse.json();
          return verifiedUser; // Return verified user data
        } else {
          console.log("Session verification failed, using original data");
          return data; // Fall back to the original response
        }
      } catch (verifyError) {
        console.error("Error verifying session:", verifyError);
        return data; // Return original data if verification fails
      }
    },
    onSuccess: (data) => {
      console.log("Dev login success with data:", data);
      
      toast({
        title: "Auto-login successful",
        description: `Logged in as ${data.fullName || data.username}`,
      });
      
      // Update the query client
      queryClient.setQueryData(["/api/user"], data);
      
      // Invalidate the query to force a refresh
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Force a reload to establish the session properly
      setTimeout(() => {
        console.log("Reloading page to complete login");
        window.location.reload();
      }, 200);
    },
    onError: (error: Error) => {
      console.error("Dev login error:", error);
      
      toast({
        title: "Auto-login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      department: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };
  
  const handleDevLogin = () => {
    devLoginMutation.mutate();
  };

  // Show loading state while auth state is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-500">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Left side: Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-6 w-6 text-primary-500" />
              <div><>

                <h2 className="text-xl font-semibold text-primary-600">Benton GIS Workflow Assistant</h2>
                <p
</> className="text-xs text-neutral-500">Assessor's Office</p>
              </div>
            </div><>

            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription
</>>
              Sign in to access the Benton County GIS Workflow Assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6"><>

                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger
</> value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Username</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Password</FormLabel>
                          <FormControl
</>><>

                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Signing In
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="pt-2 text-center">
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDevLogin}
                        className="text-xs text-neutral-500 hover:text-primary-500"
                      >
                        {devLoginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> 
                            Auto Login
                          </>
                        ) : (
                          "Auto Login (Dev Only)"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Username</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Create a username" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Password</FormLabel>
                          <FormControl
</>><>

                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Full Name</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Email</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Department</FormLabel>
                          <FormControl
</>><>

                            <Input placeholder="Enter your department (optional)" {...field} />
                          </FormControl>
                          <FormMessage
</> />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Creating Account
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center w-full text-neutral-500">
              By signing in, you agree to the terms of use and data policy.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side: Hero section */}
      <div className="w-full md:w-1/2 bg-primary-500 text-white p-8 flex items-center justify-center">
        <div className="max-w-md"><>

          <h1 className="text-3xl font-bold mb-6">Streamline Your GIS Workflows</h1>
          <p
</> className="mb-8">
            The Benton GIS Workflow Assistant modernizes and simplifies cartography, 
            parcel management, and reporting processes for the Benton County Assessor's Office.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-md text-primary-500"><>

                <MapPin className="h-5 w-5" />
              </div>
              <div
</>><>

                <h3 className="font-semibold">Advanced GIS Integration</h3>
                <p
</> className="text-sm opacity-80">Seamlessly integrates with ArcGIS Pro and QGIS via RESTful APIs.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-md text-primary-500"><>

                <FileText className="h-5 w-5" />
              </div>
              <div
</>><>

                <h3 className="font-semibold">Interactive Workflows</h3>
                <p
</> className="text-sm opacity-80">Step-by-step guidance through complex assessor office procedures.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-md text-primary-500"><>

                <Shield className="h-5 w-5" />
              </div>
              <div
</>><>

                <h3 className="font-semibold">Compliance Focused</h3>
                <p
</> className="text-sm opacity-80">Ensures all operations adhere to Washington State requirements.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-md text-primary-500"><>

                <Users className="h-5 w-5" />
              </div>
              <div
</>><>

                <h3 className="font-semibold">Collaborative Tools</h3>
                <p
</> className="text-sm opacity-80">Enables efficient teamwork among county assessor staff.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}