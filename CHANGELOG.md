# Changelog — BeepApp (AppMobile / Expo·EAS)

Registro de melhorias por sessão. Validação: `tsc --noEmit` (0 erros nos arquivos alterados) + `expo export` (OK, bundle gerado).

## 2026-08-12 — Sessão de evolução (pareamento + atualizações)

### Pareamento robusto
- **`PairingContainer.tsx`**: tela única de pareamento. QR tolerante (`beep://pair?pin=` ou PIN puro); re-scan automático; controle de torch (lanterna); feedback de status ("Pareado! ✓ TV Online").
- **`SocketContext.tsx`** (`pairTV`): validação do PIN com regex `^\d{6}$`; ack/timeout de 8s (evita "pareado falso" se o servidor não emitir confirmação); estados `pairStatus` / `pairError`.

### Heartbeat TV ↔ celular
- **`SocketContext.tsx`**: loop de `ping_tv` a cada 5s com timeout de 3s; escuta `pong_tv` e `pair_lost`; expõe `tvOnline` para a UI.
- **`TVRemote.tsx`**: indicador 🟢/🔴 "TV Online" baseado em `tvOnline`.

### Persistência de pareamento
- **`SocketContext.tsx`**: `AsyncStorage` salva `pin`/`room` no `pair_success`; re-pareia automaticamente no `connect`; limpa ao `resetPair`. O celular continua pareado após reinício do app.

### EAS Update sob demanda
- **`app/diagnostics.tsx`**: tela de diagnóstico com botão "Verificar e instalar atualização" usando `checkForUpdateAsync` + `fetchUpdateAsync` + `reloadAsync` (canal `preview`).

### Controle remoto: troca de canal pela TV (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `requestChannels`, `channels` e `changeChannelById`; pede a lista de canais à TV (`request_channels`) automaticamente quando o `pong_tv` indica que a TV ficou online; emite `tv_channel_changed` com `channelId` ao trocar.
- **`TVRemote.tsx`**: substitui o botão fixo "Enviar Ao Vivo" por uma lista real dos canais da TV (responde ao `channels_list`), rolável, com toque para trocar o canal ativo na TV.

### Chat ao vivo compartilhado (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `sendChat` e `chatMessages`; escuta `chat_message` e mantém as últimas 50 mensagens.
- **`TVRemote.tsx`**: seção "Chat ao Vivo" com lista de balões (Eu/TV) e campo de texto para enviar mensagens à TV em tempo real.

### Controle remoto do vídeo (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `sendControl`; emite `tv_control` com ações play/pause/volup/voldown/mute/unmute.
- **`TVRemote.tsx`**: seção "Controle do Vídeo" com botões Play/Pause/Vol+/Vol-/Mute/Unmute.

### Votações em tempo real (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `votePoll` e `castVote`; escuta `vote_start`/`vote_results` da TV.
- **`TVRemote.tsx`**: seção "Votação" que aparece quando a TV abre enquete; mostra opções com barras de porcentagem ao vivo e permite votar por toque (desabilita após encerrar).

### D-Pad virtual (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `sendKey`; emite `tv_keypress` com a tecla (ArrowLeft/Right/Up/Down/Enter/Backspace).
- **`TVRemote.tsx`**: seção "D-Pad (espelha na TV)" com grade visual de setas + OK + Back que envia `tv_keypress`.

### Continue assistindo cruzado (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `nowWatching` e `setNowWatching`; escuta `now_watching` (TV↔celular) e emite para sincronizar o canal atual.
- **`TVRemote.tsx`**: card "Assistindo agora" no topo quando a TV está com um canal; botões "Continuar na TV" (troca canal via `changeChannelById`) e "Sincronizar" (reenvia `now_watching`).

### Feed de reações no celular (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `reactionFeed`; escuta `reaction_feed` (agregado TV+celular do servidor). `sendReaction` agora é escutado pelo servidor (antes era perdido).
- **`TVRemote.tsx`**: seção "Feed de Reações" com contagem por emoji (chips) e lista das 12 mais recentes; o grid de emojis abaixo continua enviando reações.

### Companion de estatísticas (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `stats` e `getStats`; escuta `stats` (do servidor) e emite `get_stats` ao parear e no botão atualizar.
- **`TVRemote.tsx`**: seção "Estatísticas" com cards de Reações / Canais / Minutos assistidos, saldo Beepix e botão "Atualizar".

