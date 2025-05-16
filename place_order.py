#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Place Order
# This script demonstrates placing an order on Bybit Demo

import requests
import time
import hmac
import hashlib
import json

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# Place order endpoint
ENDPOINT = "/v5/order/create"

# Generate signature
def generate_signature(timestamp, recv_window, params_str):
    param_str = str(timestamp) + API_KEY + recv_window + params_str
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    return signature

# Place order
def place_order(symbol, side, order_type, qty, price=None):
    url = BASE_URL + ENDPOINT

    # Request parameters
    params = {
        "category": "spot",  # Using spot trading as it's easier for demo purposes
        "symbol": symbol,
        "side": side,
        "orderType": order_type,
        "qty": str(qty),
        "timeInForce": "GTC"
    }

    if price and order_type == "Limit":
        params["price"] = str(price)

    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    recv_window = "5000"
    params_json = json.dumps(params)
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

# Main function
def main():
    print("OMNI-ALPHA VΩ∞∞ Trading System - Place Order")
    print("Capital Genesis: $12 USDT Origin Logic")
    print()

    # Get current BTC price
    print("Getting current BTC price...")
    ticker_url = f"{BASE_URL}/v5/market/tickers?category=spot&symbol=BTCUSDT"
    ticker_response = requests.get(ticker_url)
    ticker_data = ticker_response.json()

    btc_price = 0
    if ticker_data.get("retCode") == 0:
        result = ticker_data.get("result", {})
        list_data = result.get("list", [])
        if list_data:
            btc_price = float(list_data[0].get("lastPrice", "0"))

    print(f"Current BTC price: ${btc_price}")

    # Calculate quantity for $12 USDT
    qty = 12 / btc_price
    qty = round(qty, 6)  # Round to 6 decimal places

    print(f"Placing a Buy Market order for {qty} BTC (approx. $12 USDT)...")

    # Place order
    response = place_order("BTCUSDT", "Buy", "Market", qty)

    # Print response
    print(f"Response: {json.dumps(response, indent=2)}")

    if response.get("retCode") == 0:
        print("\nSuccessfully placed order!")

        # Extract and display order details
        result = response.get("result", {})
        order_id = result.get("orderId")
        order_link_id = result.get("orderLinkId")

        print(f"\nOrder ID: {order_id}")
        print(f"Order Link ID: {order_link_id}")
        print(f"Symbol: BTCUSDT")
        print(f"Side: Buy")
        print(f"Order Type: Market")
        print(f"Quantity: {qty} BTC")
        print(f"Approximate Value: $12 USDT")
    else:
        print(f"\nFailed to place order: {response.get('retMsg')}")

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
