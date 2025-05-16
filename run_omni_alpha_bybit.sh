#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Trading System - Bybit Integration
# This script builds and runs the OMNI-ALPHA VΩ∞∞ trading system with Bybit integration.

echo "Building OMNI-ALPHA VΩ∞∞ Trading System..."
cargo build --bin omni_alpha_bybit

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "Running OMNI-ALPHA VΩ∞∞ Trading System with Bybit integration..."
    echo "Press Ctrl+C to stop."
    echo ""
    
    # Run the system
    cargo run --bin omni_alpha_bybit
else
    echo "Build failed!"
fi
