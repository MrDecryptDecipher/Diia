#!/bin/bash

# OMNI-ALPHA VΩ∞∞ Trading System
# This script builds and runs the OMNI-ALPHA VΩ∞∞ trading system.

echo "Building OMNI-ALPHA VΩ∞∞ Trading System..."
cargo build --bin omni_alpha_executor

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "Running OMNI-ALPHA VΩ∞∞ Trading System..."
    echo "Press Ctrl+C to stop."
    echo ""

    # Run the system
    cargo run --bin omni_alpha_executor
else
    echo "Build failed!"
fi
