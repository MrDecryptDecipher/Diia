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

def get_positions():
    """Get all positions from Bybit"""
    endpoint = "/v5/position/list"
    timestamp = str(int(time.time() * 1000))

    params = "category=linear&settleCoin=USDT"
    signature = generate_signature(timestamp, params)

    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "X-BAPI-SIGN": signature
    }

    url = f"{BASE_URL}{endpoint}?{params}"

    try:
        response = requests.get(url, headers=headers)
        data = response.json()

        print("=== BYBIT POSITIONS ===")
        print(f"Response: {json.dumps(data, indent=2)}")

        if data.get("retCode") == 0:
            positions = data.get("result", {}).get("list", [])

            print(f"\n=== ACTIVE POSITIONS ({len(positions)} total) ===")

            for pos in positions:
                size = float(pos.get("size", "0"))
                if size > 0:
                    symbol = pos.get("symbol", "")
                    side = pos.get("side", "")
                    entry_price = float(pos.get("avgPrice", "0"))
                    mark_price = float(pos.get("markPrice", "0"))
                    notional = size * mark_price
                    leverage = float(pos.get("leverage", "1"))
                    margin = notional / leverage
                    unrealized_pnl = float(pos.get("unrealisedPnl", "0"))

                    print(f"\n📊 {symbol}:")
                    print(f"   Side: {side}")
                    print(f"   Size: {size}")
                    print(f"   Entry Price: ${entry_price:,.2f}")
                    print(f"   Mark Price: ${mark_price:,.2f}")
                    print(f"   Notional Value: ${notional:,.2f}")
                    print(f"   Leverage: {leverage}x")
                    print(f"   Margin Used: ${margin:,.2f}")
                    print(f"   Unrealized PnL: ${unrealized_pnl:,.2f}")
        else:
            print(f"❌ Error: {data.get('retMsg', 'Unknown error')}")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    get_positions()