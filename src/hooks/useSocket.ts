import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin;

export function useSocket(onEvent?: (event: string, data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      path: '/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Conectado');
    });

    socket.on('notificacao', (data: any) => {
      onEvent?.('notificacao', data);
    });

    socket.on('os-atualizada', (data: any) => {
      onEvent?.('os-atualizada', data);
    });

    socket.on('nova-solicitacao', (data: any) => {
      onEvent?.('nova-solicitacao', data);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Desconectado');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onEvent]);

  const joinCondominio = useCallback((condominioId: string) => {
    socketRef.current?.emit('join-condominio', condominioId);
  }, []);

  return { socket: socketRef, joinCondominio };
}
