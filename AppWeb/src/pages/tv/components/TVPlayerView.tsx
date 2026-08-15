import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import TVPlayer from './TVPlayer';
import { Flame, Activity, Info, Menu, Share2, Sparkles, Trophy, Vote, Minimize2, Maximize2, Send, MessageCircle } from 'lucide-react';
import type { Channel } from '../../../services/iptvService';

// Lista de amigos: preparada para sincronizar com a API de contatos do app mobile.
// Atualmente vazia — será populada quando a lista de amigos estiver disponível no backend.
const FRIENDS: string[] = [];

interface TVAlert {
  title: string;
  message: string;
  type: 'promo' | 'alert' | 'news';
}

interface Reaction {
  id: string;
  emoji: string;
  xPos: number;
}

interface ReactionCount {
  emoji: string;
  count: number;
  lastAt: number;
}

interface ScorePopup {
  id: string;
  amount: number;
}

interface TVPlayerViewProps {
  socket: Socket;
  activeChannel: Channel;
  onClose: () => void;
  maximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onBeepixEarned?: (amount: number) => void;
}

export default function TVPlayerView({ socket, activeChannel, onClose, maximized = true, onMinimize, onMaximize, onBeepixEarned }: TVPlayerViewProps) {
  const [activeAlert, setActiveAlert] = useState<TVAlert | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [scores, setScores] = useState<ScorePopup[]>([]);
  const [isUIHide, setIsUIHide] = useState(false);
  const [showVote, setShowVote] = useState(false);
  const [votePoll, setVotePoll] = useState<{ id: string; question: string; options: string[]; tally: number[]; open: boolean } | null>(null);
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptionsText, setVoteOptionsText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [controlIndex, setControlIndex] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; from: 'tv' | 'mobile'; text: string; ts: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoControlRef = useRef<HTMLVideoElement | null>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    socket.emit('tv_channel_changed', { channelName: activeChannel.name });
    setPlayerError(null);

    socket.on('tv_alert', (data: TVAlert) => {
      setActiveAlert(data);
      setTimeout(() => setActiveAlert(null), 15000);
    });

    socket.on('tv_reaction', (emoji: string) => {
      const id = Math.random().toString(36).substring(7);
      const xPos = Math.random() * 80 + 10;
      setReactions(prev => [...prev, { id, emoji, xPos }]);
      setTimeout(() => { setReactions(prev => prev.filter(r => r.id !== id)); }, 3000);

      // Contador acumulado por emoji (janela de 4s).
      const now = Date.now();
      setReactionCounts(prev => {
        const existing = prev.find(r => r.emoji === emoji);
        if (existing) {
          return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, lastAt: now } : r);
        }
        return [...prev, { emoji, count: 1, lastAt: now }];
      });
    });

    socket.on('tv_score', (data: { amount: number }) => {
      const id = Math.random().toString(36).substring(7);
      const amount = data.amount ?? 10;
      setScores(prev => [...prev, { id, amount }]);
      setTimeout(() => { setScores(prev => prev.filter(s => s.id !== id)); }, 5000);
      // Gamificação ao vivo: atualiza o saldo Beepix compartilhado.
      onBeepixEarned?.(amount);
    });

    socket.on('chat_message', (msg: { id: string; from: 'tv' | 'mobile'; text: string; ts: number }) => {
      if (!msg || !msg.text) return;
      setChatMessages(prev => [...prev, msg].slice(-50));
    });

    // Controle remoto do vídeo vindo do celular (play/pause/volup/voldown/mute).
    socket.on('tv_control', (cmd: { action?: string }) => {
      const v = videoControlRef.current;
      if (!v) return;
      const action = cmd?.action;
      try {
        if (action === 'play') { v.play().catch(() => {}); }
        else if (action === 'pause') { v.pause(); }
        else if (action === 'mute') { v.muted = true; }
        else if (action === 'unmute') { v.muted = false; }
        else if (action === 'volup') { v.muted = false; v.volume = Math.min(1, v.volume + 0.1); }
        else if (action === 'voldown') { v.volume = Math.max(0, v.volume - 0.1); }
      } catch {}
    });

    // Resultados de votação (TV ou celular votou).
    socket.on('vote_results', (poll: { id: string; question: string; options: string[]; tally: number[]; open: boolean }) => {
      setVotePoll(poll);
    });

    socket.off('tv_control');
    socket.off('vote_results');
    // D-Pad virtual do celular: espelha tecla via evento de teclado sintético,
    // reaproveitando o handler de navegação (Magic Remote) da TV.
    const onRemoteKey = (data: { key?: string; keyCode?: number }) => {
      const key = data?.key;
      if (!key) return;
      window.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: data?.keyCode || 0, bubbles: true }));
    };
    socket.on('tv_keypress', onRemoteKey);
    return () => {
      socket.off('tv_alert');
      socket.off('tv_reaction');
      socket.off('tv_score');
      socket.off('chat_message');
      socket.off('tv_control');
      socket.off('vote_results');
      socket.off('tv_keypress');
    };
  }, [socket, activeChannel]);

  // Auto-scroll do chat para a última mensagem.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  useEffect(() => {
    const t = setInterval(() => {
      const cutoff = Date.now() - 4000;
      setReactionCounts(prev => (prev.some(r => r.lastAt < cutoff) ? prev.filter(r => r.lastAt >= cutoff) : prev));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const resetUITimeout = () => {
    setIsUIHide(false);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => { setIsUIHide(true); }, 5000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetUITimeout();
      const k = e.key;
      const c = e.keyCode;
      const isLeft = k === 'ArrowLeft' || k === 'Left' || c === 37;
      const isRight = k === 'ArrowRight' || k === 'Right' || c === 39;
      const isEnter = k === 'Enter' || k === 'Ok' || k === 'OK' || c === 13;

      // Navegação D-Pad na barra de controles (apenas em tela cheia).
      if (maximized) {
        const CONTROLS = 6; // Compartilhar, Momentos, Pontos, Votação, Chat, Minimizar
        if (isLeft) { setControlIndex((i) => Math.max(0, i - 1)); return; }
        if (isRight) { setControlIndex((i) => Math.min(CONTROLS - 1, i + 1)); return; }
        if (isEnter) {
          if (controlIndex === 0) setShowShare(true);
          else if (controlIndex === 1) setShowShare(false);
          else if (controlIndex === 3) setShowVote(true);
          else if (controlIndex === 4) setShowChat((s) => !s);
          else if (controlIndex === 5) onMinimize?.();
          return;
        }
      }

      if (e.key === 'Backspace' || e.key === 'Escape' || e.keyCode === 461) {
        if (maximized) onMinimize?.();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', resetUITimeout);
    resetUITimeout();
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', resetUITimeout);
    };
  }, [maximized, onClose, onMinimize, controlIndex, setShowShare, setShowVote]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white select-none">
      {/* Player de Vídeo no Fundo (mesma instância, não desmonta) */}
      <div className="absolute inset-0 z-0">
        <TVPlayer url={activeChannel.url} onError={(msg) => setPlayerError(msg)} videoRefExport={videoControlRef} />
      </div>

      {/* Sombra para legibilidade */}
      <div className={`absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-700 pointer-events-none ${isUIHide && maximized ? 'opacity-0' : 'opacity-100'}`} />

      {/* Aviso de erro de reprodução */}
      {playerError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center px-8 max-w-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-white font-black text-2xl mb-2">Canal indisponível</h3>
            <p className="text-white/70 text-lg">{playerError}</p>
            <p className="text-white/40 text-sm mt-2">Tente outro canal ou verifique sua conexão.</p>
          </div>
        </div>
      )}

      {/* Reações animadas (sempre visíveis) */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-0 text-6xl"
            style={{
              left: `${reaction.xPos}%`,
              animation: `flyUp 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Contadores acumulados (topo central, sempre visíveis) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-3 pointer-events-none">
        {reactionCounts.map((r) => (
          <div
            key={r.emoji}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 animate-[fadeIn_.3s_ease]"
          >
            <span className="text-3xl leading-none">{r.emoji}</span>
            <span className="text-white font-black text-xl">x{r.count}</span>
          </div>
        ))}
      </div>

      {/* Pontuação animada (+X pontos) */}
      <div className="absolute inset-0 z-50 pointer-events-none flex items-start justify-center pt-24">
        {scores.map((s) => (
          <div key={s.id} className="absolute text-4xl font-black text-[#ffcc00] drop-shadow-[0_0_20px_rgba(255,204,0,0.6)]"
            style={{ animation: `scorePop 5s ease-out forwards` }}>
            +{s.amount} Beepix ⚡
          </div>
        ))}
      </div>

      {/* Alertas */}
      {activeAlert && (
        <div className="absolute top-12 right-12 z-50 w-96 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#ffcc00]/50 rounded-3xl p-6 shadow-2xl animate-fade-in pointer-events-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#ffcc00] rounded-xl flex items-center justify-center animate-bounce">
              <Flame size={24} color="#000" />
            </div>
            <h3 className="text-white font-black text-xl leading-tight">{activeAlert.title}</h3>
          </div>
          <p className="text-white/70 text-base">{activeAlert.message}</p>
        </div>
      )}

      {/* Barra de controles (fullscreen) */}
      {maximized && (
        <div className={`absolute bottom-0 left-0 right-0 z-50 flex items-center gap-4 px-12 py-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-700 pointer-events-auto ${isUIHide ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button aria-label="Compartilhar canal" onClick={() => setShowShare(true)} className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-3 transition ${controlIndex === 0 ? 'ring-4 ring-[#ffcc00] scale-105' : ''}`}>
            <Share2 size={22} color="#fff" /><span className="text-white font-bold">Compartilhar</span>
          </button>
          <button aria-label="Momentos" onClick={() => setShowShare(false)} className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-3 transition ${controlIndex === 1 ? 'ring-4 ring-[#ffcc00] scale-105' : ''}`}>
            <Sparkles size={22} color="#fff" /><span className="text-white font-bold">Momentos</span>
          </button>
          <button aria-label="Pontos" className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-3 transition ${controlIndex === 2 ? 'ring-4 ring-[#ffcc00] scale-105' : ''}`}>
            <Trophy size={22} color="#ffcc00" /><span className="text-[#ffcc00] font-bold">Pontos</span>
          </button>
          <button aria-label="Votação" onClick={() => setShowVote(true)} className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-3 transition ${controlIndex === 3 ? 'ring-4 ring-[#ffcc00] scale-105' : ''}`}>
            <Vote size={22} color="#fff" /><span className="text-white font-bold">Votação</span>
          </button>
          <button aria-label="Chat" onClick={() => setShowChat((s) => !s)} className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-3 transition ${controlIndex === 4 ? 'ring-4 ring-[#ffcc00] scale-105' : ''}`}>
            <MessageCircle size={22} color="#fff" /><span className="text-white font-bold">Chat</span>
            {chatMessages.length > 0 && <span className="ml-1 bg-[#ffcc00] text-black text-xs font-black rounded-full px-2 py-0.5">{chatMessages.length}</span>}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 pointer-events-none">
            <Activity size={20} className="text-[#ffcc00] animate-pulse" />
            <span className="text-[#ffcc00] font-black text-lg tracking-widest">BEEP</span>
          </div>

          <button aria-label="Minimizar" onClick={onMinimize} className={`flex items-center gap-2 bg-[#ffcc00] hover:bg-[#ffd700] rounded-full px-4 py-3 transition ${controlIndex === 4 ? 'ring-4 ring-white scale-105' : ''}`}>
            <Minimize2 size={22} color="#000" /><span className="text-black font-black">Minimizar</span>
          </button>
        </div>
      )}

      {/* Dica voltar (quando minimizado) */}
      {!maximized && (
        <button aria-label="Maximizar" onClick={onMaximize} className="absolute top-2 right-2 z-40 bg-[#ffcc00] rounded-full p-2">
          <Maximize2 size={18} color="#000" />
        </button>
      )}

      {/* Painel Chat ao vivo (lado direito) */}
      {showChat && (
        <div className="absolute top-0 right-0 h-full w-96 z-[55] bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
            <MessageCircle size={20} color="#ffcc00" />
            <span className="text-white font-black text-lg">Chat ao Vivo</span>
            <button aria-label="Fechar chat" onClick={() => setShowChat(false)} className="ml-auto text-white/60 hover:text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <p className="text-white/40 text-sm">Converse com quem está assistindo. As mensagens aparecem aqui e no celular.</p>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className={`max-w-[90%] rounded-2xl px-4 py-2 ${m.from === 'tv' ? 'self-end bg-[#ffcc00] text-black' : 'self-start bg-white/10 text-white'}`}>
                  <span className="text-xs opacity-60 block mb-0.5">{m.from === 'tv' ? 'TV' : 'Celular'}</span>
                  <span className="text-sm leading-snug break-words">{m.text}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form
            className="p-4 border-t border-white/10 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = chatInput.trim();
              if (!text) return;
              socket.emit('chat_message', { text });
              setChatInput('');
            }}
          >
            <input
              autoFocus
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite e OK para enviar..."
              className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/30"
            />
            <button type="submit" aria-label="Enviar" className="bg-[#ffcc00] rounded-xl px-4 py-3">
              <Send size={18} color="#000" />
            </button>
          </form>
        </div>
      )}

      {/* Painel Votação */}
      {showVote && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={() => setShowVote(false)}>
          <div className="w-[680px] max-w-[92vw] bg-zinc-900 rounded-2xl border border-white/10 p-8" onClick={(e) => e.stopPropagation()}>
            {!votePoll ? (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <Vote size={24} color="#ffcc00" />
                  <span className="text-white font-black text-2xl">Nova Votação</span>
                </div>
                <input
                  value={voteQuestion}
                  onChange={(e) => setVoteQuestion(e.target.value)}
                  placeholder="Pergunta (ex: Qual o melhor momento?)"
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/30 mb-3"
                />
                <input
                  value={voteOptionsText}
                  onChange={(e) => setVoteOptionsText(e.target.value)}
                  placeholder="Opções separadas por vírgula (ex: Gol, Defesa, Comemoração)"
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/30 mb-5"
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowVote(false)} className="bg-white/10 hover:bg-white/20 rounded-xl px-5 py-3 text-white font-bold">Cancelar</button>
                  <button
                    onClick={() => {
                      const opts = voteOptionsText.split(',').map((o) => o.trim()).filter(Boolean);
                      if (!voteQuestion.trim() || opts.length < 2) return;
                      const poll = { id: Date.now().toString(36), question: voteQuestion.trim(), options: opts, tally: opts.map(() => 0), open: true };
                      setVotePoll(poll);
                      socket.emit('vote_start', { question: poll.question, options: poll.options });
                    }}
                    className="bg-[#ffcc00] hover:bg-[#ffd700] rounded-xl px-5 py-3 text-black font-black"
                  >Iniciar</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Vote size={24} color="#ffcc00" />
                  <span className="text-white font-black text-2xl">{votePoll.question}</span>
                </div>
                <span className="text-white/50 text-xs">{votePoll.open ? 'Votação aberta — vote no celular' : 'Votação encerrada'}</span>
                <div className="mt-5 flex flex-col gap-3">
                  {votePoll.options.map((opt, i) => {
                    const total = votePoll.tally.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((votePoll.tally[i] / total) * 100) : 0;
                    return (
                      <div key={i} className="bg-white/5 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-bold">{opt}</span>
                          <span className="text-[#ffcc00] font-black">{pct}% ({votePoll.tally[i]})</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ffcc00] transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  {votePoll.open && (
                    <button
                      onClick={() => { socket.emit('vote_close'); setVotePoll((p) => (p ? { ...p, open: false } : p)); }}
                      className="bg-white/10 hover:bg-white/20 rounded-xl px-5 py-3 text-white font-bold"
                    >Encerrar</button>
                  )}
                  <button onClick={() => { setShowVote(false); setVotePoll(null); setVoteQuestion(''); setVoteOptionsText(''); }} className="bg-[#ffcc00] hover:bg-[#ffd700] rounded-xl px-5 py-3 text-black font-black">Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Painel Compartilhar overlay */}
      {showShare && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setShowShare(false)}>
          <div className="bg-[#1a1a1a] border border-[#ffcc00]/40 rounded-3xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-black text-2xl mb-2">Compartilhar Canal</h2>
            <p className="text-white/60 mb-2">Canal: <span className="text-[#ffcc00] font-bold">{activeChannel.name}</span></p>
            <p className="text-white/40 text-xs mb-4">Selecione os amigos para enviar o convite pelo Chat.</p>
            <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto">
              {FRIENDS.length === 0 ? (
                <p className="text-white/40 text-sm">Nenhum amigo salvo ainda. A lista de amigos será sincronizada quando a API de contatos estiver disponível.</p>
              ) : (
                FRIENDS.map((f) => (
                  <label key={f} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 cursor-pointer">
                    <input type="checkbox" className="accent-[#ffcc00]" />
                    <span className="text-white font-medium">{f}</span>
                  </label>
                ))
              )}
            </div>
            <button onClick={() => setShowShare(false)} className="bg-[#ffcc00] text-black font-black px-6 py-3 rounded-xl w-full">Enviar Convite</button>
          </div>
        </div>
      )}
    </div>
  );
}
