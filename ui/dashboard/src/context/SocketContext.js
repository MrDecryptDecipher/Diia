import React, { createContext, useContext, useEffect, useState } from 'react';

// Create context
const SocketContext = createContext();

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Socket provider component
export const SocketProvider = ({ socket, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!socket) return;
    
    // Set up event listeners
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    
    const onError = (error) => {
      console.error('Socket error:', error);
    };
    
    // Add event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    
    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
    }
    
    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
    };
  }, [socket]);
  
  // Subscribe to a channel
  const subscribe = (channel) => {
    if (!socket || !isConnected) return;
    socket.emit('subscribe', channel);
  };
  
  // Unsubscribe from a channel
  const unsubscribe = (channel) => {
    if (!socket || !isConnected) return;
    socket.emit('unsubscribe', channel);
  };
  
  // Listen for events on a channel
  const on = (event, callback) => {
    if (!socket) return () => {};
    socket.on(event, callback);
    return () => socket.off(event, callback);
  };
  
  // Emit an event
  const emit = (event, data) => {
    if (!socket || !isConnected) return;
    socket.emit(event, data);
  };
  
  // Context value
  const value = {
    socket,
    isConnected,
    subscribe,
    unsubscribe,
    on,
    emit,
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
