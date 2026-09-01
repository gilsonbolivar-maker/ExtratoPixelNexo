// Base das chamadas de API.
//
// No navegador (PWA) o app e o backend Express sao servidos pela mesma origem,
// entao o padrao vazio mantem as chamadas relativas ("/api/...").
// No APK (Capacitor) a pagina roda em https://localhost e nao existe backend
// local: defina VITE_API_BASE_URL no build para apontar ao servidor hospedado.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
