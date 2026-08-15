import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TV_SERVER = 'http://192.168.15.3:3002';
const PAIR_STORAGE_KEY = '@beepapp_tv_pair';

export type PairStatus = 'idle' | 'pairing' | 'paired' | 'error';

interface SocketCtx {
  socket: Socket | null;
  connected: boolean;
  pairedRoom: string | null;
  pairStatus: PairStatus;
  pairError: string | null;
  /** true enquanto a TV pareada responde aos heartbeats. */
  tvOnline: boolean;
  /** Tenta parear pela TV. Resolve true se a TV (ou timeout) confirmar. */
  pairTV: (pin: string) => Promise<boolean>;
  /** Reseta o estado de pareamento para uma nova tentativa. */
  resetPair: () => void;
  /** Força uma verificação imediata de online da TV (dispara ping). */
  refreshTvStatus: () => void;
  /** Solicita à TV a lista de canais disponíveis. */
  requestChannels: () => void;
  /** Lista de canais atualmente disponível na TV (preenchida por requestChannels). */
  channels: { id: string; name: string; logo?: string; group?: string }[];
  /** Troca o canal ativo na TV pelo id. */
  changeChannelById: (channelId: string) => void;
  /** Envia reação (emoji) para a TV. */
  sendReaction: (emoji: string) => void;
  /** Troca o canal na TV pelo nome (compatibilidade). */
  changeChannel: (channelName: string) => void;
  /** Envia mensagem de chat para a TV (e vice-versa). */
  sendChat: (text: string) => void;
  /** Mensagens de chat recebidas (TV <-> celular). */
  chatMessages: { id: string; from: 'tv' | 'mobile'; text: string; ts: number }[];
  /** Lista de favoritos unificada (TV <-> celular). */
  favorites: { id: string; name: string; logo?: string; group?: string }[];
  /** Favorita/desfavorita um canal (sincroniza com a TV). */
  toggleFavorite: (item: { id: string; name: string; logo?: string; group?: string }) => void;
  /** Envia comando de controle do vídeo para a TV (play/pause/volup/voldown/mute/unmute). */
  sendControl: (action: string) => void;
  /** Enquete ativa (vinda da TV), ou null. */
  votePoll: { id: string; question: string; options: string[]; tally: number[]; open: boolean } | null;
  /** Vota em uma opção da enquete (index). */
  castVote: (optionIndex: number) => void;
  /** Envia tecla do D-Pad virtual para a TV (ArrowLeft/Right/Up/Down/Enter/Backspace). */
  sendKey: (key: string) => void;
  /** Canal que está tocando agora (TV↔celular), ou null. */
  nowWatching: { channelId?: string; name: string; url?: string; logo?: string; ts: number } | null;
  /** Informa à TV (ou recebe) o canal "agora assistindo" para continue assistindo cruzado. */
  setNowWatching: (item: { channelId?: string; name: string; url?: string; logo?: string }) => void;
  /** Feed de reações agregado (TV + celular), lista de { emoji, ts }. */
  reactionFeed: { emoji: string; ts: number }[];
  /** Estatísticas do companion (reações, canais assistidos, tempo, saldo Beepix). */
  stats: { reactionCount: number; channelsWatched: number; watchSeconds: number; beepix: number } | null;
  /** Pede o snapshot de estatísticas ao servidor. */
  getStats: () => void;
  /** Saldo Beepix único (servidor), ou null se ainda não carregou. */
  beepix: number | null;
  /** Pede o saldo Beepix persistido no servidor (perfil único). */
  getBeepix: () => void;
  /** Auto-vínculo por rede (mesma sub-rede da TV, sem PIN). Retorna true se ok. */
  autoPair: () => Promise<boolean>;
  /** Lista de TVs pareadas (1 celular controla várias). */
  pairedTVs: { pin: string; name: string }[];
  /** PIN da TV atualmente ativa (alvo dos comandos). */
  activePin: string | null;
  /** Seleciona a TV ativa dentre as pareadas. */
  selectTV: (pin: string) => void;
}

