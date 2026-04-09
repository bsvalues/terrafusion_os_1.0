declare module 'y-protocols/awareness' {
  export class Awareness {
    constructor(doc: any);
    getLocalState(): any;
    setLocalState(state: any): void;
    getStates(): Map<number, any>;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    destroy(): void;
  }
}