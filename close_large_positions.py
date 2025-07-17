#!/usr/bin/env python3

import requests
import time
import hmac
import hashlib
import json

# Bybit Demo API credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

def generate_signature(timestamp, params_str):
    """Generate signature for Bybit API"""
    string_to_sign = f"{timestamp}{API_KEY}5000{params_str}"
    return hmac.new(
        API_SECRET.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def close_position_manually(symbol, side, size):
    """Close a position manually using the same method as the working script"""
    close_side = "Sell" if side == "Buy" else "Buy"

    timestamp = str(int(time.time() * 1000))

    order_data = {
        "category": "linear",
        "symbol": symbol,
        "side": close_side,
        "orderType": "Market",
        "qty": str(size),
        "timeInForce": "GTC",
        "positionIdx": 0
    }

    # Use the same signature method as the working script
    json_string = json.dumps(order_data, separators=(',', ':'))
    signature = generate_signature(timestamp, json_string)

    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "X-BAPI-SIGN": signature,
        "Content-Type": "application/json"
    }

    url = f"{BASE_URL}/v5/order/create"
    response = requests.post(url, headers=headers, json=order_data)

    if response.status_code == 200:
        data = response.json()
        if data['retCode'] == 0:
            print(f"✅ Successfully closed {symbol} position (Size: {size})")
            return True
        else:
            print(f"❌ Error closing {symbol}: {data['retMsg']}")
    else:
        print(f"❌ HTTP Error closing {symbol}: {response.status_code} - {response.text}")

    return False

def main():
    print("🚨 MANUALLY CLOSING REMAINING POSITIONS 🚨")
    print("=" * 50)

    # Try to close B2USDT with smaller size
    print("Attempting to close B2USDT with smaller chunks...")
    close_position_manually("B2USDT", "Sell", 20000)
    time.sleep(2)
    close_position_manually("B2USDT", "Sell", 23497)

    time.sleep(3)

    # Try to close ELXUSDT with smaller size
    print("\nAttempting to close ELXUSDT with smaller chunks...")
    close_position_manually("ELXUSDT", "Buy", 35000)
    time.sleep(2)
    close_position_manually("ELXUSDT", "Buy", 41669)

    print("\n🎯 Manual position closing complete!")

if __name__ == "__main__":
    main()
