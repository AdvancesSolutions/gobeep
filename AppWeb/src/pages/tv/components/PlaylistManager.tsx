import React, { useState, useEffect, useRef } from 'react';
import { X, Link as LinkIcon, Server, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { type PlaylistConfig, savePlaylist, getSavedPlaylists, deletePlaylist } from '../../../services/iptvService';

interface PlaylistManagerProps {
  onClose: () => void;
  onListUpdated: () => void;
}

export default function PlaylistManager({ onClose, onListUpdated }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<PlaylistConfig[]>(getSavedPlaylists());
  const [activeTab, setActiveTab] = useState<'list' | 'add_m3u' | 'add_xtream'>('list');
  
  // Forms
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, []);

  const handleSaveM3U = () => {
    if (!name || !url) return;
    savePlaylist({ id: Math.random().toString(), name, url, type: 'm3u' });
    finishAdd();
  };

  const handleSaveXtream = () => {
    if (!name || !url || !username || !password) return;
    savePlaylist({ id: Math.random().toString(), name, url, username, password, type: 'xtream' });
    finishAdd();
  };

  const finishAdd = () => {
    setPlaylists(getSavedPlaylists());
    setActiveTab('list');
    onListUpdated();
    setName(''); setUrl(''); setUsername(''); setPassword('');
  };

  const handleDelete = (id: string) => {
    deletePlaylist(id);
    setPlaylists(getSavedPlaylists());
    onListUpdated();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-3xl font-black text-white">Gerenciar Listas IPTV</h2>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 focus:bg-white/20 outline-none">
            <X size={24} color="white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/3 border-r border-white/10 p-6 flex flex-col gap-4">
            <button 
              ref={firstButtonRef}
              onClick={() => setActiveTab('list')}
              className={`p-4 rounded-xl flex items-center gap-4 outline-none transition-all ${activeTab === 'list' ? 'bg-[#ffcc00] text-black font-bold' : 'bg-white/5 text-white/70 hover:bg-white/10 focus:ring-2 focus:ring-[#ffcc00]'}`}
            >
              <CheckCircle2 size={24} />
              Minhas Listas
            </button>
            <button 
              onClick={() => setActiveTab('add_m3u')}
              className={`p-4 rounded-xl flex items-center gap-4 outline-none transition-all ${activeTab === 'add_m3u' ? 'bg-[#ffcc00] text-black font-bold' : 'bg-white/5 text-white/70 hover:bg-white/10 focus:ring-2 focus:ring-[#ffcc00]'}`}
            >
              <LinkIcon size={24} />
              Adicionar M3U (URL)
            </button>
            <button 
              onClick={() => setActiveTab('add_xtream')}
              className={`p-4 rounded-xl flex items-center gap-4 outline-none transition-all ${activeTab === 'add_xtream' ? 'bg-[#ffcc00] text-black font-bold' : 'bg-white/5 text-white/70 hover:bg-white/10 focus:ring-2 focus:ring-[#ffcc00]'}`}
            >
              <Server size={24} />
              Login Xtream Codes
            </button>
            <div className="mt-auto p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-white/50">Dica: Use o aplicativo BeepApp no celular para parear contas de forma mais fácil na TV.</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            
            {activeTab === 'list' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold mb-4">Listas Salvas</h3>
                {playlists.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <p>Nenhuma lista IPTV adicionada.</p>
                  </div>
                ) : (
                  playlists.map(p => (
                    <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg">{p.name}</h4>
                        <p className="text-sm text-white/50">{p.type === 'm3u' ? 'Link M3U' : 'Xtream Codes'}</p>
                      </div>
                      <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40 focus:bg-red-500/40 outline-none">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'add_m3u' && (
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-bold mb-2">Nova Lista M3U</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm">Nome da Lista</label>
                  <input 
                    type="text" 
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Minha Lista Premium"
                    className="bg-black border border-white/20 rounded-lg p-4 text-white focus:border-[#ffcc00] focus:ring-1 focus:ring-[#ffcc00] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm">URL da Lista (.m3u ou .m3u8)</label>
                  <input 
                    type="text" 
                    value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="http://..."
                    className="bg-black border border-white/20 rounded-lg p-4 text-white focus:border-[#ffcc00] focus:ring-1 focus:ring-[#ffcc00] outline-none"
                  />
                </div>
                <button onClick={handleSaveM3U} className="mt-4 bg-[#ffcc00] text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffcc00]/80 focus:bg-[#ffcc00]/80 outline-none">
                  <Save size={20} /> Salvar Lista M3U
                </button>
              </div>
            )}

            {activeTab === 'add_xtream' && (
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-bold mb-2">Nova Conta Xtream Codes</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm">Nome de Exibição</label>
                  <input 
                    type="text" 
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Assinatura TV"
                    className="bg-black border border-white/20 rounded-lg p-3 text-white focus:border-[#ffcc00] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm">URL do Servidor (Host)</label>
                  <input 
                    type="text" 
                    value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="http://servidor.com:porta"
                    className="bg-black border border-white/20 rounded-lg p-3 text-white focus:border-[#ffcc00] outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-white/60 text-sm">Usuário</label>
                    <input 
                      type="text" 
                      value={username} onChange={e => setUsername(e.target.value)}
                      className="bg-black border border-white/20 rounded-lg p-3 text-white focus:border-[#ffcc00] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-white/60 text-sm">Senha</label>
                    <input 
                      type="password" 
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="bg-black border border-white/20 rounded-lg p-3 text-white focus:border-[#ffcc00] outline-none"
                    />
                  </div>
                </div>
                <button onClick={handleSaveXtream} className="mt-4 bg-[#ffcc00] text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffcc00]/80 focus:bg-[#ffcc00]/80 outline-none">
                  <Server size={20} /> Entrar com Xtream Codes
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
