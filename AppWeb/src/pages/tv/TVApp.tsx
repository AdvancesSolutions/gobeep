import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import TVHome, { FALLBACK_PLAYLIST } from './components/TVHome';
import TVPlayerView from './components/TVPlayerView';
import TVProfile from './components/TVProfile';
import type { Channel } from '../../services/iptvService';
import { getSavedPlaylists, fetchChannelsFromPlaylist } from '../../services/iptvService';
import { fetchBeepixBalance, storeBalance } from '../../services/beepixService';

const SOCKET_URL = 'http://192.168.15.3:3002';

export default function TVApp() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsState, setChannelsState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [view, setView] = useState<'home' | 'player'>('home');
  const [maximized, setMaximized] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [beepix, setBeepix] = useState<number>(0);
  const [favorites, setFavorites] = useState<{ id: string; name: string; logo?: string; group?: string }[]>([]);

  // Saldo Beepix compartilhado: fonte única de verdade entre Home, Profile e Player.
  useEffect(() => {
    fetchBeepixBalance().then(setBeepix).catch(() => {});
  }, []);

  const addBeepix = useCallback((amount: number) => {
    setBeepix((prev) => {
      const next = prev + amount;
      storeBalance(next); // persiste imediatamente (camada offline)
      return next;
    });
  }, []);

  const handleSelect = (ch: Channel) => {
    // Salva o último canal assistido para a Home mostrar "Continue assistindo".
    try { localStorage.setItem('@beepapp_last_channel', JSON.stringify({ channel: ch, ts: Date.now() })); } catch {}
    setActiveChannel(ch); setView('player'); setMaximized(true);
    // Sincroniza "agora assistindo" com o celular (continue assistindo cruzado).
    socket?.emit('now_watching', { channelId: ch.id, name: ch.name, url: ch.url, logo: ch.logo });
  };
  const handleMinimize = () => { setView('home'); setMaximized(false); };
  const handleMaximize = () => { setMaximized(true); setView('player'); };
  const handleClose = () => { setView('home'); setMaximized(false); };

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
    setSocket(s);

    // Celular troca o canal na TV: encontra pelo nome e abre o player.
    s.on('tv_channel_changed', (data: { channelName?: string; channelId?: string }) => {
      const name = (data?.channelName || '').trim();
      const id = data?.channelId;
      const ch = channels.find((c) => (id ? c.id === id : c.name.toLowerCase() === name.toLowerCase()));
      if (ch) handleSelect(ch);
    });

    // Celular pede a lista de canais: TV responde com os nomes/ids atuais.
    s.on('request_channels', (data: { from?: string }) => {
      s.emit('channels_list', {
        from: data?.from,
        channels: channels.map((c) => ({ id: c.id, name: c.name, logo: c.logo, group: c.group })),
      });
    });

    // Lista de favoritos vinda do servidor (celular ou TV favoritou).
    s.on('favorites_list', (data: { favorites?: { id: string; name: string; logo?: string; group?: string }[] }) => {
      setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
    });

    // Celular pede para continuar assistindo este canal na TV.
    s.on('now_watching', (data: { channelId?: string; name?: string }) => {
      const id = data?.channelId; const name = (data?.name || '').trim();
      if (id || name) {
        const ch = channels.find((c) => (id ? c.id === id : c.name.toLowerCase() === name.toLowerCase()));
        if (ch) handleSelect(ch);
      }
    });

    // Pede a lista atual ao parear (sincroniza com o celular).
    s.emit('favorites_get');

    return () => { s.disconnect(); };
  }, [channels, handleSelect]);

  // Favorita/desfavorita um canal (sincroniza com o celular via servidor).
  const toggleFavorite = useCallback((ch: Channel) => {
    if (!socket) return;
    socket.emit('favorite_toggle', { item: { id: ch.id, name: ch.name, logo: ch.logo, group: ch.group } });
  }, [socket]);

  const loadChannels = async () => {
    setChannelsState('loading');
    const saved = getSavedPlaylists();
    // Fallback público quando não há playlists salvas no localStorage.
    const playlists = saved.length > 0 ? saved : [FALLBACK_PLAYLIST];
    const all: Channel[] = [];
    let anyOk = false;
    for (const p of playlists) {
      try { const ch = await fetchChannelsFromPlaylist(p); all.push(...ch); if (ch.length) anyOk = true; } catch (e) { console.error(e); }
    }
    setChannels(all);
    // Se não veio nenhum canal (fallback fora do ar / sem net), marca failed
    // para a Home mostrar o empty-state acionável em vez de "Carregando...".
    setChannelsState(anyOk ? 'ready' : (all.length > 0 ? 'ready' : 'failed'));
  };

  useEffect(() => { loadChannels(); }, []);

  // Vincular Mobile: gera o PIN na TV e avisa o servidor (que repassa ao celular).
  const handlePairingRequest = useCallback((pin: string) => {
    if (socket) {
      socket.emit('tv_pair_request', { pin });
      // Registra esta TV no servidor associada ao PIN (suporta varias TVs no celular).
      socket.emit('register_tv', { pin });
    }
  }, [socket]);

  const isFull = view === 'player' && maximized;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Player SEMPRE montado — só muda o container (não desmonta) */}
      {activeChannel && socket && (
        <div className={`absolute transition-all duration-300 z-0 ${isFull ? 'inset-0' : 'top-4 right-4 w-80 h-48 rounded-xl overflow-hidden z-0'}`}>
          <TVPlayerView
            socket={socket}
            activeChannel={activeChannel}
            onClose={handleClose}
            maximized={isFull}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onBeepixEarned={addBeepix}
          />
        </div>
      )}

      {/* Menu overlay quando minimizado / home */}
      {view === 'home' && (
        <div className="absolute inset-0 z-10">
          <TVHome
            channels={channels}
            channelsState={channelsState}
            beepix={beepix}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectChannel={handleSelect}
            onRequestReload={loadChannels}
            onOpenProfile={() => setShowProfile(true)}
            onPairingRequest={handlePairingRequest}
            socket={socket}
          />
        </div>
      )}

      {/* Perfil overlay */}
      {showProfile && (
        <TVProfile beepix={beepix} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
