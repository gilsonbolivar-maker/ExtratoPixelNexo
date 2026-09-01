# ExtratoPixelNexo — Leitor de Extrato & Gestor Financeiro

Aplicativo de leitura de extratos bancários (OFX, CSV e texto colado),
categorização automática e análise de gastos.

**Todo o processamento acontece no aparelho** — nenhum dado bancário sai do
dispositivo e o app não depende de nenhum serviço externo.

Roda como **PWA** (instalável pelo navegador) e como **APK Android** (via Capacitor).

## Rodar localmente

**Pré-requisitos:** Node.js 22+

```bash
npm install
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

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite + Express) |
| `npm run build` | Build web + bundle do servidor |
| `npm run build:web` | Apenas os assets web (usado pelo APK) |
| `npm run build:apk` | Build web + sincroniza o projeto Android |
| `npm run lint` | Checagem de tipos TypeScript |
