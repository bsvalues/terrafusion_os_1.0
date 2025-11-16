import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { AlertCircle, Key, Refresh, Trash2, UserPlus  } from '@mui/icons-material';
import { ApiError } from "@/components/ui/api-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface DevToken {
  id: number;
  token: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  description: string;
  createdBy: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
}

export default function DevTokenManagement() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [tokenDescription, setTokenDescription] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState("60");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  
  // If not authenticated or not admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive"
      });
      setLocation("/dashboard");
    } else if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, user, setLocation, toast]);

  // Fetch users
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    error: usersError
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && !!user && user.role === "admin"
  });

  // Fetch tokens for selected user
  const { 
    data: tokens, 
    isLoading: isLoadingTokens,
    error: tokensError,
    refetch: refetchTokens
  } = useQuery<DevToken[]>({
    queryKey: ['/api/dev-auth/tokens', selectedUser],
    enabled: isAuthenticated && !!selectedUser && !!user && user.role === "admin"
  });

  // Generate token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async (tokenData: {
      userId: number;
      description?: string;
      expiresInMinutes: number;
    }) => {
      const response = await fetch("/api/dev-auth/token/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate token");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data.tokenInfo.token);
      toast({
        title: "Token Generated",
        description: "Development token was successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dev-auth/tokens', selectedUser] });
    },
    onError: (error: Error) => {
      toast({
        title: "Token Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Revoke token mutation
  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      const response = await fetch(`/api/dev-auth/token/${tokenId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to revoke token");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token Revoked",
        description: "The development token has been revoked",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dev-auth/tokens', selectedUser] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Revoke Token",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Cleanup expired tokens mutation
  const cleanupTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/dev-auth/tokens/cleanup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cleanup tokens");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tokens Cleaned Up",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dev-auth/tokens', selectedUser] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateToken = () => {
    if (!selectedUser) {
      toast({
        title: "User Required",
        description: "Please select a user to generate a token for",
        variant: "destructive"
      });
      return;
    }

    generateTokenMutation.mutate({
      userId: selectedUser,
      description: tokenDescription || undefined,
      expiresInMinutes: parseInt(expiresInMinutes)
    });
  };

  const copyTokenToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setIsTokenCopied(true);
      setTimeout(() => setIsTokenCopied(false), 2000);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // If not admin, don't render the page
  if (!isAuthenticated || (user && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div><>

          <h1 className="text-3xl font-bold">Dev Token Management</h1>
          <p
</>

className="text-muted-foreground">
            Generate and manage one-time authentication tokens for development
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="generate">
          <TabsList><>

            <TabsTrigger value="generate">Generate Token</TabsTrigger>
            <TabsTrigger
</>

value="manage">Manage Tokens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 pt-4">
            <Card>
              <CardHeader><>

                <CardTitle>Generate Development Token</CardTitle>
                <CardDescription
</>

</>>
                  Create a one-time use token for developer authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersError && (
                  <ApiError
                    title="Failed to Load Users"
                    error={usersError instanceof Error ? usersError : new Error("Unknown error")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/users'] })}
                  />
                )}

                <div className="space-y-2"><>

                  <Label htmlFor="user">Select User</Label>
                  <Select
</>

                    value={selectedUser?.toString() || ""} 
                    onValueChange={(value) => setSelectedUser(parseInt(value))}
                  >
                    <SelectTrigger id="user"><>

                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent
</>

</>>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>
                          Loading users...
                        </SelectItem>
                      ) : (
                        users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
</>

                    id="description"
                    placeholder="Token purpose or description"
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="expiration">Expires In (minutes)</Label>
                  <Select
</>

                    value={expiresInMinutes} 
                    onValueChange={setExpiresInMinutes}
                  >
                    <SelectTrigger id="expiration"><>

                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem
</>

value="30">30 minutes</SelectItem><>

                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem
</>

value="240">4 hours</SelectItem><>

                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem
</>

value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateToken} 
                  disabled={generateTokenMutation.isPending || !selectedUser}
                  className="w-full"
                >
                  {generateTokenMutation.isPending ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
</>

className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                  ) : (
                      <Key className="mr-2 h-4 w-4" />
                      Generate Token
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedToken && (
              <Card className="border-green-500">
                <CardHeader className="bg-green-50 dark:bg-green-950 rounded-t-lg">
                  <CardTitle className="text-green-700 dark:text-green-300 flex items-center"><>

                    <Key className="mr-2 h-5 w-5" />
                    Token Generated Successfully
                  </CardTitle>
                  <CardDescription
</>

</>>
                    This token can only be viewed once. Copy it now!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4"><>

                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {showToken ? generatedToken : '••••••••••••••••••••••••••••••••••••••••••••'}
                    </div>
                    
                    <div
</>

className="flex space-x-2"><>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                        className="flex-1"
                      >
                        {showToken ? "Hide Token" : "Show Token"}
                      </Button>
                      
                      <Button
</>

                        variant="secondary"
                        size="sm"
                        onClick={copyTokenToClipboard}
                        className="flex-1"
                      >
                        {isTokenCopied ? "Copied!" : "Copy to Clipboard"}
                      </Button>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" /><>

                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription
</>

</>>
                        This token will expire after {expiresInMinutes} minutes and can only be used once.
                        Share it securely with the developer.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between"><>

                  <CardTitle>Active Dev Tokens</CardTitle>
                  <div
</>

className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchTokens()}
                      disabled={!selectedUser || isLoadingTokens}
                    ><>

                      <Refresh className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    
                    <AlertDialog
</>

</>>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          disabled={cleanupTokensMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cleanup Expired
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><>

                          <AlertDialogTitle>Cleanup Expired Tokens</AlertDialogTitle>
                          <AlertDialogDescription
</>

</>>
                            This will mark all expired dev tokens as used across all users.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter><>

                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
</>

                            onClick={() => cleanupTokensMutation.mutate()}
                          >
                            {cleanupTokensMutation.isPending ? "Cleaning..." : "Cleanup"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>
                  View and manage active development authentication tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2"><>

                    <Label htmlFor="userSelector">Select User</Label>
                    <Select
</>

                      value={selectedUser?.toString() || ""} 
                      onValueChange={(value) => setSelectedUser(parseInt(value))}
                    >
                      <SelectTrigger id="userSelector"><>

                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent
</>

</>>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>
                            Loading users...
                          </SelectItem>
                        ) : (
                          users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {tokensError && (
                    <ApiError
                      title="Failed to Load Tokens"
                      error={tokensError instanceof Error ? tokensError : new Error("Unknown error")}
                      onRetry={() => refetchTokens()}
                    />
                  )}

                  {isLoadingTokens && selectedUser ? (
                    <div className="py-8 text-center">
                      <svg className="animate-spin mx-auto h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><>

                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
</>

className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-2 text-sm text-muted-foreground">Loading tokens...</p>
                    </div>
                  ) : selectedUser && tokens && tokens.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow><>

                            <TableHead>Description</TableHead>
                            <TableHead
</>

</>>Created</TableHead><>

                            <TableHead>Expires</TableHead>
                            <TableHead
</>

</>>Created By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokens.map((token) => (
                            <TableRow key={token.id}><>

                              <TableCell className="font-medium">{token.description}</TableCell>
                              <TableCell
</>

</>>{formatDate(token.createdAt)}</TableCell><>

                              <TableCell>{formatDate(token.expiresAt)}</TableCell>
                              <TableCell
</>

</>>{token.createdBy}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                    >
                                      Revoke
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><>

                                      <AlertDialogTitle>Revoke Development Token</AlertDialogTitle>
                                      <AlertDialogDescription
</>

</>>
                                        This will immediately invalidate this token.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter><>

                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
</>

                                        onClick={() => revokeTokenMutation.mutate(token.id)}
                                      >
                                        {revokeTokenMutation.isPending ? "Revoking..." : "Revoke Token"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : selectedUser ? (
                    <div className="py-8 text-center border rounded-md">
                      <UserPlus className="mx-auto h-8 w-8 text-muted-foreground" /><>

                      <h3 className="mt-2 text-sm font-semibold">No Active Tokens</h3>
                      <p
</>

className="text-sm text-muted-foreground">
                        There are no active development tokens for this user.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          const tabElement = document.querySelector('[data-value="generate"]');
                          if (tabElement) {
                            (tabElement as HTMLElement).click();
                          }
                        }}
                      >
                        Generate a New Token
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center border rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Select a user to view their active development tokens
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <p>
                  Only unexpired and unused tokens are shown.
                  Tokens are automatically marked as used after authentication.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}