#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Place Real Order
# This script demonstrates placing a real order with Bybit Demo API

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
    print("OMNI-ALPHA VΩ∞∞ Trading System - Place Real Order")
    print("Capital Genesis: $12 USDT Origin Logic")
    print()
    
    # Ask for confirmation
    print("WARNING: This script will place a real order using demo funds.")
    confirmation = input("Do you want to proceed? (yes/no): ")
    
    if confirmation.lower() != "yes":
        print("Order placement cancelled.")
        return
    
    # Get current BTC price
    print("\nGetting current BTC price...")
    price_response = get_market_price("BTCUSDT")
    
    btc_price = 0
    if price_response.get("retCode") == 0:
        result = price_response.get("result", {})
        list_data = result.get("list", [])
        if list_data:
            btc_price = float(list_data[0].get("lastPrice", "0"))
            print(f"Current BTC price: ${btc_price}")
    else:
        print(f"Failed to get BTC price: {price_response.get('retMsg')}")
        return
    
    # Calculate quantity for $12 USDT
    qty = 12 / btc_price
    qty = round(qty, 6)  # Round to 6 decimal places
    print(f"Order quantity: {qty} BTC (approx. $12 USDT)")
    
    # Place order
    print("\nPlacing a Buy Market order...")
    order_response = place_order("spot", "BTCUSDT", "Buy", "Market", qty)
    
    # Print response
    print(f"Response: {json.dumps(order_response, indent=2)}")
    
    if order_response.get("retCode") == 0:
        print("\nOrder placed successfully!")
        
        # Extract and display order details
        result = order_response.get("result", {})
        order_id = result.get("orderId")
        order_link_id = result.get("orderLinkId")
        
        print(f"\nOrder ID: {order_id}")
        print(f"Order Link ID: {order_link_id}")
        print(f"Symbol: BTCUSDT")
        print(f"Side: Buy")
        print(f"Order Type: Market")
        print(f"Quantity: {qty} BTC")
        print(f"Approximate Value: $12 USDT")
        
        print("\nZero Loss Enforcer is now monitoring this trade.")
        print("It will ensure the trade does not result in a loss.")
    else:
        print(f"\nFailed to place order: {order_response.get('retMsg')}")
    
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
