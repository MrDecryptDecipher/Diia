#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Bybit High Frequency Trader Runner
# This script runs the Bybit High Frequency Trader

echo "========================================================"
echo "  OMNI-ALPHA VΩ∞∞ Bybit High Frequency Trader"
echo "========================================================"
echo "Starting trading system with the following parameters:"
echo "- Initial Capital: $12 USDT"
echo "- Target Profit Per Trade: $2 USDT"
echo "- Target Trades Per Day: 750"
echo "- Using Bybit Demo API"
echo "========================================================"

# Build the system
echo "Building the system..."
cargo build --bin bybit_high_frequency_trader

# Run the system
echo "Starting the trading system..."
echo "Using demo API credentials from demo.env"
echo "API Key: $(grep BYBIT_DEMO_API_KEY demo.env | cut -d= -f2)"
echo "API Secret: $(grep BYBIT_DEMO_API_SECRET demo.env | cut -d= -f2 | cut -c1-5)..."
echo ""
cargo run --bin bybit_high_frequency_trader
