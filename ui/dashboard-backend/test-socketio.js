const { io } = require('socket.io-client');

// Create a Socket.IO connection to the server
const socket = io('http://3.111.22.56:10003', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  autoConnect: true
});

// Connection opened
socket.on('connect', function() {
  console.log('Connected to Socket.IO server');
  
  // Subscribe to system status
  socket.emit('subscribe', 'system:status');
  
  // Subscribe to active trades
  socket.emit('subscribe', 'trades:active');
  
  // Subscribe to market data
  socket.emit('subscribe', 'market:data');
  
  // Subscribe to agent status
  socket.emit('subscribe', 'agents:status');
  
  // Subscribe to asset info
  socket.emit('subscribe', 'assets:info');
  
  // Subscribe to quantum predictions
  socket.emit('subscribe', 'quantum:predictions');
  
  // Subscribe to trade events
  socket.emit('subscribe', 'trades:events');
  
  // Subscribe to strategy performance
  socket.emit('subscribe', 'strategy:performance');
  
  // Subscribe to metrics
  socket.emit('subscribe', 'metrics');
  
  // Subscribe to trade history
  socket.emit('subscribe', 'trades:history');
});

// Listen for messages
socket.onAny((event, data) => {
  console.log(`Received message on channel: ${event}`);
  
  // Uncomment to see full message data
  // console.log(JSON.stringify(data, null, 2));
});

// Connection closed
socket.on('disconnect', function() {
  console.log('Connection closed');
});

// Connection error
socket.on('connect_error', function(error) {
  console.error('Socket.IO error:', error);
});

// Keep the connection open for 30 seconds
setTimeout(() => {
  console.log('Closing connection after 30 seconds');
  socket.disconnect();
  process.exit(0);
}, 30000);
