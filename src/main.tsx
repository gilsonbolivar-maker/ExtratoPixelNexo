import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PrivacyProvider } from './context/PrivacyContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PrivacyProvider>
        <App />
      </PrivacyProvider>
    </ThemeProvider>
  </StrictMode>,
);

// Registra o service worker apenas no PWA (no APK o Capacitor ja empacota os assets).
const isNative = Boolean((window as unknown as {Capacitor?: {isNativePlatform?: () => boolean}}).Capacitor?.isNativePlatform?.());
if ('serviceWorker' in navigator && !isNative && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Falha ao registrar o service worker:', err);
    });
  });
}
