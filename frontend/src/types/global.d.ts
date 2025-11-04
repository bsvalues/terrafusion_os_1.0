// Global type declarations for Terrafusion OS

declare global {
  interface Window {
    electronAPI?: {
      getOSConnectionState: () => Promise<any>;
      onOSConnectionState: (_callback: (_state: any) => void) => () => void;
      getCountyConfig: () => Promise<any>;
      invokePlugin: (_moduleName: string, _method: string, _payload: any) => Promise<any>;
      emitPlugin: (_moduleName: string, _event: string, _data: any) => void;
      getSystemMetrics: () => Promise<any>;
    };
    gtag?: (_command: string, _targetId: string, _config?: any) => void;
  }

  // Extend ServiceWorkerRegistration for background sync
  interface ServiceWorkerRegistration {
    sync?: {
      register: (_tag: string) => Promise<void>;
    };
  }

  // Extend PerformanceEntry for FID and CLS metrics
  interface PerformanceEntry {
    processingStart?: number;
    hadRecentInput?: boolean;
    value?: number;
  }

  // Extend RequestInit for custom fetch options
  interface RequestInit {
    timeout?: number;
    compress?: boolean;
  }
}

// Type definitions for species detection
export type SpeciesType = 'carbon' | 'silicon' | 'quantum' | 'hybrid';

export {};
