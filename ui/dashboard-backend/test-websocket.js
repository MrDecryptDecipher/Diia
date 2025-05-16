const WebSocket = require('ws');

// Create a WebSocket connection to the server
const ws = new WebSocket('ws://3.111.22.56:10003');

// Connection opened
ws.on('open', function() {
  console.log('Connected to WebSocket server');

  // Subscribe to system status
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'system:status' }));

  // Subscribe to active trades
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'trades:active' }));

  // Subscribe to market data
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'market:data' }));

  // Subscribe to agent status
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'agents:status' }));

  // Subscribe to asset info
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'assets:info' }));

  // Subscribe to quantum predictions
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'quantum:predictions' }));

  // Subscribe to trade events
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'trades:events' }));

  // Subscribe to strategy performance
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'strategy:performance' }));

  // Subscribe to metrics
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'metrics' }));

  // Subscribe to trade history
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'trades:history' }));
});

// Listen for messages
ws.on('message', function(data) {
  try {
    const message = JSON.parse(data);
    console.log(`Received message on channel: ${Object.keys(message)[0]}`);

    // Uncomment to see full message data
    // console.log(JSON.stringify(message, null, 2));
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log('Raw message:', data);
  }
});

// Connection closed
ws.on('close', function() {
  console.log('Connection closed');
});

// Connection error
ws.on('error', function(error) {
  console.error('WebSocket error:', error);
});

// Keep the connection open for 30 seconds
setTimeout(() => {
  console.log('Closing connection after 30 seconds');
  ws.close();
  process.exit(0);
}, 30000);
