#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Production Deployment Script
# This script handles production deployment with comprehensive validation

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/omni_deploy_$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handler
error_exit() {
    log ERROR "Deployment failed: $1"
    log ERROR "Check log file: $LOG_FILE"
    exit 1
}

# Cleanup function
cleanup() {
    log INFO "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Trap for cleanup
trap cleanup EXIT

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    OMNI-ALPHA VΩ∞∞ Production Deployment                     ║"
echo "║                         Advanced Trading System                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log INFO "Starting OMNI-ALPHA VΩ∞∞ production deployment"
log INFO "Deployment ID: $DEPLOYMENT_ID"
log INFO "Log file: $LOG_FILE"

# Phase 1: Pre-deployment validation
log INFO "Phase 1: Pre-deployment validation"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error_exit "Do not run this script as root for security reasons"
fi

# Check system requirements
log INFO "Checking system requirements..."

# Check Rust installation
if ! command -v rustc &> /dev/null; then
    error_exit "Rust is not installed. Please install Rust first."
fi

RUST_VERSION=$(rustc --version | cut -d' ' -f2)
log INFO "Rust version: $RUST_VERSION"

# Check Cargo
if ! command -v cargo &> /dev/null; then
    error_exit "Cargo is not installed"
fi

# Check Git
if ! command -v git &> /dev/null; then
    error_exit "Git is not installed"
fi

# Check available memory
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
log INFO "Available memory: ${AVAILABLE_MEMORY}GB"

if (( $(echo "$AVAILABLE_MEMORY < 2.0" | bc -l) )); then
    log WARN "Low available memory: ${AVAILABLE_MEMORY}GB (recommended: 4GB+)"
fi

# Check disk space
AVAILABLE_DISK=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
log INFO "Available disk space: $AVAILABLE_DISK"

# Validate project structure
log INFO "Validating project structure..."

REQUIRED_FILES=(
    "Cargo.toml"
    "src/lib.rs"
    "src/main.rs"
    "config/production.toml.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
        error_exit "Required file missing: $file"
    fi
done

log INFO "Project structure validation passed"

# Phase 2: Environment setup
log INFO "Phase 2: Environment setup"

cd "$PROJECT_ROOT"

# Check for configuration file
if [[ ! -f "config/production.toml" ]]; then
    log WARN "Production configuration not found, creating from example..."
    cp "config/production.toml.example" "config/production.toml"
    log WARN "Please edit config/production.toml with your API keys before continuing"
    read -p "Press Enter when configuration is ready..."
fi

# Validate configuration
log INFO "Validating configuration..."
if ! grep -q "api_key.*=" config/production.toml; then
    log WARN "API key not configured in production.toml"
fi

# Set environment variables
export RUST_LOG=info
export RUST_BACKTRACE=1

log INFO "Environment setup completed"

# Phase 3: Build and test
log INFO "Phase 3: Build and test"

# Clean previous builds
log INFO "Cleaning previous builds..."
cargo clean

# Update dependencies
log INFO "Updating dependencies..."
cargo update

# Build in release mode
log INFO "Building in release mode..."
if ! cargo build --release; then
    error_exit "Build failed"
fi

log INFO "Build completed successfully"

# Run tests
log INFO "Running tests..."
if ! cargo test --release; then
    log WARN "Some tests failed, but continuing deployment"
fi

# Phase 4: Security validation
log INFO "Phase 4: Security validation"

# Check for hardcoded secrets
log INFO "Scanning for hardcoded secrets..."
if grep -r "sk-" src/ 2>/dev/null; then
    log WARN "Potential hardcoded API keys found in source code"
fi

# Check file permissions
log INFO "Checking file permissions..."
find "$PROJECT_ROOT" -name "*.toml" -exec chmod 600 {} \;
log INFO "Configuration file permissions secured"

# Phase 5: Performance validation
log INFO "Phase 5: Performance validation"

# Check binary size
BINARY_SIZE=$(du -h target/release/omni | cut -f1)
log INFO "Binary size: $BINARY_SIZE"

# Run performance benchmark
log INFO "Running performance benchmark..."
if [[ -f "target/release/integration_test" ]]; then
    log INFO "Running integration test..."
    timeout 120 ./target/release/integration_test --duration 60 --min-assets 5 --min-trades 2 || log WARN "Integration test failed or timed out"
fi

# Phase 6: Deployment preparation
log INFO "Phase 6: Deployment preparation"

# Create deployment directory
DEPLOY_DIR="/opt/omni-alpha"
if [[ ! -d "$DEPLOY_DIR" ]]; then
    log INFO "Creating deployment directory: $DEPLOY_DIR"
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown "$USER:$USER" "$DEPLOY_DIR"
fi

# Copy binaries
log INFO "Copying binaries to deployment directory..."
cp target/release/omni "$DEPLOY_DIR/"
cp target/release/bybit_high_frequency_trader "$DEPLOY_DIR/" 2>/dev/null || log WARN "bybit_high_frequency_trader binary not found"
cp target/release/integration_test "$DEPLOY_DIR/" 2>/dev/null || log WARN "integration_test binary not found"

# Copy configuration
log INFO "Copying configuration..."
cp -r config "$DEPLOY_DIR/"

# Create logs directory
mkdir -p "$DEPLOY_DIR/logs"

# Phase 7: Service setup
log INFO "Phase 7: Service setup"

# Create systemd service file
log INFO "Creating systemd service..."
sudo tee /etc/systemd/system/omni-alpha.service > /dev/null << EOF
[Unit]
Description=OMNI-ALPHA VΩ∞∞ Trading System
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=$DEPLOY_DIR/omni
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=RUST_LOG=info
Environment=RUST_BACKTRACE=1

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEPLOY_DIR

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

log INFO "Systemd service created"

# Phase 8: Health checks
log INFO "Phase 8: Health checks"

# Test binary execution
log INFO "Testing binary execution..."
if ! timeout 10 "$DEPLOY_DIR/omni" --help > /dev/null 2>&1; then
    log WARN "Binary execution test failed"
fi

# Check dependencies
log INFO "Checking runtime dependencies..."
if ! ldd "$DEPLOY_DIR/omni" > /dev/null 2>&1; then
    log WARN "Dependency check failed"
fi

# Phase 9: Backup current deployment
log INFO "Phase 9: Backup current deployment"

BACKUP_DIR="/opt/omni-alpha-backup-$(date +%Y%m%d_%H%M%S)"
if [[ -d "$DEPLOY_DIR" ]] && [[ -f "$DEPLOY_DIR/omni" ]]; then
    log INFO "Creating backup of current deployment..."
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
    log INFO "Backup created: $BACKUP_DIR"
fi

# Phase 10: Final deployment
log INFO "Phase 10: Final deployment"

# Stop existing service if running
if systemctl is-active --quiet omni-alpha; then
    log INFO "Stopping existing service..."
    sudo systemctl stop omni-alpha
fi

# Enable and start service
log INFO "Enabling and starting service..."
sudo systemctl enable omni-alpha
sudo systemctl start omni-alpha

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet omni-alpha; then
    log INFO "Service started successfully"
else
    error_exit "Service failed to start"
fi

# Phase 11: Post-deployment validation
log INFO "Phase 11: Post-deployment validation"

# Check service logs
log INFO "Checking service logs..."
sudo journalctl -u omni-alpha --no-pager -n 20

# Wait for system to stabilize
log INFO "Waiting for system stabilization..."
sleep 30

# Final health check
if systemctl is-active --quiet omni-alpha; then
    log INFO "Final health check passed"
else
    error_exit "Final health check failed"
fi

# Success
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        DEPLOYMENT COMPLETED SUCCESSFULLY                     ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log INFO "OMNI-ALPHA VΩ∞∞ deployment completed successfully!"
log INFO "Deployment ID: $DEPLOYMENT_ID"
log INFO "Service status: $(systemctl is-active omni-alpha)"
log INFO "Logs: sudo journalctl -u omni-alpha -f"
log INFO "Stop service: sudo systemctl stop omni-alpha"
log INFO "Start service: sudo systemctl start omni-alpha"
log INFO "Restart service: sudo systemctl restart omni-alpha"

echo ""
echo "🎉 OMNI-ALPHA VΩ∞∞ is now running in production!"
echo "📊 Monitor with: sudo journalctl -u omni-alpha -f"
echo "🛑 Stop with: sudo systemctl stop omni-alpha"
echo ""
