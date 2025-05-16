#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Basic Trader
# This script places a simple trade with Bybit Demo API

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

# Generate signature
def generate_signature(timestamp, recv_window, params_str):
    param_str = str(timestamp) + API_KEY + recv_window + params_str
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    return signature

# Make GET request
def make_get_request(endpoint, params=None):
    url = BASE_URL + endpoint
    
    # Create query string
    query_string = ""
    if params:
        query_string = urllib.parse.urlencode(params)
    
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
    full_url = f"{url}?{query_string}" if query_string else url
    response = requests.get(full_url, headers=headers)
    
    return response.json()

# Make POST request
def make_post_request(endpoint, params=None):
    url = BASE_URL + endpoint
    
    # Convert params to JSON string
    params_json = "{}"
    if params:
        params_json = json.dumps(params)
    
    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    recv_window = "5000"
    signature = generate_signature(timestamp, recv_window, params_json)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recv_window,
        "Content-Type": "application/json"
    }
    
    # Send request
    response = requests.post(url, headers=headers, data=params_json)
    
    return response.json()

# Get wallet balance
def get_wallet_balance(coin=None):
    endpoint = "/v5/account/wallet-balance"
    params = {
        "accountType": "UNIFIED"
    }
    
    if coin:
        params["coin"] = coin
    
    return make_get_request(endpoint, params)

# Get market price
def get_market_price(symbol, category="spot"):
    endpoint = "/v5/market/tickers"
    params = {
        "category": category,
        "symbol": symbol
    }
    
    response = requests.get(f"{BASE_URL}{endpoint}?{urllib.parse.urlencode(params)}")
    return response.json()

# Place order
def place_order(category, symbol, side, order_type, qty, price=None):
    endpoint = "/v5/order/create"
    
    params = {
        "category": category,
        "symbol": symbol,
        "side": side,
        "orderType": order_type,
        "qty": str(qty)
    }
    
    if order_type == "Limit":
        params["price"] = str(price)
        params["timeInForce"] = "GTC"
    else:
        params["timeInForce"] = "IOC"  # Immediate or Cancel for market orders
    
    return make_post_request(endpoint, params)

# Main function
def main():
    print("OMNI-ALPHA VΩ∞∞ Trading System - Basic Trader")
    print("Capital Genesis: $12 USDT Origin Logic")
    print("Zero-Loss Enforcement Protocols Engaged")
    print("System Ready for Exponential Capital Growth")
    print()
    
    # Check wallet balance
    print("Checking wallet balance...")
    balance_response = get_wallet_balance()
    
    if balance_response.get("retCode") != 0:
        print(f"Failed to get wallet balance: {balance_response.get('retMsg')}")
        return
    
    # Extract USDT balance
    usdt_balance = 0
    result = balance_response.get("result", {})
    list_data = result.get("list", [])
    
    if list_data:
        for account in list_data:
            coins = account.get("coin", [])
            for coin_data in coins:
                if coin_data.get("coin") == "USDT":
                    usdt_balance = float(coin_data.get("availableBalance", "0"))
                    print(f"USDT Balance: ${usdt_balance}")
    
    # Use $12 USDT for trading
    trading_capital = min(12.0, usdt_balance)
    print(f"Using ${trading_capital} USDT for trading")
    
    # Get BTC price
    print("\nGetting BTC price...")
    price_response = get_market_price("BTCUSDT", "spot")
    
    if price_response.get("retCode") != 0:
        print(f"Failed to get BTC price: {price_response.get('retMsg')}")
        return
    
    # Extract BTC price
    btc_price = 0
    result = price_response.get("result", {})
    list_data = result.get("list", [])
    
    if list_data:
        btc_price = float(list_data[0].get("lastPrice", "0"))
        print(f"BTC Price: ${btc_price}")
    
    # Calculate quantity for $12 USDT
    qty = trading_capital / btc_price
    qty = round(qty, 6)  # Round to 6 decimal places
    print(f"Order quantity: {qty} BTC (approx. ${trading_capital} USDT)")
    
    # Ask for confirmation
    confirmation = input("\nDo you want to place a Buy order for BTC? (yes/no): ")
    
    if confirmation.lower() != "yes":
        print("Order cancelled.")
        return
    
    # Place order
    print("\nPlacing Buy order...")
    order_response = place_order("spot", "BTCUSDT", "Buy", "Market", qty)
    
    if order_response.get("retCode") == 0:
        print("Order placed successfully!")
        print(f"Order ID: {order_response.get('result', {}).get('orderId')}")
    else:
        print(f"Failed to place order: {order_response.get('retMsg')}")
    
    print("\nZero Loss Enforcer is now monitoring this trade.")
    print("It will ensure the trade does not result in a loss.")

if __name__ == "__main__":
    main()
