import React from 'react';
import { SocketProvider } from '../src/contexts/SocketContext';
import { TVRemote } from '../src/components/TVRemote';

export default function TVRemoteScreen() {
  return (
    <SocketProvider>
      <TVRemote />
    </SocketProvider>
  );
}
