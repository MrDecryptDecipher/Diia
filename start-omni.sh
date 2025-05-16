#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Trading System Startup Script
# This script sets up and starts all components of the OMNI-ALPHA system

# Set the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$BASE_DIR/ui"
BACKEND_DIR="$UI_DIR/dashboard-backend"
FRONTEND_DIR="$UI_DIR/dashboard"
LOGS_DIR="$BASE_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Function to display colored output
function echo_color() {
  local color=$1
  local message=$2
  
  case $color in
    "red") echo -e "\e[31m$message\e[0m" ;;
    "green") echo -e "\e[32m$message\e[0m" ;;
    "yellow") echo -e "\e[33m$message\e[0m" ;;
    "blue") echo -e "\e[34m$message\e[0m" ;;
    "magenta") echo -e "\e[35m$message\e[0m" ;;
    "cyan") echo -e "\e[36m$message\e[0m" ;;
    *) echo "$message" ;;
  esac
}

# Function to check if a port is in use
function is_port_in_use() {
  local port=$1
  netstat -tuln | grep -q ":$port "
  return $?
}

# Function to stop existing processes
function stop_existing_processes() {
  echo_color "yellow" "Stopping existing OMNI-ALPHA processes..."
  
  # Stop PM2 processes
  pm2 stop omni-api omni-websocket omni-grpc omni-dashboard-frontend 2>/dev/null || true
  pm2 delete omni-api omni-websocket omni-grpc omni-dashboard-frontend 2>/dev/null || true
  
  echo_color "green" "Existing processes stopped."
}

# Function to install dependencies
function install_dependencies() {
  echo_color "yellow" "Installing backend dependencies..."
  cd "$BACKEND_DIR" || exit 1
  npm install
  
  echo_color "yellow" "Installing frontend dependencies..."
  cd "$FRONTEND_DIR" || exit 1
  npm install
  
  echo_color "green" "Dependencies installed successfully."
}

# Function to check and create required directories
function check_directories() {
  echo_color "yellow" "Checking required directories..."
  
  # Create logs directories
  mkdir -p "$BACKEND_DIR/logs"
  mkdir -p "$FRONTEND_DIR/logs"
  
  # Create protos directory if it doesn't exist
  mkdir -p "$BACKEND_DIR/src/protos"
  
  echo_color "green" "Directories checked and created."
}

# Function to start the system
function start_system() {
  echo_color "magenta" "Starting OMNI-ALPHA VΩ∞∞ Trading System..."
  
  # Start backend services
  cd "$BACKEND_DIR" || exit 1
  echo_color "yellow" "Starting backend services..."
  pm2 start ecosystem.config.js
  
  # Start frontend
  cd "$FRONTEND_DIR" || exit 1
  echo_color "yellow" "Starting frontend..."
  pm2 start ecosystem.config.js
  
  # Display status
  pm2 status
  
  echo_color "green" "OMNI-ALPHA VΩ∞∞ Trading System started successfully!"
  echo_color "cyan" "Dashboard Frontend: http://3.111.22.56:10001"
  echo_color "cyan" "API Server: http://3.111.22.56:10002"
  echo_color "cyan" "WebSocket Server: http://3.111.22.56:10003"
  echo_color "cyan" "gRPC Server: http://3.111.22.56:10004"
  
  echo_color "yellow" "The system is now running with:"
  echo_color "yellow" "- Initial capital: 12 USDT"
  echo_color "yellow" "- Minimum profit per trade: 2.2 USDT"
  echo_color "yellow" "- Target trades per day: 750"
  
  echo_color "blue" "To monitor the system, visit the dashboard at http://3.111.22.56:10001"
  echo_color "blue" "To view logs, use: pm2 logs"
}

# Function to request demo funds
function request_demo_funds() {
  echo_color "yellow" "Requesting demo funds from Bybit..."
  
  # Wait for API server to start
  sleep 5
  
  # Request demo funds
  curl -X POST "http://localhost:10002/api/metrics/request-funds" \
    -H "Content-Type: application/json" \
    -d '{"coin":"USDT","amount":"100"}'
  
  echo ""
  echo_color "green" "Demo funds requested."
}

# Function to set up Nginx
function setup_nginx() {
  echo_color "yellow" "Setting up Nginx configuration..."
  
  # Check if Nginx is installed
  if ! command -v nginx &> /dev/null; then
    echo_color "red" "Nginx is not installed. Please install it first."
    return 1
  fi
  
  # Create Nginx configuration file
  sudo cp "$BACKEND_DIR/nginx.conf" /etc/nginx/sites-available/omni.conf
  
  # Create symbolic link to enable the site
  sudo ln -sf /etc/nginx/sites-available/omni.conf /etc/nginx/sites-enabled/
  
  # Test Nginx configuration
  sudo nginx -t
  
  # Reload Nginx
  sudo systemctl reload nginx
  
  echo_color "green" "Nginx configuration set up successfully."
}

# Main execution
echo_color "cyan" "==================================================="
echo_color "cyan" "  OMNI-ALPHA VΩ∞∞ Trading System Startup Script"
echo_color "cyan" "==================================================="

# Stop existing processes
stop_existing_processes

# Check and create required directories
check_directories

# Install dependencies
install_dependencies

# Set up Nginx
setup_nginx

# Start the system
start_system

# Request demo funds
request_demo_funds

echo_color "cyan" "==================================================="
echo_color "green" "OMNI-ALPHA VΩ∞∞ Trading System is now ready!"
echo_color "cyan" "==================================================="
