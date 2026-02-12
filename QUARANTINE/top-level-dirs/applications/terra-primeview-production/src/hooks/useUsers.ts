
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// For now, we'll create a mock user type since the users table doesn't exist yet
export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  county_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export function useUsers(countyId?: string) {
  return useQuery({
    queryKey: ["users", countyId],
    queryFn: async () => {
      // Return mock data since users table doesn't exist yet
      console.log("Users table not available yet - returning mock data");
      const mockUsers: User[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'admin@terrafusion.platform',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin',
          county_id: countyId,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      return mockUsers;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      // Return mock data since users table doesn't exist yet
      console.log("Users table not available yet - returning mock user");
      const mockUser: User = {
        id: userId,
        email: 'admin@terrafusion.platform',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockUser;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (user: any) => {
      console.log("Create user not available yet - users table doesn't exist");
      throw new Error("Users table not available yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log("Update user not available yet - users table doesn't exist");
      throw new Error("Users table not available yet");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", data?.id] });
    },
  });
}
