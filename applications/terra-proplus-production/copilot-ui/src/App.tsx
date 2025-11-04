import React, { useState } from "react";
import CopilotPanel from "./components/CopilotPanel";
import AICopilotOnboarding from "./components/AICopilotOnboarding";
import { AICopilotProvider, useAICopilot } from "./context/AICopilotContext";

function MainApp() {
  const { aiLevel, setAILevel } = useAICopilot();
  const [onboardingOpen, setOnboardingOpen] = useState(true);
  const [context, setContext] = useState({});

  const handleOnboardingSave = () => setOnboardingOpen(false);

  return (
    <>
      <AICopilotOnboarding
        open={onboardingOpen}
        value={aiLevel}
        onChange={setAILevel}
        onSave={handleOnboardingSave}
      />
      <CopilotPanel context={context} />
    </>
  );
}

export default function App() {
  return (
    <AICopilotProvider>
      <MainApp />
    </AICopilotProvider>
  );
}
