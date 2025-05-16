#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Request Demo Funds
# This script demonstrates requesting demo funds from Bybit

import requests
import time
import hmac
import hashlib
import json

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# Request demo funds endpoint
ENDPOINT = "/v5/account/demo-apply-money"

# Generate signature
def generate_signature(timestamp, params):
    param_str = str(timestamp) + API_KEY + json.dumps(params)
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    return signature

# Request demo funds
def request_demo_funds(coin, amount):
    url = BASE_URL + ENDPOINT
    
    # Request parameters
    params = {
        "adjustType": 0,
        "utaDemoApplyMoney": [
            {
                "coin": coin,
                "amountStr": str(amount)
            }
        ]
    }
    
    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    signature = generate_signature(timestamp, params)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "Content-Type": "application/json"
    }
    
    # Send request
    response = requests.post(url, headers=headers, json=params)
    
    return response.json()

# Main function
def main():
    print("OMNI-ALPHA VΩ∞∞ Trading System - Request Demo Funds")
    print("Capital Genesis: $12 USDT Origin Logic")
    print()
    
    # Request demo funds
    print("Requesting $12 USDT demo funds...")
    response = request_demo_funds("USDT", 12)
    
    # Print response
    print(f"Response: {json.dumps(response, indent=2)}")
    
    if response.get("retCode") == 0:
        print("\nSuccessfully requested demo funds!")
        print("You can now use these funds to trade with the OMNI-ALPHA VΩ∞∞ Trading System.")
    else:
        print(f"\nFailed to request demo funds: {response.get('retMsg')}")
    
    print("\nSystem components implemented:")
    print("- Zero Loss Enforcer for risk management")
    print("- God Kernel for agent evolution")
    print("- Memory Node for trade memory")
    print("- Compound Controller for capital management")
    print("- Ghost Trader for simulation")
    print("- Anti-Loss Hedger for hedging")
    print("- Quantum components for prediction")
    print("- Neural Interface for visualization")
    print("- Trading System for execution")
    print("- Market Simulator for backtesting")
    print("- Bybit Exchange Adapter for live trading")

if __name__ == "__main__":
    main()
