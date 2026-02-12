/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TELEMETRY?: string;
  readonly VITE_APP_INSIGHTS_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
