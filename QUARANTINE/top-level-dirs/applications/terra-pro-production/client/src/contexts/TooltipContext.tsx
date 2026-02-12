import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

// Define the term explanation type
interface TermExplanation {
  definition: string;
  contextualExplanation?: string;
  examples?: string[];
  relatedTerms?: string[];
}

// Define the context value type
interface TooltipContextValue {
  getTermExplanation: (term: string, context?: string) => Promise<TermExplanation | null>;
  isLoading: boolean;
  error: Error | null;
}

// Create the context
const TooltipContext = createContext<TooltipContextValue | undefined>(undefined);

// Props for the provider component
interface TooltipProviderProps {
  children: ReactNode;
}

// Term explanation endpoint
const TERM_EXPLANATION_ENDPOINT = "/api/tooltips/explain";

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getTermExplanation = useCallback(
    async (term: string, context?: string): Promise<TermExplanation | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(TERM_EXPLANATION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ term, context }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get term explanation");
        }

        const data = await response.json();
        setIsLoading(false);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return (
    <TooltipContext.Provider value={{ getTermExplanation, isLoading, error }}>
      {children}
    </TooltipContext.Provider>
  );
};

// Custom hook to use the tooltip context
export const useTooltip = (): TooltipContextValue => {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return context;
};
