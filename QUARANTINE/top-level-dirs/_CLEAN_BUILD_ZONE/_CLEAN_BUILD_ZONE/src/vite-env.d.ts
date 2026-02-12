/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron preload API typing
declare global {
  interface _Window {
    electronAPI: {
      getOSConnectionState: () => Promise<any>;
      onOSConnectionState: (_callback: (_state: any) => void) => () => void;
      getCountyConfig: () => Promise<any>;
      createAuthEnvelope: (_countyId: string, _legacySystem: string) => Promise<any>;
      removeAllListeners: (_channel: string) => void;
      invokePlugin: (_moduleName: string, _method: string, _payload?: any) => Promise<any>;
      emitPlugin: (_moduleName: string, _event: string, _data?: any) => void;
      getSystemMetrics: () => Promise<any>;
    };
  }
}

// Plugin system types
interface PluginContext {
  moduleName: string;
  countyConfig: any;
  sessionId: string | null;
  os: {
    invoke: (_method: string, _payload?: any) => Promise<any>;
    emit: (_event: string, _data?: any) => void;
  };
}

interface _PluginModule {
  mount: (_el: HTMLElement, _context: PluginContext) => Promise<void>;
  unmount?: (_el: HTMLElement) => Promise<void>;
}

export {};
