import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIAssistantContextType {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  availableProviders: string[];
}

// Create context with default values
const AIAssistantContext = createContext<AIAssistantContextType>({
  messages: [],
  sendMessage: async () => {},
  loading: false,
  selectedProvider: 'openai',
  setSelectedProvider: () => {},
  availableProviders: []
});

// Define provider props interface
interface AIAssistantProviderProps {
  children: ReactNode;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  // Fetch available providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/ai-assistant/providers');
        
        if (!response.ok) {
          throw new Error(`Error fetching providers: ${response.status}`);
        }
        
        const data = await response.json();
        setAvailableProviders(data.providers);
        
        // Set default provider if available
        if (data.providers.length > 0 && !data.providers.includes(selectedProvider)) {
          setSelectedProvider(data.providers[0]);
        }
      } catch (error) {
        console.error('Failed to fetch available AI providers:', error);
      }
    };
    
    fetchProviders();
  }, []);

  // Send message to AI assistant API
  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Prepare context for API request
      const context = {
        recentMessages: messages.slice(-10), // Last 10 messages for context
      };
      
      // Make API request
      const response = await fetch('/api/ai-assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          provider: selectedProvider,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI assistant response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `Sorry, I encountered an error. Please try again later.`,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Create context value
  const contextValue: AIAssistantContextType = {
    messages,
    sendMessage,
    loading,
    selectedProvider,
    setSelectedProvider,
    availableProviders
  };

  return (
    <AIAssistantContext.Provider value={contextValue}>
      {children}
    </AIAssistantContext.Provider>
  );
};

// Custom hook for using the AI assistant context
export const useAIAssistant = () => useContext(AIAssistantContext);