import React from "react";
import { useMinimal } from "./contexts/MinimalContext";

function MinimalApp() {
  const { userName } = useMinimal();

  return (
    <div className="p-8"><>

      <h1 className="text-3xl font-bold mb-4">Minimal Test App</h1>
      <p
</> className="text-lg">User Name: {userName}</p>
    </div>
  );
}

export default MinimalApp;
