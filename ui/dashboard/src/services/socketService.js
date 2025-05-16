import { io } from 'socket.io-client';

// Initialize socket connection
export const initializeSocket = () => {
  const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://3.111.22.56:10002';

  try {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
      // Add error handling for connection failures
      reconnection: true,
      // Add additional configuration for better compatibility
      forceNew: true,
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      path: '/socket.io',
    });

    // Add connection error handling
    socket.on('connect_error', (error) => {
      console.warn(`[Socket] Connection error: ${error.message}`);
    });

    socket.on('connect_timeout', () => {
      console.warn('[Socket] Connection timeout');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] Reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.warn(`[Socket] Reconnection error: ${error.message}`);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect');
    });

    // Log socket events in development
    if (process.env.NODE_ENV === 'development') {
      socket.onAny((event, ...args) => {
        console.log(`[Socket] ${event}:`, args);
      });
    }

    return socket;
  } catch (error) {
    console.error('[Socket] Error initializing socket:', error);
    // Return a dummy socket object to prevent app crashes
    return {
      connected: false,
      on: () => {},
      off: () => {},
      emit: () => {},
      connect: () => {},
      disconnect: () => {},
    };
  }
};
