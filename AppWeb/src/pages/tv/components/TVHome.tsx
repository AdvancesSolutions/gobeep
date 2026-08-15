import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Search, Home, Tv, Film, User, Play, ListVideo, Smartphone } from 'lucide-react';
import type { Channel, PlaylistConfig } from '../../../services/iptvService';
import { formatBeepix } from '../../../services/beepixService';
import PlaylistManager from './PlaylistManager';

interface TVHomeProps {
  channels: Channel[];
  channelsState?: 'loading' | 'ready' | 'failed';
  beepix?: number;
  favorites?: { id: string; name: string; logo?: string; group?: string }[];
  onToggleFavorite?: (channel: Channel) => void;
  onSelectChannel: (channel: Channel) => void;
  onRequestReload: () => void;
  onOpenProfile?: () => void;
  onPairingRequest?: (pin: string) => void;
  /** Socket da TV para receber D-Pad virtual do celular. */
  socket?: Socket | null;
}

type Section = 'sidebar' | 'groups' | 'carousel';

const BEEP_FALLBACK_LOGO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'%3E%3Crect width='300' height='150' fill='%231a1a1a'/%3E%3Crect x='110' y='25' width='80' height='80' rx='20' fill='%23ffcc00'/%3E%3Ctext x='150' y='78' font-family='Arial, sans-serif' font-weight='900' font-size='48' fill='%23000' text-anchor='middle'%3EB%3C/text%3E%3Ctext x='150' y='130' font-family='Arial, sans-serif' font-weight='bold' font-size='18' fill='%23ffcc00' text-anchor='middle' letter-spacing='2'%3EBEEP TV%3C/text%3E%3C/svg%3E";

const LIVE_KEYWORDS = ['futebol', 'jogo', 'show', 'ao vivo', 'live', 'esporte', 'campeonato', 'liga', 'partida', 'clássico', 'final', 'copa'];
const isLiveEvent = (ch: Channel): boolean => {
  const hay = `${ch.name} ${ch.group}`.toLowerCase();
  return LIVE_KEYWORDS.some(k => hay.includes(k));
};

// Monta a URL do QR Code via API pública (evita libs extras e o '//' em template literal).
const buildSyncUrl = (pin: string): string => {
  return 'beepapp:' + '//sync?pin=' + pin;
};
const buildQrImage = (pin: string): string => {
  const data = encodeURIComponent(buildSyncUrl(pin));
  return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + data;
};