const DEFAULT: SocketCtx = {
  socket: null,
  connected: false,
  pairedRoom: null,
  pairStatus: 'idle',
  pairError: null,
  tvOnline: false,
  pairTV: () => Promise.resolve(false),
  resetPair: () => {},
  refreshTvStatus: () => {},
  sendReaction: () => {},
  changeChannel: () => {},
  requestChannels: () => {},
  channels: [],
  changeChannelById: () => {},
  sendChat: () => {},
  chatMessages: [],
  favorites: [],
  toggleFavorite: () => {},
  sendControl: () => {},
  votePoll: null,
  castVote: () => {},
  sendKey: () => {},
  nowWatching: null,
  setNowWatching: () => {},
  reactionFeed: [],
  stats: null,
  getStats: () => {},
  beepix: null,
  getBeepix: () => {},
  autoPair: async () => false,
  pairedTVs: [],
  activePin: null,
  selectTV: () => {},
};

const Ctx = createContext<SocketCtx>(DEFAULT);

const PIN_RE = /^\d{6}$/;
const PAIR_TIMEOUT_MS = 8000;
const HEARTBEAT_MS = 5000;
const PONG_TIMEOUT_MS = 3000;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [pairedRoom, setPairedRoom] = useState<string | null>(null);
  const [pairStatus, setPairStatus] = useState<PairStatus>('idle');
  const [pairError, setPairError] = useState<string | null>(null);
  const [tvOnline, setTvOnline] = useState(false);
  const [channels, setChannels] = useState<{ id: string; name: string; logo?: string; group?: string }[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; from: 'tv' | 'mobile'; text: string; ts: number }[]>([]);
  const [favorites, setFavorites] = useState<{ id: string; name: string; logo?: string; group?: string }[]>([]);
  const [votePoll, setVotePoll] = useState<{ id: string; question: string; options: string[]; tally: number[]; open: boolean } | null>(null);
  const [nowWatching, setNowWatchingState] = useState<{ channelId?: string; name: string; url?: string; logo?: string; ts: number } | null>(null);
  const [reactionFeed, setReactionFeed] = useState<{ emoji: string; ts: number }[]>([]);
  const [stats, setStats] = useState<{ reactionCount: number; channelsWatched: number; watchSeconds: number; beepix: number } | null>(null);
  const [beepix, setBeepix] = useState<number | null>(null);
  const [pairedTVs, setPairedTVs] = useState<{ pin: string; name: string }[]>([]);
  const [activePin, setActivePin] = useState<string | null>(null);

  const sockRef = useRef<Socket | null>(null);
  const ackRef = useRef<((ok: boolean, msg?: string) => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPinRef = useRef<string | null>(null);
  const pongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tvOnlineRef = useRef(false);
  const pairStatusRef = useRef<PairStatus>('idle');

  const markTvOnline = (online: boolean) => {
    tvOnlineRef.current = online;
    setTvOnline(online);
  };

  // Mantém pairStatus acessível em callbacks (deep link).
  useEffect(() => { pairStatusRef.current = pairStatus; }, [pairStatus]);

  // Registra uma TV pareada (1 celular controla várias).
  const registerPairedTV = (pin: string, name?: string) => {
    if (!pin) return;
    setPairedTVs((prev) => {
      if (prev.some((t) => t.pin === pin)) return prev;
      return [...prev, { pin, name: name || `TV ${pin}` }];
    });
    setActivePin((cur) => cur ?? pin); // primeira TV vira ativa
  };
  const selectTV = (pin: string) => setActivePin(pin);

  const sendPing = () => {
    const s = sockRef.current;
    if (!s || !s.connected || pairStatus !== 'paired') return;
    // Se já estava offline, mantém; se estava online, aguarda pong.
    if (pongTimerRef.current) clearTimeout(pongTimerRef.current);
    pongTimerRef.current = setTimeout(() => {
      // Não houve pong a tempo -> TV offline.
      markTvOnline(false);
    }, PONG_TIMEOUT_MS);
    s.emit('ping_tv', { room: pendingPinRef.current });
  };

  useEffect(() => {
    const s = io(TV_SERVER, { transports: ['websocket'], reconnection: true });

    // Ao conectar: restaura pareamento salvo (re-parear silencioso).
    s.on('connect', async () => {
      setConnected(true);
      try {
        const saved = await AsyncStorage.getItem(PAIR_STORAGE_KEY);
        if (saved) {
          const { pin, room } = JSON.parse(saved);
          pendingPinRef.current = pin;
          // Re-emite o pareamento sem alterar a UI para "pairing" se já tivermos room.
          if (room) setPairedRoom(String(room));
          setPairStatus(room ? 'paired' : 'pairing');
          s.emit('mobile_pair', { pin });
          if (room) { markTvOnline(true); sendPing(); }
        }
      } catch (e) { /* ignora storage */ }
    });
    s.on('disconnect', () => { setConnected(false); markTvOnline(false); });

    // Ack positivo do servidor (se existir). Fallback: usa o PIN pendente como room.
    s.on('pair_success', (payload: any) => {
      setPairStatus('paired');
      setPairError(null);
      const room = payload?.room ?? payload?.pin ?? pendingPinRef.current;
      if (room) setPairedRoom(String(room));
      registerPairedTV(String(room ?? pendingPinRef.current ?? ''));
      const ack = ackRef.current;
      ackRef.current = null;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      ack?.(true);
      // Persiste o pareamento para reconexões futuras.
      AsyncStorage.setItem(PAIR_STORAGE_KEY, JSON.stringify({ pin: pendingPinRef.current, room: room ?? pendingPinRef.current }))
        .catch(() => {});
      // TV acabou de parear: já está online e dispara 1º ping.
      markTvOnline(true);
      sendPing();
      // Companion: puxa o snapshot de estatísticas e o saldo Beepix assim que pareia.
      s.emit('get_stats');
      s.emit('beepix_get');
    });

    // Servidor confirma pareamento do celular (evento 'paired').
    s.on('paired', (payload: any) => {
      const pin = payload?.pin ?? pendingPinRef.current;
      if (pin) registerPairedTV(String(pin));
    });

    // Ack negativo do servidor (se existir).
    s.on('pair_error', (payload: any) => {
      const msg = typeof payload === 'string' ? payload : (payload?.message || 'A TV recusou o pareamento.');
      setPairStatus('error');
      setPairError(msg);
      const ack = ackRef.current;
      ackRef.current = null;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      ack?.(false, msg);
    });

    // Heartbeat de volta da TV (se o servidor encaminhar).
    s.on('pong_tv', () => {
      if (pongTimerRef.current) { clearTimeout(pongTimerRef.current); pongTimerRef.current = null; }
      const wasOffline = !tvOnlineRef.current;
      markTvOnline(true);
      if (wasOffline) s.emit('request_channels');
    });

    // Servidor avisa que a TV caiu / descasou.
    s.on('pair_lost', () => {
      markTvOnline(false);
      setPairStatus('error');
      setPairError('A TV foi desligada ou perdeu a conexão.');
    });

    // Servidor avisa mudança de status da TV (on/off) via heartbeat.
    s.on('tv_status', (st: any) => {
      const online = !!st?.online;
      const wasOffline = !tvOnlineRef.current;
      markTvOnline(online);
      if (online && wasOffline) {
        // TV voltou: re-pede canais e limpa erro de pareamento.
        setPairStatus('paired');
        setPairError(null);
        s.emit('request_channels');
      } else if (!online) {
        setPairStatus('error');
        setPairError('A TV foi desligada ou perdeu a conexão.');
      }
    });

    // TV respondeu a lista de canais (via request_channels).
    s.on('channels_list', (payload: any) => {
      const list = Array.isArray(payload?.channels) ? payload.channels : [];
      setChannels(list);
    });

    // Chat ao vivo: mensagens da TV ou do próprio celular (echo do servidor).
    s.on('chat_message', (msg: any) => {
      if (msg && msg.text) setChatMessages((prev) => [...prev, msg].slice(-50));
    });

    // Favoritos unificados: lista vinda da TV ou do próprio celular.
    s.on('favorites_list', (data: any) => {
      const list = Array.isArray(data?.favorites) ? data.favorites : [];
      setFavorites(list);
    });

    // Votações em tempo real: enquete da TV e resultados atualizados.
    s.on('vote_start', (poll: any) => { if (poll && Array.isArray(poll.options)) setVotePoll(poll); });
    s.on('vote_results', (poll: any) => { if (poll && Array.isArray(poll.options)) setVotePoll(poll); });

    // Continue assistindo cruzado: estado "agora assistindo" da TV (ou do celular).
    s.on('now_watching', (item: any) => { if (item && item.name) setNowWatchingState({ ...item, ts: item.ts || Date.now() }); });

    // Feed de reações agregado (TV + celular).
    s.on('reaction_feed', (feed: any) => { if (Array.isArray(feed)) setReactionFeed(feed.slice(-50)); });

    // Estatísticas do companion.
    s.on('stats', (st: any) => {
      if (st && typeof st === 'object') setStats({
        reactionCount: Number(st.reactionCount) || 0,
        channelsWatched: Number(st.channelsWatched) || 0,
        watchSeconds: Number(st.watchSeconds) || 0,
        beepix: Number(st.beepix) || 0,
      });
    });

    // Perfil único Beepix: saldo absoluto vindo do servidor (fonte de verdade).
    s.on('beepix_sync', (d: any) => {
      const v = Number(d?.beepix);
      if (Number.isFinite(v)) setBeepix(v);
    });

    // Pede a lista atual ao conectar/parear.
    s.emit('favorites_get');

    sockRef.current = s;
    setSocket(s);

    // Loop de heartbeat enquanto montado.
    heartbeatRef.current = setInterval(sendPing, HEARTBEAT_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pongTimerRef.current) clearTimeout(pongTimerRef.current);
      s.disconnect();
    };
  }, []);

  const pairTV = (pin: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const s = sockRef.current;

      // Validação local antes de emitir.
      if (!PIN_RE.test(pin)) {
        setPairStatus('error');
        setPairError('PIN inválido. Use exatamente 6 dígitos numéricos.');
        resolve(false);
        return;
      }
      if (!s || !s.connected) {
        setPairStatus('error');
        setPairError('Sem conexão com a TV. Verifique a rede/Wi-Fi e tente novamente.');
        resolve(false);
        return;
      }

      setPairStatus('pairing');
      setPairError(null);
      pendingPinRef.current = pin;

      // Resolve o promise quando o servidor confirmar (ou após timeout).
      ackRef.current = (ok: boolean, msg?: string) => {
        if (!ok && msg) setPairError(msg);
        resolve(ok);
      };

      timerRef.current = setTimeout(() => {
        ackRef.current = null;
        setPairStatus('error');
        setPairError('Tempo esgotado. A TV não respondeu. Tente novamente.');
        resolve(false);
      }, PAIR_TIMEOUT_MS);

      s.emit('mobile_pair', { pin });
    });
  };

  const autoPair = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const s = sockRef.current;
      if (!s || !s.connected) {
        setPairStatus('error');
        setPairError('Sem conexão. Verifique a rede/Wi-Fi e tente novamente.');
        resolve(false);
        return;
      }
      setPairStatus('pairing');
      setPairError(null);
      ackRef.current = (ok: boolean, msg?: string) => {
        if (!ok && msg) setPairError(msg);
        resolve(ok);
      };
      timerRef.current = setTimeout(() => {
        ackRef.current = null;
        setPairStatus('error');
        setPairError('Tempo esgotado. Nenhuma TV na mesma rede encontrada.');
        resolve(false);
      }, PAIR_TIMEOUT_MS);
      s.emit('auto_pair', {});
    });
  };

  const resetPair = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    ackRef.current = null;
    pendingPinRef.current = null;
    setPairStatus('idle');
    setPairError(null);
    setPairedRoom(null);
    markTvOnline(false);
    AsyncStorage.removeItem(PAIR_STORAGE_KEY).catch(() => {});
  };

  const refreshTvStatus = () => { sendPing(); };

  const sendReaction = (emoji: string) => {
    sockRef.current?.emit('tv_reaction', emoji, { pin: activePin ?? undefined });
  };
  const changeChannel = (channelName: string) => {
    sockRef.current?.emit('tv_channel_changed', { channelName, pin: activePin ?? undefined });
  };
  const requestChannels = () => {
    sockRef.current?.emit('request_channels', { pin: activePin ?? undefined });
  };
  const changeChannelById = (channelId: string) => {
    sockRef.current?.emit('tv_channel_changed', { channelId, pin: activePin ?? undefined });
  };

  // ---- Deep link: beepapp://watch?channel=ID -> troca canal na TV ----
  const handleDeepLink = (url: string | null) => {
    if (!url) return;
    try {
      const u = new URL(url);
      const ch = u.searchParams.get('channel');
      if ((u.protocol === 'beepapp:' || u.hostname === 'watch') && ch) {
        // Só troca se já estiver pareado; senão guarda para após parear.
        if (pairStatusRef.current === 'paired') changeChannelById(ch);
        else pendingDeepLinkRef.current = ch;
      }
    } catch { /* url inválido: ignora */ }
  };

  const pendingDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => handleDeepLink(url);
    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL().then((url) => handleDeepLink(url)).catch(() => {});
    // Se há deep link pendente e acabamos de parear, aplica.
    if (pendingDeepLinkRef.current && pairStatusRef.current === 'paired') {
      changeChannelById(pendingDeepLinkRef.current);
      pendingDeepLinkRef.current = null;
    }
    return () => { try { sub.remove(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sendChat = (text: string) => {
    const t = String(text || '').trim();
    if (!t) return;
    sockRef.current?.emit('chat_message', { text: t, pin: activePin ?? undefined });
  };
  const toggleFavorite = (item: { id: string; name: string; logo?: string; group?: string }) => {
    if (!item?.id) return;
    sockRef.current?.emit('favorite_toggle', { item, pin: activePin ?? undefined });
  };
  const sendControl = (action: string) => {
    if (!action) return;
    sockRef.current?.emit('tv_control', { action, pin: activePin ?? undefined });
  };
  const castVote = (optionIndex: number) => {
    if (typeof optionIndex !== 'number') return;
    sockRef.current?.emit('vote_cast', { optionIndex, pin: activePin ?? undefined });
  };
  const sendKey = (key: string) => {
    if (!key) return;
    sockRef.current?.emit('tv_keypress', { key, pin: activePin ?? undefined });
  };
  const setNowWatching = (item: { channelId?: string; name: string; url?: string; logo?: string }) => {
    if (!item?.name) return;
    sockRef.current?.emit('now_watching', { ...item, pin: activePin ?? undefined });
  };
  const getStats = () => { sockRef.current?.emit('get_stats', { pin: activePin ?? undefined }); };
  const getBeepix = () => { sockRef.current?.emit('beepix_get', { pin: activePin ?? undefined }); };

  return (
    <Ctx.Provider value={{ socket, connected, pairedRoom, pairStatus, pairError, tvOnline, pairTV, resetPair, refreshTvStatus, sendReaction, changeChannel, requestChannels, channels, changeChannelById, sendChat, chatMessages, favorites, toggleFavorite, sendControl, votePoll, castVote, sendKey, nowWatching, setNowWatching, reactionFeed, stats, getStats, beepix, getBeepix, autoPair, pairedTVs, activePin, selectTV }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTVSocket = () => useContext(Ctx);
export default SocketProvider;
