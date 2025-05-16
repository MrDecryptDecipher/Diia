#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Check Wallet Balance
# This script demonstrates checking wallet balance from Bybit Demo

import requests
import time
import hmac
import hashlib
import json
import urllib.parse

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# Check wallet balance endpoint
ENDPOINT = "/v5/account/wallet-balance"

# Generate signature
def generate_signature(timestamp, recv_window, params_str):
    param_str = str(timestamp) + API_KEY + recv_window + params_str
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    return signature

# Check wallet balance
def check_wallet_balance(coin=None):
    url = BASE_URL + ENDPOINT

    # Request parameters
    params = {
        "accountType": "UNIFIED"
    }

    if coin:
        params["coin"] = coin

    # Sort parameters and create query string
    query_string = urllib.parse.urlencode(sorted(params.items()))

    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    recv_window = "5000"
    signature = generate_signature(timestamp, recv_window, query_string)

    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recv_window
    }

    # Send request
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    response = requests.get(full_url, headers=headers)

    return response.json()

# Main function
def main():
    print("OMNI-ALPHA VΩ∞∞ Trading System - Check Wallet Balance")
    print("Capital Genesis: $12 USDT Origin Logic")
    print()

    # Check wallet balance
    print("Checking wallet balance...")
    response = check_wallet_balance()

    # Print response
    print(f"Response: {json.dumps(response, indent=2)}")

    if response.get("retCode") == 0:
        print("\nSuccessfully retrieved wallet balance!")

        # Extract and display balances
        result = response.get("result", {})
        list_data = result.get("list", [])

        if list_data:
            print("\nWallet Balances:")
            for account in list_data:
                account_type = account.get("accountType")
                print(f"\nAccount Type: {account_type}")

                coins = account.get("coin", [])
                for coin_data in coins:
                    coin = coin_data.get("coin")
                    equity = float(coin_data.get("equity", "0"))
                    available_balance = float(coin_data.get("availableBalance", "0"))

                    print(f"  {coin}: Equity=${equity:.2f}, Available=${available_balance:.2f}")
        else:
            print("\nNo balance data found.")
    else:
        print(f"\nFailed to retrieve wallet balance: {response.get('retMsg')}")

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
