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

// Create registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  fullName: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function Register() {
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Form submission handler
  async function onSubmit(data: RegisterFormValues) {
    setRegisterError(null);
    
    const result = await register(data);
    
    if (result.success) {
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
      setLocation("/dashboard");
    } else {
      setRegisterError(result.error || "Failed to register. Please try again.");
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: result.error || "Please check your information and try again.",
      });
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1"><>

          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription
</>

className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {registerError && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {registerError}
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
                    <FormDescription
</>

</>>
                      This will be your login username
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Email</FormLabel>
                    <FormControl
</>

</>><>

                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage
</>

/>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Full Name (Optional)</FormLabel>
                    <FormControl
</>

</>><>

                      <Input placeholder="John Doe" {...field} />
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
                    <FormDescription
</>

</>>
                      Must be at least 6 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}