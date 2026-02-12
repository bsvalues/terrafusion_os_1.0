/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_TERRA_AGENT_DEBUG: string
  readonly VITE_QUANTUM_FACTOR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
