import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type MessageType = 'broadcast' | 'direct';

export interface Message {
  id: string;
  type: MessageType;
  sourceModuleId: string;
  targetModuleId?: string;
  event: string;
  payload: any;
  timestamp: number;
}

export type MessageListener = (message: Message) => void;

export interface MessageBusState {
  // State
  history: Message[];

  // Actions
  publish: (sourceModuleId: string, event: string, payload: any, targetModuleId?: string) => void;
  subscribe: (listener: MessageListener) => () => void;
  clearHistory: () => void;
}

// ============================================================================
// Store
// ============================================================================

// External listener set to avoid React render cycles for non-subscribers
const listeners = new Set<MessageListener>();

export const useMessageBusStore = create<MessageBusState>()(
  devtools(
    (set, get) => ({
      history: [],

      publish: (sourceModuleId, event, payload, targetModuleId) => {
        const message: Message = {
          id: crypto.randomUUID(),
          type: targetModuleId ? 'direct' : 'broadcast',
          sourceModuleId,
          targetModuleId,
          event,
          payload,
          timestamp: Date.now(),
        };

        // Add to history (limit to last 100 to prevent memory leaks)
        set((state) => ({
          history: [message, ...state.history].slice(0, 100),
        }));

        // Notify listeners
        listeners.forEach((listener) => {
          try {
            listener(message);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
      },

      subscribe: (listener: MessageListener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },

      clearHistory: () => set({ history: [] }),
    }),
    { name: 'TerraFusion-MessageBus-Store' }
  )
);

export default useMessageBusStore;
