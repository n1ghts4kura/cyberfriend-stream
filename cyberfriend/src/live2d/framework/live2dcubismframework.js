// Re-export stub to allow extension-less imports while keeping original TypeScript source.
// This file intentionally thin: DO NOT add logic; place customizations in wrapper files.
export * from './live2dcubismframework.ts';
// Neutralized placeholder. Real implementation is in live2dcubismframework.ts and aggregated via frameworkEntry.js.
// Intentionally left blank to avoid circular/duplicate exports causing runtime undefined constants.
export {}; 
