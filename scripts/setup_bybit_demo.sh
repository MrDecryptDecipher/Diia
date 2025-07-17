#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Bybit Demo Setup Script
# Sets up Bybit demo API credentials and tests the connection

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/config/production.toml"

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
    
    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
}

# Error handler
error_exit() {
    log ERROR "$1"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    OMNI-ALPHA VΩ∞∞ Bybit Demo Setup                         ║"
echo "║                      Configure Demo Trading API                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log INFO "Setting up Bybit demo trading API"

cd "$PROJECT_ROOT"

# Step 1: Check if user has Bybit account
echo ""
log INFO "Step 1: Bybit Account Setup"
echo ""
echo "To use the OMNI-ALPHA VΩ∞∞ demo trading system, you need:"
echo "1. A Bybit account (free to create)"
echo "2. Demo/Testnet API credentials"
echo ""
echo "If you don't have a Bybit account yet:"
echo "1. Go to: https://www.bybit.com/"
echo "2. Click 'Sign Up' and create a free account"
echo "3. Complete email verification"
echo ""
read -p "Do you have a Bybit account? (y/n): " has_account

if [[ "$has_account" != "y" && "$has_account" != "Y" ]]; then
    echo ""
    log WARN "Please create a Bybit account first:"
    echo "1. Visit: https://www.bybit.com/"
    echo "2. Sign up for a free account"
    echo "3. Verify your email"
    echo "4. Run this script again"
    exit 0
fi

# Step 2: Guide user to create demo API keys
echo ""
log INFO "Step 2: Create Demo API Keys"
echo ""
echo "Now you need to create demo/testnet API keys:"
echo ""
echo "1. Go to Bybit Testnet: https://testnet.bybit.com/"
echo "2. Log in with your Bybit account credentials"
echo "3. Go to 'API Management' in your account settings"
echo "4. Click 'Create New Key'"
echo "5. Set the following permissions:"
echo "   - ✅ Read"
echo "   - ✅ Trade"
echo "   - ❌ Withdraw (NOT needed)"
echo "6. Copy the API Key and Secret"
echo ""
echo "⚠️  IMPORTANT: These are DEMO/TESTNET credentials - no real money!"
echo ""
read -p "Have you created demo API keys? (y/n): " has_keys

if [[ "$has_keys" != "y" && "$has_keys" != "Y" ]]; then
    echo ""
    log WARN "Please create demo API keys first:"
    echo "1. Visit: https://testnet.bybit.com/"
    echo "2. Go to API Management"
    echo "3. Create new API key with Read + Trade permissions"
    echo "4. Run this script again"
    exit 0
fi

# Step 3: Collect API credentials
echo ""
log INFO "Step 3: Configure API Credentials"
echo ""

echo "Enter your Bybit DEMO API credentials:"
echo ""
read -p "Demo API Key: " demo_api_key
echo ""
read -s -p "Demo API Secret: " demo_api_secret
echo ""
echo ""

if [[ -z "$demo_api_key" || -z "$demo_api_secret" ]]; then
    error_exit "API credentials cannot be empty"
fi

# Validate API key format (basic check)
if [[ ${#demo_api_key} -lt 10 ]]; then
    error_exit "API key seems too short. Please check your credentials."
fi

if [[ ${#demo_api_secret} -lt 10 ]]; then
    error_exit "API secret seems too short. Please check your credentials."
fi

log INFO "API credentials collected successfully"

# Step 4: Create configuration file
echo ""
log INFO "Step 4: Creating Configuration File"

# Create config directory if it doesn't exist
mkdir -p "$(dirname "$CONFIG_FILE")"

# Create configuration file
cat > "$CONFIG_FILE" << EOF
# OMNI-ALPHA VΩ∞∞ Trading System Configuration
# Production configuration for demo trading

[system]
name = "OMNI-ALPHA VΩ∞∞"
version = "1.0.0"
environment = "demo"

[capital]
total_capital = 12.0  # Exactly 12 USDT
currency = "USDT"

[bybit]
# Demo/Testnet API credentials (SAFE - no real money)
demo_api_key = "$demo_api_key"
demo_api_secret = "$demo_api_secret"

# Mainnet API credentials (for market data only - optional)
api_key = ""
api_secret = ""

# Trading settings
max_leverage = 50
default_leverage = 10

[trading]
max_trades_per_hour = 20
min_trade_size = 0.5
max_trade_size = 3.0
risk_tolerance = 0.7

[symbols]
# Primary trading symbols
primary = [
    "BTCUSDT",
    "ETHUSDT", 
    "BNBUSDT",
    "ADAUSDT",
    "SOLUSDT"
]

# Secondary trading symbols
secondary = [
    "DOTUSDT",
    "LINKUSDT",
    "AVAXUSDT",
    "MATICUSDT",
    "ATOMUSDT"
]

[monitoring]
log_level = "info"
enable_alerts = true
health_check_interval = 30

[performance]
memory_limit_mb = 2048
max_concurrent_trades = 10
cache_size = 1000
EOF

# Set secure permissions
chmod 600 "$CONFIG_FILE"

log INFO "Configuration file created: $CONFIG_FILE"
log INFO "File permissions set to 600 (secure)"

# Step 5: Build the test binary
echo ""
log INFO "Step 5: Building Test Binary"

log INFO "Building Bybit demo test..."
if ! cargo build --release --bin test_bybit_demo; then
    error_exit "Failed to build test binary"
fi

log INFO "Build completed successfully"

# Step 6: Test the API connection
echo ""
log INFO "Step 6: Testing API Connection"

log INFO "Testing Bybit demo API connection..."

# Set environment variables for the test
export BYBIT_DEMO_API_KEY="$demo_api_key"
export BYBIT_DEMO_API_SECRET="$demo_api_secret"
export RUST_LOG=info

# Run the test
if ./target/release/test_bybit_demo; then
    echo ""
    log INFO "✅ API connection test PASSED!"
    log INFO "✅ Bybit demo integration is working correctly"
else
    echo ""
    log ERROR "❌ API connection test FAILED!"
    log ERROR "Please check your API credentials and try again"
    echo ""
    echo "Common issues:"
    echo "1. Wrong API key or secret"
    echo "2. API key doesn't have Trade permissions"
    echo "3. Using mainnet credentials instead of testnet"
    echo "4. API key is disabled or expired"
    echo ""
    echo "Solutions:"
    echo "1. Double-check your credentials at https://testnet.bybit.com/"
    echo "2. Ensure API key has Read + Trade permissions"
    echo "3. Make sure you're using TESTNET credentials"
    echo "4. Try creating new API keys"
    exit 1
fi

# Step 7: Build demo trading system
echo ""
log INFO "Step 7: Building Demo Trading System"

log INFO "Building complete demo trading system..."
if ! cargo build --release --bin demo_trading_system; then
    error_exit "Failed to build demo trading system"
fi

log INFO "Demo trading system built successfully"

# Success message
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        SETUP COMPLETED SUCCESSFULLY                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
log INFO "🎉 Bybit demo setup completed successfully!"
echo ""
echo "✅ WHAT'S CONFIGURED:"
echo "   • Bybit demo API credentials"
echo "   • 12 USDT capital constraint"
echo "   • Trading symbols and parameters"
echo "   • Security settings"
echo ""
echo "🚀 READY TO TRADE:"
echo "   • Test API: ./target/release/test_bybit_demo"
echo "   • Start trading: ./target/release/demo_trading_system"
echo "   • View config: cat config/production.toml"
echo ""
echo "🛡️ SAFETY FEATURES:"
echo "   • Demo account only (no real money)"
echo "   • Maximum 12 USDT exposure"
echo "   • Testnet environment"
echo "   • Rate limiting and risk controls"
echo ""
echo "📊 NEXT STEPS:"
echo "   1. Run: ./target/release/demo_trading_system"
echo "   2. Watch the logs for actual trades"
echo "   3. Check your Bybit demo dashboard"
echo "   4. Monitor the 12 USDT capital constraint"
echo ""
echo "🎯 The system will now place ACTUAL trades on Bybit demo!"
echo ""

# Unset environment variables
unset BYBIT_DEMO_API_KEY
unset BYBIT_DEMO_API_SECRET
