// Type augmentation for global fetch mock in tests
interface Window {
  fetch: any;
}

declare namespace NodeJS {
  interface Global {
    fetch: any;
  }
}

declare var global: NodeJS.Global & typeof globalThis;