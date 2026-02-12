// preload.js
// All Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron")

// Expose a secure, limited API to the renderer process (your Next.js app)
contextBridge.exposeInMainWorld("electronAPI", {
  runTestPropertyAgent: () => ipcRenderer.invoke("run-test-property-agent"),
  deployToVercel: () => ipcRenderer.invoke("deploy-to-vercel"), // New API for deployment
  // Listen for deployment logs from main process
  onDeploymentLog: (callback) => ipcRenderer.on("deployment-log", (_event, message) => callback(message)),
  removeDeploymentLogListener: (callback) => ipcRenderer.removeListener("deployment-log", callback),
  // Add other Electron-specific APIs here if needed
})

console.log("Preload script for GAMA Electron loaded with deployment API.")
