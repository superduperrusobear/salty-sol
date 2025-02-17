/// <reference types="react" />
/// <reference types="next" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '@heroicons/react/24/outline';
declare module 'framer-motion';

declare global {
  interface Window {
    ethereum: {
      request: <T>(args: { method: string; params?: unknown[] }) => Promise<T>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
} 