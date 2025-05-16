#!/bin/bash

# Start script for OMNI-ALPHA VΩ∞∞ Trading System
# This script starts all the required services using PM2

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop any existing processes
pm2 stop omni-api omni-websocket omni-grpc 2>/dev/null || true
pm2 delete omni-api omni-websocket omni-grpc 2>/dev/null || true

# Start backend services using PM2
echo "Starting OMNI-ALPHA VΩ∞∞ Trading System backend services..."
pm2 start ecosystem.config.js

# Navigate to the frontend directory
cd ../dashboard

# Create logs directory for frontend if it doesn't exist
mkdir -p logs

# Stop any existing frontend processes
pm2 stop omni-dashboard-frontend 2>/dev/null || true
pm2 delete omni-dashboard-frontend 2>/dev/null || true

# Start frontend service using PM2
echo "Starting OMNI-ALPHA VΩ∞∞ Trading System frontend service..."
pm2 start ecosystem.config.js

# Display status
pm2 status

# Request demo funds from Bybit to ensure we have enough balance
echo "Requesting demo funds from Bybit..."
curl -X POST "http://localhost:10002/api/metrics/request-funds" \
  -H "Content-Type: application/json" \
  -d '{"coin":"USDT","amount":"100"}'

echo ""
echo "OMNI-ALPHA VΩ∞∞ Trading System services started successfully!"
echo "Dashboard Frontend: http://3.111.22.56:10001"
echo "API Server: http://3.111.22.56:10002"
echo "WebSocket Server: http://3.111.22.56:10003"
echo "gRPC Server: http://3.111.22.56:10004"
echo ""
echo "The system is now running with:"
echo "- Initial capital: 12 USDT"
echo "- Minimum profit per trade: 2.2 USDT"
echo "- Target trades per day: 750"
echo ""
echo "To monitor the system, visit the dashboard at http://3.111.22.56:10001"
echo "To view logs, use: pm2 logs"
