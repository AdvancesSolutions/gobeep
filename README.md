# BeepApp Mobile Companion 🐝📱

O **BeepApp Mobile** e o aplicativo de compania gamificado para a rede de telas e Smart TVs do ecossistema **BEEP**. Desenvolvido com foco em alta performance, interatividade em tempo real e design premium.

Este aplicativo permite aos usuarios interagir diretamente com a programacao da TV, enviar reacoes, participar de enquetes, controlar canais e conversar no chat ao vivo integrado a tela da TV.

---

## 🚀 Principais Recursos

### 1. 📺 Controle Remoto de TV
* Interface interativa para mudar de canais, controlar o volume, navegar na grade e enviar comandos chaves (D-Pad).
* Seletor multitela que permite a um unico celular alternar o controle de multiplas TVs pareadas.

### 2. 💬 Chat ao Vivo Integrado
* Conversas em tempo real sincronizadas instantaneamente com o aplicativo web rodando na TV.
* Sincronizacao de feed de reacoes (Emojis gigantes na tela da TV) e controle de enquetes ativas.

### 3. ⚡ Conectividade por PIN ou QR Code
* Tela unica de pareamento ([PairingContainer](src/components/PairingContainer.tsx)) que suporta:
  * **PIN de 6 digitos** digitado no teclado.
  * **QR Code Scanner** de alta performance com controle de lanterna (Torch) integrado.
  * **Vinculo por Rede:** Pareamento automatico na rede local via descoberta UDP/Socket.

### 4. 🔄 Atualizacoes OTA (Over-The-Air) com Indicador de Progresso
* Mecanismo nativo de atualizacoes silenciosas do Expo Updates ativado de fabrica no Android.
* **Modal de Progresso:** Ao carregar uma atualizacao no boot, o aplicativo exibe uma tela de loading animada com uma barra de progresso horizontal amarela (`Atualizando o App... 🐝`) e reinicia automaticamente apos o termino.

### 5. 🎢 Layout Responsivo e Animacoes Suaves
* Animacoes fluidas de entrada e saida desenvolvidas em **React Native Reanimated 3**.
* Reposicionamento e encolhimento inteligente dos avatares e titulos quando o teclado do celular e aberto, evitando que o teclado sobreponha os campos de entrada (inputs).

---

## 🛠️ Tecnologias Utilizadas

* **Framework Base:** React Native & Expo SDK 54 (Expo Router v3)
* **Linguagem:** TypeScript
* **Interface & Estilo:** Tailwind CSS / NativeWind
* **Animacoes:** React Native Reanimated 3
* **Iconografia:** Lucide React Native
* **Conectividade:** Socket.io-client (WebSockets na porta `3001` da rede interna)
* **Sensores & Camera:** Expo Camera (CameraView com barcode scanner) e Expo Haptics (retorno vibratorio).

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
* Node.js v18 ou superior
* Expo CLI instalado globalmente (`npm install -g expo-cli`)
* Emulator Android ou Celular Fisico conectado

### Instalação
1. Clone o projeto e instale as dependencias:
   ```bash
   npm install
   ```

2. Inicie o Metro Server de desenvolvimento:
   ```bash
   npx expo start
   ```

---

## 📦 Como Compilar o APK Release Localmente

A compilacao local e feita usando o Gradle direto do Android SDK na sua maquina Windows.

1. **Configurar as Variaveis de Ambiente** no terminal do PowerShell:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
   $env:ANDROID_HOME="C:\Users\Alessandro\AppData\Local\Android\Sdk"
   $env:Path="$env:JAVA_HOME\bin;C:\Users\Alessandro\AppData\AndroidCLI;" + $env:Path
   ```

2. **Compilar o APK** em modo release:
   ```powershell
   cd android
   .\gradlew.bat assembleRelease
   ```

O Gradle ira gerar o arquivo APK na pasta de outputs com o nome ja taggeado com a versao, por exemplo:
👉 `android/app/build/outputs/apk/release/BeepApp-v1.0.3-release.apk`

---

## ⚡ Atalho de Instalação via ADB (Xiaomi/MIUI Bypass)

Para pular as verificacoes demoradas de seguranca do instalador nativo da Xiaomi ao instalar o APK local, conecte o celular no USB e rode:

```powershell
& "C:\Users\Alessandro\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r android/app/build/outputs/apk/release/BeepApp-v1.0.3-release.apk
```

---

## 🔄 Como Publicar Atualizações OTA (EAS Update)

Para enviar mudancas de JavaScript/Design para o celular de forma instantanea sem precisar gerar e baixar um novo APK:

```powershell
eas update --channel preview --platform android --message "Descreva suas alteracoes aqui"
```
*(Certifique-se de estar logado na sua conta da Expo via `eas login`).*

---

## 📁 Estrutura de Pastas Chave

* **`app/`**: Rotas e telas organizadas pelo Expo Router.
  * `app/index.tsx`: Tela de boas-vindas e onboarding inteligente.
  * `app/tv-chat.tsx`: Interface do chat integrada com a TV.
  * `app/tv-remote.tsx`: Tela de controle remoto da TV.
  * `app/(tabs)/`: Telas principais acessiveis pela Tab Bar (Home, Social, Carteira, Perfil).
* **`src/`**: Componentes e contextos compartilhados do aplicativo.
  * `src/components/PairingContainer.tsx`: Componente de vinculo com a TV (PIN/QR Code).
  * `src/contexts/SocketContext.tsx`: Gerenciador de estado do WebSocket com a TV BeepApp.
  * `src/components/TVRemote.tsx`: Componentes de botoes e D-Pad do controle.
