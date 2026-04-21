import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

interface DeviceStatus {
  uid: string;
  app: string;
  connected: boolean;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [deviceStatuses, setDeviceStatuses] = useState<Map<string, DeviceStatus>>(new Map());

  useEffect(() => {
    const socket = io('/portal', {
      path: '/proxy',
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('device:status', (status: DeviceStatus) => {
      setDeviceStatuses((prev) => {
        const next = new Map(prev);
        next.set(status.uid, status);
        return next;
      });
    });

    socket.on('device:status:all', (statuses: DeviceStatus[]) => {
      const next = new Map<string, DeviceStatus>();
      for (const s of statuses) {
        next.set(s.uid, s);
      }
      setDeviceStatuses(next);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const isDeviceConnected = useCallback(
    (uid: string) => deviceStatuses.get(uid)?.connected ?? false,
    [deviceStatuses]
  );

  return { deviceStatuses, isDeviceConnected };
}
