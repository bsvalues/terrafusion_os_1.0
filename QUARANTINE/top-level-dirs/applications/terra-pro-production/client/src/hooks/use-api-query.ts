import React, { useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for standardized data fetching
 */
export function useApiQuery<TData = unknown, TError = Error>(
  endpoint: string | string[],
  options?: Omit<UseQueryOptions<TData, TError, TData>, "queryKey" | "queryFn"> & {
    /**
     * Whether to show error toast on failure
     */
    showErrorToast?: boolean;
    /**
     * Custom error message for toast
     */
    errorMessage?: string;
  }
) {
  const { toast } = useToast();
  const { showErrorToast = true, errorMessage, ...queryOptions } = options || {};

  // Construct query key
  const queryKey = Array.isArray(endpoint) ? endpoint : [endpoint];

  // Create a standardized query hook
  const result = useQuery<TData, TError>({
    queryKey,
    queryFn: () => apiRequest(Array.isArray(endpoint) ? endpoint[0] : endpoint),
    ...queryOptions,
  });

  // Show error toast if there's an error
  const { error, status } = result;

  // Show error toast only once when status becomes 'error'
  useEffect(() => {
    if (status === "error" && error && showErrorToast) {
      toast({
        title: "Error",
        description:
          errorMessage || (error instanceof Error ? error.message : "Failed to fetch data"),
        variant: "destructive",
      });
      console.error(`Error fetching from ${endpoint}:`, error);
    }
  }, [status, error, showErrorToast, toast, errorMessage, endpoint]);

  return result;
}

/**
 * Hook for standardized data mutation (POST, PUT, DELETE)
 */
export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = Error,
  TContext = unknown,
>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn"> & {
    /**
     * HTTP method to use
     */
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    /**
     * Whether to show success toast
     */
    showSuccessToast?: boolean;
    /**
     * Success message for toast
     */
    successMessage?: string;
    /**
     * Whether to show error toast
     */
    showErrorToast?: boolean;
    /**
     * Error message for toast
     */
    errorMessage?: string;
    /**
     * Query keys to invalidate on success
     */
    invalidateQueryKeys?: Array<string | string[]>;
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    method = "POST",
    showSuccessToast = true,
    successMessage = "Operation completed successfully",
    showErrorToast = true,
    errorMessage,
    invalidateQueryKeys = [],
    ...mutationOptions
  } = options || {};

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: (variables) =>
      apiRequest(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables),
      }),
    onSuccess: (data, variables, context) => {
      // Invalidate queries
      invalidateQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });

      // Show success toast
      if (showSuccessToast) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error toast
      if (showErrorToast) {
        toast({
          title: "Error",
          description:
            errorMessage || (error instanceof Error ? error.message : "Operation failed"),
          variant: "destructive",
        });
      }

      console.error(`Error in mutation to ${endpoint}:`, error);

      // Call original onError if provided
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}

/**
 * Hook for standardized form data mutation (file uploads)
 */
export function useApiFormMutation<TData = unknown, TError = Error, TContext = unknown>(
  endpoint: string,
  options?: Omit<UseMutationOptions<TData, TError, FormData, TContext>, "mutationFn"> & {
    /**
     * HTTP method to use
     */
    method?: "POST" | "PUT";
    /**
     * Whether to show success toast
     */
    showSuccessToast?: boolean;
    /**
     * Success message for toast
     */
    successMessage?: string;
    /**
     * Whether to show error toast
     */
    showErrorToast?: boolean;
    /**
     * Error message for toast
     */
    errorMessage?: string;
    /**
     * Query keys to invalidate on success
     */
    invalidateQueryKeys?: Array<string | string[]>;
  }
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    method = "POST",
    showSuccessToast = true,
    successMessage = "File uploaded successfully",
    showErrorToast = true,
    errorMessage,
    invalidateQueryKeys = [],
    ...mutationOptions
  } = options || {};

  return useMutation<TData, TError, FormData, TContext>({
    mutationFn: (formData) =>
      apiRequest(endpoint, {
        method,
        body: formData,
      }),
    onSuccess: (data, variables, context) => {
      // Invalidate queries
      invalidateQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });

      // Show success toast
      if (showSuccessToast) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error toast
      if (showErrorToast) {
        toast({
          title: "Error",
          description:
            errorMessage || (error instanceof Error ? error.message : "File upload failed"),
          variant: "destructive",
        });
      }

      console.error(`Error in form mutation to ${endpoint}:`, error);

      // Call original onError if provided
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}
