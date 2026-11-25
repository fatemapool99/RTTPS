/**
 * RTTPS - Socket.IO Context Provider
 * Handles real-time websocket updates, train GPS feeds, and push alerts.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState({}); // trainNumber -> telemetry
  const [recentAlert, setRecentAlert] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to RTTPS real-time feed');
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from RTTPS real-time feed');
      setConnected(false);
    });

    // Listen for train location telemetry
    s.on('train:location_update', (telemetry) => {
      setLiveTelemetry(prev => ({
        ...prev,
        [telemetry.trainNumber]: telemetry
      }));
    });

    // Listen for new operational alerts
    s.on('notification:new', (alert) => {
      setRecentAlert(alert);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const subscribeTrain = (trainNumber) => {
    if (socket && connected) {
      socket.emit('subscribe:train', trainNumber);
    }
  };

  const unsubscribeTrain = (trainNumber) => {
    if (socket && connected) {
      socket.emit('unsubscribe:train', trainNumber);
    }
  };

  const value = {
    socket,
    connected,
    liveTelemetry,
    recentAlert,
    clearAlert: () => setRecentAlert(null),
    subscribeTrain,
    unsubscribeTrain
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
