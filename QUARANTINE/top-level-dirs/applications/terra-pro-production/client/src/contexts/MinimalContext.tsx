import React, { createContext, useContext, useState, ReactNode } from "react";

// Define a simple type with no external dependencies
interface MinimalContextType {
  userName: string;
  setUserName: (name: string) => void;
}

// Create the context
const MinimalContext = createContext<MinimalContextType | undefined>(undefined);

// Create the hook
export function useMinimal() {
  const context = useContext(MinimalContext);
  if (context === undefined) {
    throw new Error("useMinimal must be used within a MinimalProvider");
  }
  return context;
}

// Provider component
interface MinimalProviderProps {
  children: ReactNode;
}

export function MinimalProvider({ children }: MinimalProviderProps) {
  const [userName, setUserName] = useState<string>("John Doe");

  const value = {
    userName,
    setUserName,
  };

  return <MinimalContext.Provider value={value}>{children}</MinimalContext.Provider>;
}
