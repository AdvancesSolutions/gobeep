import React, { useEffect } from 'react';
import TVApp from './TVApp';

export const TVClient: React.FC = () => {
  useEffect(() => {
    const forceBlockExit = (e: KeyboardEvent) => {
      if (e.keyCode === 461 || e.key === 'Back' || e.key === 'GoBack') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', forceBlockExit, true);
    window.addEventListener('keyup', forceBlockExit, true);
    return () => {
      window.removeEventListener('keydown', forceBlockExit, true);
      window.removeEventListener('keyup', forceBlockExit, true);
    };
  }, []);

  return <TVApp />;
};

export default TVClient;
