/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_TELEMETRY?: string
  readonly VITE_APP_INSIGHTS_KEY?: string
  readonly VITE_QUANTUM_FACTOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
