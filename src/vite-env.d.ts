/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base do backend usada no APK (Capacitor). Vazio = mesma origem (PWA). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
