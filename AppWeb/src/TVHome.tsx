import React, { useState, useEffect, useRef } from 'react';

export const TVHome: React.FC<any> = ({ channels = [], onSelectChannel }) => {
  const [focusedSection, setFocusedSection] = useState<'sidebar' | 'carousel'>('carousel');
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);

  // Tratamento Global de Teclado (D-Pad + Tecla Voltar webOS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      const c = e.keyCode;

      // Tecla Voltar do Controle da LG (keyCode 461 ou 'Back')
      if (c === 461 || k === 'Back' || k === 'GoBack') {
        // CRUCIAL: Impede que a TV abra a caixa "Deseja sair do app?"
        e.preventDefault();
        e.stopPropagation();

        if (showPlaylistManager) {
          setShowPlaylistManager(false);
        } else if (focusedSection === 'carousel') {
          setFocusedSection('sidebar');
        }
        return;
      }

      const isUp = k === 'ArrowUp' || k === 'Up' || c === 38;
      const isDown = k === 'ArrowDown' || k === 'Down' || c === 40;
      const isLeft = k === 'ArrowLeft' || k === 'Left' || c === 37;
      const isRight = k === 'ArrowRight' || k === 'Right' || c === 39;
      const isEnter = k === 'Enter' || k === 'Ok' || k === 'OK' || c === 13;

      if (isUp) {
        if (focusedSection === 'sidebar' && sidebarIndex > 0) setSidebarIndex(prev => prev - 1);
      } else if (isDown) {
        if (focusedSection === 'sidebar' && sidebarIndex < 4) setSidebarIndex(prev => prev + 1);
      } else if (isLeft) {
        if (focusedSection === 'carousel') {
          if (carouselIndex > 0) setCarouselIndex(prev => prev - 1);
          else setFocusedSection('sidebar');
        }
      } else if (isRight) {
        if (focusedSection === 'sidebar') setFocusedSection('carousel');
        else if (focusedSection === 'carousel' && carouselIndex < channels.length - 1) setCarouselIndex(prev => prev + 1);
      } else if (isEnter) {
        if (focusedSection === 'carousel' && channels.length > 0) {
          onSelectChannel(channels[carouselIndex]);
        } else if (focusedSection === 'sidebar' && sidebarIndex === 4) {
          setShowPlaylistManager(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [focusedSection, sidebarIndex, carouselIndex, channels, showPlaylistManager, onSelectChannel]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#111', color: '#fff', userSelect: 'none' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#181818', padding: '20px' }}>
        <h2>Beep TV</h2>
        <span style={{ fontSize: '12px', color: '#00ff66', fontWeight: 'bold' }}>v1.0.4 - FIX BACK/MOUSE</span>
        <div style={{ marginTop: '20px' }}>
          {['Início', 'Buscar', 'Favoritos', 'Configurações', 'Playlists'].map((item, index) => {
            const isFocused = focusedSection === 'sidebar' && sidebarIndex === index;
            return (
              <button
                key={item}
                tabIndex={0}
                onClick={(e) => {
                  e.currentTarget.focus();
                  setFocusedSection('sidebar');
                  setSidebarIndex(index);
                  if (index === 4) setShowPlaylistManager(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.focus();
                  setFocusedSection('sidebar');
                  setSidebarIndex(index);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px',
                  margin: '8px 0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  background: isFocused ? '#ff0055' : 'transparent',
                  outline: 'none'
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carrossel de Canais */}
      <div style={{ flex: 1, padding: '40px', overflowX: 'hidden' }}>
        <h3 style={{ color: '#00e5ff', fontSize: '28px', marginBottom: '20px' }}>Tv Aberta & IPTV</h3>
        {showPlaylistManager ? (
          <div style={{ padding: '20px', background: '#222', borderRadius: '10px' }}>
            <h4>Gerenciador de Playlists</h4>
            <p>Pressione o botão <b>VOLTAR</b> do controle remoto para fechar esta tela.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            {channels.length > 0 ? (
              channels.map((channel: any, index: number) => {
                const isFocused = focusedSection === 'carousel' && carouselIndex === index;
                return (
                  <button
                    key={channel.id || index}
                    tabIndex={0}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      setFocusedSection('carousel');
                      setCarouselIndex(index);
                      onSelectChannel(channel);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.focus();
                      setFocusedSection('carousel');
                      setCarouselIndex(index);
                    }}
                    style={{
                      minWidth: '220px',
                      height: '140px',
                      background: isFocused ? '#ff0055' : '#222',
                      color: '#fff',
                      fontSize: '18px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transform: isFocused ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      border: isFocused ? '3px solid #fff' : '2px solid transparent',
                      outline: 'none'
                    }}
                  >
                    <span>{channel.name || `Canal ${index + 1}`}</span>
                  </button>
                );
              })
            ) : (
              <p style={{ color: '#888' }}>Nenhum canal carregado no momento.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
