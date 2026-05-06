import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface LogEntry {
  event: string;
  nodeId?: string;
  nodeType?: string;
  error?: string;
  ctx: {
    traceId: string;
    originalFileName: string;
    currentPath: string;
    tags: string[];
    metadata: Record<string, any>;
  };
  timestamp: number;
}

export function useSocket(flowId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (flowId) {
        socket.emit('subscribe', flowId);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('log', (payload: Omit<LogEntry, 'timestamp'>) => {
      setLogs((prev) => [...prev, { ...payload, timestamp: Date.now() }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [flowId]);

  const subscribe = useCallback(
    (id: string) => {
      socketRef.current?.emit('subscribe', id);
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { socket: socketRef.current, logs, connected, subscribe, clearLogs };
}