### Notificação TV online/offline (sessão 2026-08-13)
- **`SocketContext.tsx`**: escuta `tv_status` {online}; atualiza `tvOnline`, re-pede canais (`request_channels`) quando a TV volta e limpa erro de pareamento.
- **`TVRemote.tsx`**: toast temporário "📺 TV Online!" (verde) / "📴 TV Offline" (vermelho) ao detectar mudança de status da TV.

### Perfil único Beepix (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `beepix` e `getBeepix`; escuta `beepix_sync` (saldo absoluto do servidor) e emite `beepix_get` ao parear.
- **`TVRemote.tsx`**: card "Perfil Beepix" com saldo (formatado pt-BR) e botão "Sincronizar".

### Auto-vínculo por rede (sessão 2026-08-13)
- **`SocketContext.tsx`**: adiciona `autoPair`; emite `auto_pair` e resolve no ack/timeout.
- **`PairingContainer.tsx`**: botão "⚡ Auto-vincular na mesma rede (sem PIN)" que dispara `autoPair`.

### Deep link compartilhar (sessão 2026-08-13)
- **`SocketContext.tsx`**: importa `Linking`; listener captura `beepapp://watch?channel=ID` e chama `changeChannelById` (ou guarda em `pendingDeepLinkRef` se não pareado ainda).
- **`TVRemote.tsx`**: botão "📤" em cada canal que gera o link e usa `Share.share`.

### 1 celular várias TVs (sessão 2026-08-13)
- **`SocketContext.tsx`**: `pairedTVs`/`activePin`/`selectTV`; todas as funções de comando anexam `pin: activePin`; listener `paired` registra a TV.
- **`TVRemote.tsx`**: seletor horizontal de TVs pareadas (chips).
- **`TVApp.tsx`**: em `handlePairingRequest` emite `register_tv` com `{ pin }`.
- Removidos `PairingScreen.tsx` e `CameraScanner.tsx` (telas duplicadas/órfãs, sem referências). `PairingContainer` é a tela única.

### Correções de UI / Onboarding (sessão 2026-08-14)
- **`global.css`**: `--primary` (light) padronizado para `45 100% 50%` (exatamente `#ffcc00`), igual ao FAB e ao amarelo dos cards. Removeu tom laranjado divergente (`40 90% 38%`).
- **`components/CustomTabBar.tsx`**: botão "TV — Imagem" do FAB corrigido de `#d99b00` → `#ffcc00` (amarelo único). FAB central ocultado durante o Onboarding (lê `beep_onboarded`).
- **`app/_layout.tsx`**: `useColorScheme` agora vem do `nativewind` (aplica classe `dark` no root); `ThemeProvider` (react-navigation) alterna Dark/Light dinamicamente; lê `beep_theme` salvo no onboarding e sincroniza; adicionada `Stack.Screen name="chat"` (corrige botão de Chat do header que não navegava).
- **`app/index.tsx` (Onboarding)**: indicador de steps reforçado (segmento ativo em `#ffcc00` com glow); animação de pulso (`stepPulse`) no indicador 3/3 para sinalizar conclusão.
- **`app/(tabs)/wallet.tsx`**: corrigido `width` indefinido (ReferenceError que impedia abrir a tela) — agora extraído de `Dimensions.get('window')`.
- **`app/(tabs)/social.tsx`**: feed com 8 posts fake (mock) para testar rolagem; cards com `bg-card border-2 shadow-lg` para contraste.

### Deploy
- `eas_update.sh` / `eas_update.ps1`: valida `tsc` e roda `eas update --channel preview --platform android --auto`. Requer `eas login` no ambiente do usuário ( indisponível no Linux do agente).
- **Pendente**: `eas login` + execução dos scripts no Windows/ambiente com credencial EAS.

## Notas de ambiente
- Build do AppMobile no Linux exigiu `npm install lightningcss-linux-x64-gnu --no-save` (binding win32 não roda em Linux).
- Compartilhamento CIFS `//192.168.15.3/D$` montado em `/mnt/d_trabalho_pdcase` (requer `LocalAccountTokenFilterPolicy=1` no Windows + senha de conta local + NOPASSWD p/ `mount.cifs` no Linux).
