#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Dashboard Startup Script

echo "Starting OMNI-ALPHA VΩ∞∞ Dashboard..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Navigate to the backend directory
cd /home/ubuntu/Sandeep/projects/omni/ui/dashboard-backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start the backend server with PM2
echo "Starting backend server on port 10002..."
pm2 start src/server.js --name omni-dashboard-backend

# Navigate to the frontend directory
cd /home/ubuntu/Sandeep/projects/omni/ui/dashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the frontend server with PM2
echo "Starting frontend server on port 10001..."
pm2 start node_modules/.bin/react-scripts -- start --name omni-dashboard-frontend

echo "OMNI-ALPHA VΩ∞∞ Dashboard started successfully!"
echo "Frontend: http://3.111.22.56:10001"
echo "Backend API: http://3.111.22.56:10002"
echo "WebSocket: http://3.111.22.56:10003"
echo "gRPC: http://3.111.22.56:10004"
echo ""
echo "Use 'pm2 status' to check the status of the servers."
echo "Use 'pm2 logs omni-dashboard-backend' to view backend logs."
echo "Use 'pm2 logs omni-dashboard-frontend' to view frontend logs."
echo "Use 'pm2 stop omni-dashboard-backend omni-dashboard-frontend' to stop the servers."
