import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

declare module 'y-websocket' {
  export class WebsocketProvider {
    constructor(
      serverUrl: string,
      roomName: string,
      doc: Y.Doc,
      options?: {
        connect?: boolean;
        awareness?: Awareness;
        params?: { [key: string]: string };
        WebSocketPolyfill?: any;
        resyncInterval?: number;
        maxBackoffTime?: number;
        disableBc?: boolean;
      }
    );
    
    awareness: Awareness;
    on(eventName: string, callback: Function): void;
    off(eventName: string, callback: Function): void;
    connect(): void;
    disconnect(): void;
    destroy(): void;
  }
}

declare module 'y-websocket/bin/utils' {
  import * as Y from 'yjs';
  import { Awareness } from 'y-protocols/awareness';
  import { WebsocketProvider } from 'y-websocket';
  
  export function setupWSConnection(
    conn: any,
    req: any,
    opts?: {
      docName?: string | ((req: any) => string);
      gc?: boolean;
    }
  ): void;
  
  export interface SetupWSServerOptions {
    host?: string;
    port?: number;
    server?: any;
    path?: string;
    pingTimeout?: number;
    gcEnabled?: boolean;
  }
  
  export function setupWSServer(
    options: SetupWSServerOptions,
    handler?: (doc: Y.Doc, conn: any, req: any) => void
  ): any;
  
  export interface PersistenceOptions {
    bindState: (docName: string, ydoc: Y.Doc) => void;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<any>;
    provider?: any;
  }
  
  export function setPersistence(persistenceOptions: PersistenceOptions): void;
}