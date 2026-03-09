import { useCallback, useEffect } from 'react';
import { Message, useMessageBusStore } from '../stores/messageBusStore';

/**
 * Hook for modules to communicate with each other via the Message Bus.
 *
 * @param moduleId - The ID of the module using this hook
 * @returns Object containing sendMessage function and useSubscription hook
 *
 * @example
 * ```tsx
 * const { sendMessage, useSubscription } = useModuleMessaging('my-module');
 *
 * // Send a message
 * sendMessage('DATA_UPDATED', { id: 123 });
 *
 * // Listen for messages
 * useSubscription('DATA_UPDATED', (payload, source) => {
 *   console.debug('Received update from', source, payload);
 * });
 * ```
 */
export function useModuleMessaging(moduleId: string) {
  const publish = useMessageBusStore((state) => state.publish);
  const subscribe = useMessageBusStore((state) => state.subscribe);

  /**
   * Send a message to other modules
   */
  const sendMessage = useCallback(
    (event: string, payload: any, targetModuleId?: string) => {
      publish(moduleId, event, payload, targetModuleId);
    },
    [moduleId, publish]
  );

  /**
   * Subscribe to a specific event
   * This is a custom hook that should be called at the top level of your component
   */
  const useSubscription = (event: string, callback: (payload: any, source: string) => void) => {
    useEffect(() => {
      const unsubscribe = subscribe((message: Message) => {
        // Filter: Must be the event we want
        if (message.event !== event) return;

        // Filter: Must be broadcast OR directed to us
        if (message.type === 'direct' && message.targetModuleId !== moduleId) return;

        // Filter: Don't listen to ourselves
        if (message.sourceModuleId === moduleId) return;

        callback(message.payload, message.sourceModuleId);
      });

      return unsubscribe;
    }, [event, callback]);
  };

  return {
    sendMessage,
    useSubscription,
  };
}
