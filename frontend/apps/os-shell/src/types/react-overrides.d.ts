// Global type overrides for development stability
declare module '@radix-ui/react-*' {
  export * from '@radix-ui/react-primitive';
}

declare global {
  namespace React {
    type ReactNode =
      | ReactElement
      | string
      | number
      | ReactFragment
      | ReactPortal
      | boolean
      | null
      | undefined;
  }
}

// Suppress specific error patterns
declare module '*.stories.tsx' {
  const content: any;
  export default content;
}

declare module '*.test.tsx' {
  const content: any;
  export default content;
}

export {};
