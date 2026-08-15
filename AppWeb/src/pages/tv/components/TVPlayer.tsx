import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface TVPlayerProps {
  url: string;
  autoPlay?: boolean;
  onError?: (msg: string) => void;
  /** Recebe a referência do elemento <video> para controle externo (celular). */
  videoRefExport?: React.MutableRefObject<HTMLVideoElement | null>;
}

export default function TVPlayer({ url, autoPlay = true, onError, videoRefExport }: TVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [awaitingGesture, setAwaitingGesture] = useState(false);

  // Exporta o elemento <video> para o componente pai controlar (play/pause/volume).
  useEffect(() => {
    if (videoRefExport) videoRefExport.current = videoRef.current;
    return () => { if (videoRefExport) videoRefExport.current = null; };
  }, [videoRefExport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setAwaitingGesture(false);

    const isHls = url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl');
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

    // Limpeza de instância HLS anterior.
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // YouTube: tratado via iframe pelo componente pai (retorna null aqui).
    if (isYoutube) return;

    const tryPlay = (withGesture = false) => {
      if (!autoPlay && !withGesture) return;
      video.muted = false; // tenta sempre com áudio
      video.play()
        .then(() => setAwaitingGesture(false))
        .catch(() => {
          if (withGesture) {
            // Usuário já interagiu e mesmo assim falhou: tenta mudo como último recurso.
            video.muted = true;
            video.play().catch((e2) => console.error('Erro ao dar play (mesmo após gesto):', e2));
          } else {
            // Autoplay bloqueado por política do device -> pede gesto do usuário.
            setAwaitingGesture(true);
          }
        });
    };

    if (isHls) {
      // webOS (WebKit) raramente suporta HLS nativo -> usa hls.js.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / alguns webOS com suporte nativo.
        video.src = url;
        video.addEventListener('loadedmetadata', () => tryPlay(), { once: true });
        video.addEventListener('error', () => onError?.('Erro ao carregar o canal (HLS nativo).'), { once: true });
      } else if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: false, enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS network error, tentando recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS media error, tentando recover...');
                hls.recoverMediaError();
                break;
              default:
                onError?.('Erro fatal ao reproduzir o canal.');
                hls.destroy();
                hlsRef.current = null;
            }
          }
        });
      } else {
        // Fallback: tenta src direto mesmo sem suporte (alguns devices).
        video.src = url;
        video.addEventListener('error', () => onError?.('Este dispositivo não suporta HLS.'), { once: true });
        tryPlay();
      }
    } else {
      // URL direta (mp4, etc).
      video.src = url;
      video.addEventListener('loadedmetadata', () => tryPlay(), { once: true });
      video.addEventListener('error', () => onError?.('Erro ao carregar o vídeo.'), { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, autoPlay, onError]);

  const startWithGesture = () => {
    const video = videoRef.current;
    if (!video) return;
    setAwaitingGesture(false);
    video.muted = false;
    video.play()
      .then(() => setAwaitingGesture(false))
      .catch(() => {
        video.muted = true;
        video.play().catch((e) => console.error('Erro ao dar play (muted):', e));
      });
  };

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (videoId) {
      return (
        <iframe
          className="w-full h-full border-none"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black"
        controls={false}
        autoPlay={autoPlay}
        muted={false}
        playsInline
      />
      {awaitingGesture && (
        <button
          aria-label="Iniciar vídeo"
          onClick={startWithGesture}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) startWithGesture();
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 cursor-pointer focus:outline-none"
        >
          <div className="text-6xl mb-4">▶️</div>
          <div className="text-white font-black text-2xl">Pressione OK para iniciar o vídeo</div>
          <div className="text-white/60 text-base mt-2">O autoplay foi bloqueado pela TV</div>
        </button>
      )}
    </>
  );
}
