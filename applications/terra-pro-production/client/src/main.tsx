import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";

// Create the root element first
const root = createRoot(document.getElementById("root")!);

console.log("Terrafusion: Loading unified modern application");

// Load the main App component with all routes
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
