import React, { createContext, useContext, useState } from "react";

const AICopilotContext = createContext({
  aiLevel: 1,
  setAILevel: (level: number) => {},
});

export function useAICopilot() {
  return useContext(AICopilotContext);
}

export function AICopilotProvider({ children }) {
  const [aiLevel, setAILevel] = useState(1); // 0=minimal, 1=smart, 2=full
  return (
    <AICopilotContext.Provider value={{ aiLevel, setAILevel }}>
      {children}
    </AICopilotContext.Provider>
  );
}
