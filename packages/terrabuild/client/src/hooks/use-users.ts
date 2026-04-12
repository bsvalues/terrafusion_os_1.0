import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser } from '@/types/api';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// NOTE: No /api/users endpoint in TerraFusion.API yet (uses /api/governmentusers).
// Fails gracefully via React Query error state.

export function useUsers() {
  const { toast } = useToast();

  const { data: users, isLoading, error } = useQuery<User[], Error>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) =>
      apiRequest("/api/users", { method: "POST", body: JSON.stringify(userData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: string | number }) => {
      const { id, ...data } = userData;
      return apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) =>
      apiRequest(`/api/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  };
}
