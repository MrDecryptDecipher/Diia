#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored text
echo_color() {
  echo -e "${1}${2}${NC}"
}

# Set the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$BASE_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Function to stop existing processes
function stop_existing_processes() {
  echo_color "$YELLOW" "Stopping existing OMNI-ALPHA processes..."
  
  # Stop PM2 processes
  pm2 stop omni-api omni-websocket omni-grpc omni-dashboard-frontend 2>/dev/null || true
  pm2 delete omni-api omni-websocket omni-grpc omni-dashboard-frontend 2>/dev/null || true
  
  echo_color "$GREEN" "Existing processes stopped."
}

# Function to start the system
function start_system() {
  echo_color "$MAGENTA" "Starting OMNI-ALPHA VΩ∞∞ Trading System..."
  
  # Start PM2 processes
  echo_color "$YELLOW" "Starting OMNI PM2 processes..."
  pm2 start ecosystem.config.js
  
  # Display status
  pm2 status
  
  echo_color "$GREEN" "OMNI-ALPHA VΩ∞∞ Trading System started successfully!"
  echo_color "$CYAN" "Dashboard Frontend: http://3.111.22.56:10001"
  echo_color "$CYAN" "API Server: http://3.111.22.56:10002"
  echo_color "$CYAN" "WebSocket Server: http://3.111.22.56:10003"
  echo_color "$CYAN" "gRPC Server: http://3.111.22.56:10004"
}

# Main execution
echo_color "$CYAN" "==================================================="
echo_color "$CYAN" "  OMNI-ALPHA VΩ∞∞ Trading System Deployment Script"
echo_color "$CYAN" "==================================================="

# Stop existing processes
stop_existing_processes

# Start the system
start_system

echo_color "$CYAN" "==================================================="
echo_color "$GREEN" "OMNI-ALPHA VΩ∞∞ Trading System is now ready!"
echo_color "$CYAN" "==================================================="
