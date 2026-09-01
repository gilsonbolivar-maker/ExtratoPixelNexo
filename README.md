# ExtratoPixelNexo — Leitor de Extrato & Gestor Financeiro

Aplicativo de leitura de extratos bancários (OFX, CSV, PDF, imagens e texto),
categorização automática e análise de gastos com IA.

Roda como **PWA** (instalável pelo navegador) e como **APK Android** (via Capacitor).

## Rodar localmente

**Pré-requisitos:** Node.js 22+

```bash
npm install
# defina GEMINI_API_KEY em .env (veja .env.example)
npm run dev
```

## Gerar o APK

### Opção A — GitHub Actions (sem instalar nada)

1. Vá em **Actions → Build Android APK (ExtratoPixelNexo) → Run workflow**.
2. Ao final, baixe o arquivo em **Artifacts → ExtratoPixelNexo-APK-debug**.

### Opção B — Localmente

**Pré-requisitos:** Node.js 22+, JDK 21, Android SDK (via Android Studio).

```bash
npm install
npm run build:apk                      # vite build + cap sync android
cd android && ./gradlew assembleDebug
# APK em android/app/build/outputs/apk/debug/app-debug.apk
```

## Backend e IA no APK

As funções de IA (`/api/parse-statement`, `/api/analyze-finances`, `/api/chat-advisor`)
rodam no servidor Express (`server.ts`), que precisa da variável `GEMINI_API_KEY`.

| Ambiente | Como as chamadas são resolvidas |
| --- | --- |
| PWA / web | Mesma origem do app — nada a configurar |
| APK (Capacitor) | Precisa de `VITE_API_BASE_URL` apontando para o servidor hospedado |

Defina `VITE_API_BASE_URL` no build (ou o secret `API_BASE_URL` no repositório,
que o workflow injeta automaticamente). Sem isso, o APK funciona normalmente para
importação **OFX/CSV** e controle financeiro, mas as funções de IA ficam indisponíveis.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite + Express) |
| `npm run build` | Build web + bundle do servidor |
| `npm run build:web` | Apenas os assets web (usado pelo APK) |
| `npm run build:apk` | Build web + sincroniza o projeto Android |
| `npm run lint` | Checagem de tipos TypeScript |
