import React, { useState } from 'react';
import { User, Bell, Shield, AlertCircle, Star, Moon, Sun, X, Trophy, Zap, Gift } from 'lucide-react';
import { formatBeepix } from '../../../services/beepixService';

interface TVProfileProps {
  beepix?: number;
  onClose: () => void;
}

const SECTIONS = [
  { icon: Bell, label: 'Notificações' },
  { icon: Shield, label: 'Privacidade e Segurança' },
  { icon: AlertCircle, label: 'Ajuda e Suporte' },
  { icon: Star, label: 'Avalie o BEEP' },
];

export default function TVProfile({ beepix = 0, onClose }: TVProfileProps) {
  const [isDark, setIsDark] = useState(true);
  const [userName] = useState('Alessandro');
  const [level] = useState(7);
  const [xp] = useState(3200);

  return (
    <div className="absolute inset-0 z-[70] bg-black/95 flex">
      {/* Painel lateral */}
      <div className="w-[420px] h-full bg-[#0f0f0f] border-r border-white/10 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white">Meu Perfil</h1>
          <button aria-label="Fechar perfil" onClick={onClose} className="bg-white/10 hover:bg-white/20 rounded-full p-3">
            <X size={22} color="#fff" />
          </button>
        </div>

        {/* Conta */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-[#ffcc00] items-center justify-center justify-center flex">
            <User size={36} color="#000" />
          </div>
          <div>
            <p className="text-white font-black text-2xl">{userName}</p>
            <p className="text-white/50">Membro BeepApp</p>
          </div>
        </div>

        {/* Saldo Beepix */}
        <div className="bg-[#1a1a1a] border border-[#ffcc00]/30 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift size={24} color="#ffcc00" />
            <span className="text-white/70 font-bold">Saldo Beepix</span>
          </div>
          <span className="text-[#ffcc00] font-black text-xl">{formatBeepix(beepix)}</span>
        </div>

        {/* Gamificação */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={22} color="#ffcc00" />
            <span className="text-white font-bold">Nível {level}</span>
            <Zap size={18} color="#ffcc00" />
            <span className="text-white/60 text-sm">{xp} XP</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#ffcc00]" style={{ width: '64%' }} />
          </div>
        </div>

        {/* Aparência */}
        <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={22} color="#ffcc00" /> : <Sun size={22} color="#ffcc00" />}
            <span className="text-white font-bold">Modo Escuro</span>
          </div>
          <button aria-label="Alternar modo escuro" onClick={() => setIsDark(v => !v)} className={`w-14 h-8 rounded-full transition ${isDark ? 'bg-[#ffcc00]' : 'bg-white/20'}`}>
            <div className={`w-6 h-6 rounded-full bg-black transition-transform ${isDark ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Seções */}
        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <div key={s.label} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <s.icon size={20} color="#ffcc00" />
              <span className="text-white font-bold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Área direita (espelho do mobile) */}
      <div className="flex-1 p-12 overflow-y-auto">
        <h2 className="text-2xl font-black text-white mb-6">Configurações</h2>
        <p className="text-white/50 max-w-xl leading-relaxed">
          Estas configurações espelham o aplicativo mobile BeepApp. As preferências de aparência e conta
          são preparadas para sincronizar com a mesma fonte de dados do mobile quando a API estiver conectada.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-2">Conta</h3>
            <p className="text-white/50 text-sm">Dados do usuário e autenticação.</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-2">Notificações</h3>
            <p className="text-white/50 text-sm">Alertas de interação e pontos.</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-2">Privacidade</h3>
            <p className="text-white/50 text-sm">Controle de visibilidade.</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-2">Carteira</h3>
            <p className="text-white/50 text-sm">Beepix e recompensas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
