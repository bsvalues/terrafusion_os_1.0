import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface UseWebSocketResourceOptions {
  resource: string;
  params?: any;
  initialData?: any;
  transformData?: (data: any) => any;
  autoFetch?: boolean;
  enabled?: boolean;
}

interface UseWebSocketResourceReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateResource: (updates: any) => void;
}

/**
 * Hook for working with WebSocket-based resources
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error, refetch } = useWebSocketResource({
 *   resource: 'properties',
 *   params: { userId: 123 }
 * });
 *
 * // With transformation
 * const { data } = useWebSocketResource({
 *   resource: 'comps',
 *   params: { propertyId: 456 },
 *   transformData: (data) => data.map(comp => ({ ...comp, score: comp.score.toFixed(2) }))
 * });
 *
 * // Manual fetch
 * const { data, refetch } = useWebSocketResource({
 *   resource: 'valuations',
 *   autoFetch: false,
 * });
 *
 * // Update a resource
 * const { updateResource } = useWebSocketResource({
 *   resource: 'properties'
 * });
 * updateResource({ id: 123, status: 'approved' });
 */
export function useWebSocketResource<T = any>({
  resource,
  params = {},
  initialData = null,
  transformData,
  autoFetch = true,
  enabled = true,
}: UseWebSocketResourceOptions): UseWebSocketResourceReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(autoFetch && enabled);
  const [error, setError] = useState<Error | null>(null);
  const { isConnected, send } = useWebSocket();

  // Listen for resource updates
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "resource_update" && message.resource === resource) {
          const newData = transformData ? transformData(message.data) : message.data;
          setData(newData);
          setIsLoading(false);
        }

        if (message.type === "resource_error" && message.resource === resource) {
          setError(new Error(message.message || "Unknown error"));
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    };

    // Add event listener
    window.addEventListener("message", handleMessage);

    // Initial fetch if auto-fetch is enabled
    if (autoFetch && isConnected) {
      fetchResource();
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [resource, isConnected, enabled]);

  // Function to fetch the resource
  const fetchResource = useCallback(() => {
    if (!isConnected || !enabled) return;

    setIsLoading(true);
    setError(null);

    send({
      type: "resource_request",
      resource,
      params,
    });
  }, [isConnected, resource, params, enabled]);

  // Function to update a resource
  const updateResource = useCallback(
    (updates: any) => {
      if (!isConnected || !enabled) return;

      send({
        type: "resource_update",
        resource,
        updates,
      });
    },
    [isConnected, resource, enabled]
  );

  return { data, isLoading, error, refetch: fetchResource, updateResource };
}