export const TVHome: React.FC<TVHomeProps> = ({ channels, channelsState = 'ready', beepix = 0, favorites = [], onToggleFavorite, onSelectChannel, onRequestReload, onOpenProfile, onPairingRequest, socket }) => {
  const [focusedSection, setFocusedSection] = useState<Section>('carousel');
  const [sidebarIndex, setSidebarIndex] = useState(2);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);
  const [activeGroup, setActiveGroup] = useState('Todos');
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastChannel, setLastChannel] = useState<Channel | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairPin, setPairPin] = useState('');

  const openPairing = () => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setPairPin(pin);
    setShowPairModal(true);
    onPairingRequest?.(pin);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('@beepapp_last_channel');
      if (raw) setLastChannel(JSON.parse(raw).channel ?? null);
    } catch {}
  }, []);

  const carouselRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(c => { if (c.group) set.add(c.group); });
    const base = Array.from(set).sort();
    return favorites.length > 0 ? ['Todos', 'Favoritos', ...base] : ['Todos', ...base];
  }, [channels, favorites]);

  // IDs de favoritos para lookup O(1).
  const favSet = useMemo(() => new Set((favorites || []).map(f => f.id)), [favorites]);

  // Filtro memoizado (performance).
  const filteredChannels = useMemo(() => {
    if (activeGroup === 'Todos') return channels;
    if (activeGroup === 'Favoritos') return channels.filter(c => favSet.has(c.id));
    return channels.filter(c => c.group === activeGroup);
  }, [channels, activeGroup, favSet]);

  // D-Pad virtual do celular: navega a Home (grupos/carrossel) e seleciona canal.
  useEffect(() => {
    if (!socket) return;
    const onRemoteKey = (data: { key?: string }) => {
      const key = data?.key;
      if (!key) return;
      if (key === 'ArrowLeft' || key === 'ArrowUp') {
        if (focusedSection === 'groups') {
          const prev = Math.max(0, groupIndex - 1);
          setGroupIndex(prev);
          const g = groups[prev];
          if (g) setActiveGroup(g);
        } else {
          setCarouselIndex((i) => Math.max(0, i - 1));
        }
      } else if (key === 'ArrowRight' || key === 'ArrowDown') {
        if (focusedSection === 'groups') {
          const next = Math.min(groups.length - 1, groupIndex + 1);
          setGroupIndex(next);
          const g = groups[next];
          if (g) setActiveGroup(g);
        } else {
          setCarouselIndex((i) => Math.min(filteredChannels.length - 1, i + 1));
        }
      } else if (key === 'Enter' || key === 'Ok' || key === 'OK') {
        const ch = filteredChannels[carouselIndex];
        if (ch) onSelectChannel(ch);
      } else if (key === 'Backspace' || key === 'Escape') {
        setFocusedSection((s) => (s === 'carousel' ? 'groups' : 'carousel'));
      }
    };
    socket.on('tv_keypress', onRemoteKey);
    return () => { socket.off('tv_keypress', onRemoteKey); };
  }, [socket, focusedSection, groupIndex, groups, filteredChannels, carouselIndex, onSelectChannel]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return channels.filter(c => c.name.toLowerCase().includes(q));
  }, [channels, searchQuery]);

  useEffect(() => {
    if (groupIndex > groups.length - 1) setGroupIndex(0);
  }, [groups, groupIndex]);

  useEffect(() => {
    if (searchIndex > searchResults.length - 1) setSearchIndex(0);
  }, [searchResults, searchIndex]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [activeGroup]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showPlaylistManager) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const k = e.key;
      const c = e.keyCode;
      const isUp = k === 'ArrowUp' || k === 'Up' || c === 38;
      const isDown = k === 'ArrowDown' || k === 'Down' || c === 40;
      const isLeft = k === 'ArrowLeft' || k === 'Left' || c === 37;
      const isRight = k === 'ArrowRight' || k === 'Right' || c === 39;
      const isEnter = k === 'Enter' || k === 'Ok' || k === 'OK' || c === 13;
      const isEsc = k === 'Escape' || k === 'Backspace' || c === 461;

      if (searchOpen) {
        if (isEsc) { setSearchOpen(false); setSearchQuery(''); setSearchIndex(0); }
        else if (isUp && searchIndex > 0) setSearchIndex(prev => prev - 1);
        else if (isDown && searchIndex < searchResults.length - 1) setSearchIndex(prev => prev + 1);
        else if (isLeft && searchIndex > 0) setSearchIndex(prev => prev - 1);
        else if (isRight && searchIndex < searchResults.length - 1) setSearchIndex(prev => prev + 1);
        else if (isEnter && searchResults.length > 0) {
          onSelectChannel(searchResults[searchIndex]);
          setSearchOpen(false); setSearchQuery(''); setSearchIndex(0);
        }
        return;
      }

      if (focusedSection === 'sidebar') {
        if (isUp && sidebarIndex > 0) setSidebarIndex(prev => prev - 1);
        else if (isDown && sidebarIndex < 5) setSidebarIndex(prev => prev + 1);
        else if (isRight) setFocusedSection('groups');
        else if (isEnter && sidebarIndex === 0) openPairing();
        else if (isEnter && sidebarIndex === 1) setSearchOpen(true);
        else if (isEnter && sidebarIndex === 5) setShowPlaylistManager(true);
      } else if (focusedSection === 'groups') {
        if (isLeft && groupIndex > 0) setGroupIndex(prev => prev - 1);
        else if (isRight && groupIndex < groups.length - 1) setGroupIndex(prev => prev + 1);
        else if (isDown) setFocusedSection('carousel');
        else if (isUp) setFocusedSection('sidebar');
        else if (isEnter) setActiveGroup(groups[groupIndex]);
      } else if (focusedSection === 'carousel') {
        if (isLeft) {
          if (carouselIndex > 0) setCarouselIndex(prev => prev - 1);
          else setFocusedSection('groups');
        } else if (isRight && carouselIndex < filteredChannels.length - 1) setCarouselIndex(prev => prev + 1);
        else if (isUp) setFocusedSection('groups');
        else if (isEnter && filteredChannels.length > 0) onSelectChannel(filteredChannels[carouselIndex]);
      } else if (c === 461) {
        setShowPlaylistManager(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedSection, sidebarIndex, carouselIndex, groupIndex, groups, filteredChannels, showPlaylistManager, searchOpen, searchResults, searchIndex, onSelectChannel]);

  useEffect(() => {
    if (focusedSection === 'carousel' && carouselRef.current) {
      const container = carouselRef.current;
      const itemWidth = 288 + 24;
      container.scrollTo({ left: carouselIndex * itemWidth, behavior: 'smooth' });
    }
  }, [carouselIndex, focusedSection]);

  useEffect(() => {
    if (focusedSection === 'groups' && groupsRef.current) {
      const container = groupsRef.current;
      const itemWidth = 160;
      container.scrollTo({ left: groupIndex * itemWidth, behavior: 'smooth' });
    }
  }, [groupIndex, focusedSection]);

  const featuredChannel = filteredChannels.length > 0 ? filteredChannels[carouselIndex] : null;
  const isFailed = channelsState === 'failed';
  const isLoading = channelsState === 'loading';
  const qrImage = buildQrImage(pairPin);

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#0f0f0f] text-white font-sans select-none flex transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {showPlaylistManager && (
        <PlaylistManager
          onClose={() => setShowPlaylistManager(false)}
          onListUpdated={() => { setShowPlaylistManager(false); onRequestReload(); }}
        />
      )}

      <div className={`w-24 bg-black/90 border-r border-white/5 flex flex-col items-center py-8 z-50 shadow-2xl transition-all duration-200 ${focusedSection === 'sidebar' ? 'w-64 items-start px-4 bg-black' : ''}`}>
        <div className={`mb-12 flex justify-center w-full ${focusedSection === 'sidebar' ? 'justify-start pl-4' : ''}`}>
           <div className="w-12 h-12 bg-[#ffcc00] rounded-xl flex items-center justify-center font-black text-black text-xl">B</div>
        </div>

        <nav className="flex-1 w-full flex flex-col gap-4">
          <SidebarButton icon={<Smartphone size={28} />} label="Vincular Mobile" isActive={false} isExpanded={focusedSection === 'sidebar'} onClick={openPairing} />
          <SidebarButton icon={<Search size={28} />} label="Busca" isActive={focusedSection === 'sidebar' && sidebarIndex === 1} isExpanded={focusedSection === 'sidebar'} />
          <SidebarButton icon={<Home size={28} />} label="Início" isActive={focusedSection === 'sidebar' && sidebarIndex === 2} isExpanded={focusedSection === 'sidebar'} />
          <SidebarButton icon={<Tv size={28} />} label="Ao Vivo" isActive={focusedSection === 'sidebar' && sidebarIndex === 3} isExpanded={focusedSection === 'sidebar'} />
          <SidebarButton icon={<Film size={28} />} label="Séries" isActive={focusedSection === 'sidebar' && sidebarIndex === 4} isExpanded={focusedSection === 'sidebar'} />
          <SidebarButton icon={<ListVideo size={28} />} label="Gerenciar Listas" isActive={focusedSection === 'sidebar' && sidebarIndex === 5} isExpanded={focusedSection === 'sidebar'} />
        </nav>

        <div className="w-full mt-4">
          <button
            aria-label="Meu Perfil"
            onClick={onOpenProfile}
            className="w-full bg-[#ffcc00] hover:bg-[#ffd700] rounded-xl p-4 flex items-center gap-4 border"
          >
            <User size={24} className="text-black" />
            {focusedSection === 'sidebar' && (
              <span className="text-black font-black text-lg">Meu Perfil</span>
            )}
          </button>
        </div>

        <div className="w-full mt-auto">
          <div className={`w-full bg-white/5 rounded-xl p-4 flex items-center justify-center gap-4 border ${focusedSection === 'sidebar' ? 'justify-start' : ''}`}>
            <User size={24} className="text-[#ffcc00]" />
            {focusedSection === 'sidebar' && (
              <div className="flex-col flex">
                <span className="text-sm text-white/50 font-bold">Saldo Beepix</span>
                <span className="text-lg font-black text-[#ffcc00]">{formatBeepix(beepix)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col">

        <div className={`flex items-center gap-3 px-16 pt-8 pb-2 ${focusedSection === 'sidebar' ? 'pl-4' : ''}`}>
          <div className="w-10 h-10 bg-[#ffcc00] rounded-xl flex items-center justify-center font-black text-black text-lg shadow-[0_0_20px_rgba(255,204,0,0.4)]">B</div>
          <span className="text-2xl font-black text-[#ffcc00] tracking-wide">BeepApp</span>
          <span className="text-white/50 text-sm font-medium">TV ao Vivo</span>
        </div>

        {!isLoading && !isFailed && lastChannel && (
          <div className="px-16 pt-4">
            <h2 className="text-xl font-bold text-white/80 mb-3 flex items-center gap-2">
              <Play fill="#ffcc00" size={18} className="text-[#ffcc00]" /> Continue assistindo
            </h2>
            <button
              onClick={() => onSelectChannel(lastChannel)}
              className={`flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 w-80 transition-all ${focusedSection === 'carousel' ? 'ring-4 ring-[#ffcc00]' : ''}`}
            >
              <img
                src={lastChannel.logo || BEEP_FALLBACK_LOGO}
                alt={lastChannel.name}
                onError={(e) => { if (e.currentTarget.src !== BEEP_FALLBACK_LOGO) e.currentTarget.src = BEEP_FALLBACK_LOGO; }}
                className="w-24 h-16 object-contain bg-black rounded-lg p-1"
              />
              <div className="flex-col flex text-left">
                <span className="text-white font-bold text-lg leading-tight line-clamp-1">{lastChannel.name}</span>
                <span className="text-[#ffcc00] text-sm font-semibold">Retomar agora</span>
              </div>
            </button>
          </div>
        )}

        {!isLoading && !isFailed && (
          <div className="px-16 pt-2">
            <div
              ref={groupsRef}
              className="flex gap-3 overflow-x-hidden py-2"
            >
              {groups.map((g, i) => {
                const isFocused = focusedSection === 'groups' && groupIndex === i;
                const isSelected = activeGroup === g;
                return (
                  <button
                    key={g}
                    onClick={() => { setActiveGroup(g); setGroupIndex(i); }}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-base font-bold whitespace-nowrap transition-all duration-200
                      ${isSelected ? 'bg-[#ffcc00] text-black' : 'bg-white/10 text-white/70'}
                      ${isFocused ? 'ring-4 ring-white scale-105' : ''}`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="absolute inset-0 z-0 h-[75vh] top-32">
           <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent z-10" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent z-10" />
           {featuredChannel ? (
             <img
               key={`${activeGroup}-${carouselIndex}`}
               src={featuredChannel.logo || BEEP_FALLBACK_LOGO}
               className="w-full h-full object-cover opacity-20 object-center blur-sm animate-[fadeIn_.6s_ease]"
               onError={(e) => {
                 if (e.currentTarget.src !== BEEP_FALLBACK_LOGO) e.currentTarget.src = BEEP_FALLBACK_LOGO;
               }}
             />
           ) : (
             <div className="w-full h-full bg-zinc-900" />
           )}
        </div>

        <div className="relative z-20 flex-1 px-16 pt-24">
           {featuredChannel ? (
             <div key={`${activeGroup}-${carouselIndex}`} className="w-1/2 animate-[fadeIn_.5s_ease]">
                <span className="text-[#ffcc00] font-black tracking-widest uppercase text-lg mb-4 block">{isLiveEvent(featuredChannel) ? 'Ao Vivo ao Vivo • ' + activeGroup : 'Em Destaque • ' + activeGroup}</span>
                <h1 className="text-7xl font-black mb-6 leading-tight drop-shadow-2xl">{featuredChannel.name}</h1>
                <p className="text-2xl text-white/70 mb-8 line-clamp-3 leading-relaxed">
                  Assista agora à programação ao vivo através do sistema IPTV Nativo da BeepApp TV. Interaja usando o celular para ganhar recompensas.
                </p>
                <div className="flex gap-4">
                  <div className={`bg-white text-black px-10 py-4 rounded-xl font-black text-2xl flex items-center gap-3 transition-all duration-200 ${focusedSection === 'carousel' ? 'ring-4 ring-[#ffcc00] bg-gray-200 scale-105' : ''}`}>
                    <Play fill="black" size={28} />
                    Pressione OK para Assistir
                  </div>
                </div>
             </div>
           ) : (
             <div className="w-1/2 mt-12">
                <h1 className="text-5xl font-black mb-6">Bem-vindo à BeepApp TV</h1>
                {isFailed ? (
                  <React.Fragment>
                    <p className="text-xl text-white/70 mb-4">Não foi possível carregar os canais. Verifique sua conexão ou adicione sua própria lista.</p>
                    <button
                      aria-label="Adicionar lista"
                      onClick={() => setShowPlaylistManager(true)}
                      className={`bg-[#ffcc00] text-black px-8 py-4 rounded-xl font-black text-xl flex items-center gap-3 mt-2 transition-all ${focusedSection === 'sidebar' ? 'ring-4 ring-white' : ''}`}
                    >
                      <ListVideo size={24} /> Adicionar Lista M3U / Xtream
                    </button>
                  </React.Fragment>
                ) : activeGroup !== 'Todos' ? (
                  <p className="text-xl text-white/70 mb-8">Nenhum canal nesta categoria ({activeGroup}).</p>
                ) : (
                  <p className="text-xl text-white/70 mb-8">Acesse o menu lateral para adicionar sua lista M3U ou conta Xtream Codes.</p>
                )}
             </div>
           )}
        </div>

        <div className="relative z-20 pb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-white px-16">{isLoading ? 'Carregando canais...' : isFailed ? 'Nenhum canal disponível' : activeGroup === 'Todos' ? 'TV Aberta e IPTV' : activeGroup}</h2>
            <div ref={carouselRef} className="flex gap-6 overflow-x-visible px-20 pb-6 pt-2">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ChannelCardSkeleton key={i} />)
              ) : (
                filteredChannels.map((channel, index) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isFocused={focusedSection === 'carousel' && carouselIndex === index}
                    live={isLiveEvent(channel)}
                    isFavorite={favSet.has(channel.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col p-16">
          <div className="flex items-center gap-4 mb-8">
            <Search size={32} className="text-[#ffcc00]" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchIndex(0); }}
              placeholder="Buscar canal por nome..."
              className="flex-1 bg-transparent border-b-2 border-[#ffcc00] text-3xl text-white font-bold py-2 outline-none placeholder:text-white/30"
            />
            <span className="text-white/50 text-lg">{searchResults.length} resultado(s)</span>
          </div>

          {searchQuery.trim() === '' ? (
            <p className="text-white/40 text-xl">Digite para filtrar os canais. Use as setas para navegar e OK para assistir.</p>
          ) : searchResults.length === 0 ? (
            <p className="text-white/40 text-xl">Nenhum canal encontrado para este termo.</p>
          ) : (
            <div className="grid grid-cols-4 gap-6 overflow-y-auto">
              {searchResults.map((ch, i) => {
                const isFocused = i === searchIndex;
                return (
                  <button
                    key={ch.id}
                    onClick={() => { onSelectChannel(ch); setSearchOpen(false); setSearchQuery(''); setSearchIndex(0); }}
                    className={`relative flex flex-col items-center bg-zinc-900 rounded-2xl overflow-hidden p-4 transition-all duration-200
                      ${isFocused ? 'ring-4 ring-[#ffcc00] shadow-[0_0_30px_#ffcc00] scale-105' : 'ring-0'}`}
                  >
                    <img
                      src={ch.logo || BEEP_FALLBACK_LOGO}
                      alt={ch.name}
                      onError={(e) => { if (e.currentTarget.src !== BEEP_FALLBACK_LOGO) e.currentTarget.src = BEEP_FALLBACK_LOGO; }}
                      className="w-full h-28 object-contain p-2"
                    />
                    <span className="font-bold text-sm text-center mt-2 line-clamp-2">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-white/30 text-sm mt-6">ESC ou Back para fechar</p>
        </div>
      )}

      {showPairModal && (
        <div className="absolute inset-0 z-[70] bg-black/95 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#ffcc00]/50 rounded-3xl p-10 flex flex-col items-center max-w-md w-full">
            <div className="w-14 h-14 bg-[#ffcc00] rounded-2xl flex items-center justify-center mb-4">
              <Smartphone size={28} className="text-black" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">Vincular Mobile</h2>
            <p className="text-white/60 text-center mb-6">Abra o app BeepApp no celular e escaneie o QR Code ou digite o PIN.</p>
            <div className="bg-white p-4 rounded-2xl mb-4">
              <img src={qrImage} width={200} height={200} alt="QR Code de vinculacao" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/50 text-sm">PIN:</span>
              <span className="text-[#ffcc00] font-black text-4xl tracking-[0.3em]">{pairPin}</span>
            </div>
            <button
              aria-label="Fechar"
              onClick={() => setShowPairModal(false)}
              className="bg-[#ffcc00] text-black font-black px-8 py-3 rounded-xl"
            >Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Lista pública de fallback: sempre pré-carregada por padrão quando o
// localStorage do usuário não possui nenhuma playlist salva (primeiro acesso
// ou lista vazia). Garante que a Home e a lista de canais nunca fiquem quebradas.
export const FALLBACK_PLAYLIST: PlaylistConfig = {
  id: 'fallback-canais-abertos-br',
  name: 'Canais Abertos BR',
  type: 'm3u',
  url: 'https://tv.meuted.io/iptvlegal.m3u',
};

export default TVHome;

function ChannelCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 h-44 rounded-xl bg-zinc-900 overflow-hidden flex flex-col animate-pulse">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-24 h-24 rounded-xl bg-zinc-800" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 w-3/4 rounded bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

interface ChannelCardProps {
  channel: Channel;
  isFocused: boolean;
  live: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (channel: Channel) => void;
}

const ChannelCard = memo(function ChannelCard({ channel, isFocused, live, isFavorite, onToggleFavorite }: ChannelCardProps) {
  // Enter no card favorita/desfavorita (além de abrir o player no container pai).
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Ok' || e.key === 'OK') {
      e.stopPropagation();
      onToggleFavorite?.(channel);
    }
  };
  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      className={`relative flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden outline-none transition-all duration-200
        ${live ? 'bg-gradient-to-br from-red-900/40 to-zinc-900' : 'bg-zinc-900'}
        ${isFocused ? 'ring-4 ring-[#ffcc00] shadow-[0_0_30px_#ffcc00] scale-105' : 'ring-0'}`}
    >
      <img
        src={channel.logo || BEEP_FALLBACK_LOGO}
        alt={channel.name}
        onError={(e) => {
          if (e.currentTarget.src !== BEEP_FALLBACK_LOGO) e.currentTarget.src = BEEP_FALLBACK_LOGO;
        }}
        className="w-full h-full object-contain p-4"
      />
      {live && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 rounded-full px-3 py-1 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="text-white font-black text-xs tracking-wide">AO VIVO</span>
        </div>
      )}
      {isFavorite && (
        <div className="absolute top-3 right-3 bg-[#ffcc00] rounded-full w-7 h-7 flex items-center justify-center">
          <span className="text-black text-sm font-black">★</span>
        </div>
      )}
      <button
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(channel); }}
        className="absolute bottom-3 right-3 bg-black/60 hover:bg-[#ffcc00] rounded-full w-8 h-8 flex items-center justify-center transition"
      >
        <span className={isFavorite ? 'text-[#ffcc00]' : 'text-white'}>★</span>
      </button>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
        <span className="font-bold text-lg">{channel.name}</span>
      </div>
    </div>
  );
});

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick?: () => void;
}

const SidebarButton = memo(function SidebarButton({ icon, label, isActive, isExpanded, onClick }: SidebarButtonProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#ffcc00] text-black font-bold scale-105' : 'text-white/50 bg-transparent'} ${!isExpanded ? 'justify-center px-0' : ''}`}>
      <div className={`${isActive ? 'text-black' : 'text-white/50'}`}>
        {icon}
      </div>
      {isExpanded && <span className="ml-6 font-medium text-lg whitespace-nowrap">{label}</span>}
    </button>
  );
});
