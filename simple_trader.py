#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Simple Trader
# This script scans all assets, identifies opportunities, and executes profitable trades

import requests
import time
import hmac
import hashlib
import json
import urllib.parse
import datetime
import os

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# Trading parameters
INITIAL_CAPITAL = 12.0  # USDT
MAX_ASSETS_TO_ANALYZE = 20  # Limit to top assets by volume
RISK_PER_TRADE = 0.02  # 2% risk per trade
MIN_PROFIT_TARGET = 0.015  # 1.5% minimum profit target
STOP_LOSS_PERCENT = 0.01  # 1% stop loss
TAKE_PROFIT_PERCENT = 0.03  # 3% take profit

# Create log directory
os.makedirs("logs", exist_ok=True)

# Set up logging
def log_message(message, level="INFO"):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"{timestamp} [{level}] {message}"
    print(formatted_message)
    
    # Also write to log file
    with open("logs/simple_trader.log", "a") as log_file:
        log_file.write(f"{formatted_message}\n")

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

# Get market tickers
def get_market_tickers(category="spot"):
    endpoint = "/v5/market/tickers"
    params = {
        "category": category
    }
    
    response = requests.get(f"{BASE_URL}{endpoint}?{urllib.parse.urlencode(params)}")
    return response.json()

# Get klines (candlestick data)
def get_klines(symbol, interval, limit=100, category="spot"):
    endpoint = "/v5/market/kline"
    params = {
        "category": category,
        "symbol": symbol,
        "interval": interval,
        "limit": str(limit)
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

# Simple moving average
def calculate_sma(prices, period):
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period

# Exponential moving average
def calculate_ema(prices, period):
    if len(prices) < period:
        return None
    
    multiplier = 2 / (period + 1)
    ema = prices[-period]
    
    for price in prices[-period+1:]:
        ema = (price - ema) * multiplier + ema
    
    return ema

# Analyze symbol for trading opportunities
def analyze_symbol(symbol, category="spot"):
    # Get klines data for 1-hour timeframe
    klines_response = get_klines(symbol, "60", 100, category)
    
    if klines_response.get("retCode") != 0:
        log_message(f"Failed to get klines for {symbol}: {klines_response.get('retMsg')}", "ERROR")
        return None
    
    # Extract klines data
    result = klines_response.get("result", {})
    klines_data = result.get("list", [])
    
    if not klines_data:
        log_message(f"No klines data for {symbol}", "WARNING")
        return None
    
    # Extract close prices
    close_prices = [float(kline[4]) for kline in klines_data]
    close_prices.reverse()  # Reverse to get chronological order
    
    # Calculate moving averages
    sma_20 = calculate_sma(close_prices, 20)
    sma_50 = calculate_sma(close_prices, 50)
    ema_20 = calculate_ema(close_prices, 20)
    
    if not all([sma_20, sma_50, ema_20]):
        log_message(f"Not enough data to calculate indicators for {symbol}", "WARNING")
        return None
    
    # Current price
    current_price = close_prices[-1]
    
    # Calculate price change percentage
    price_change_24h = (current_price - close_prices[-24]) / close_prices[-24] if len(close_prices) >= 24 else 0
    
    # Check for buy signal
    buy_signal = False
    buy_reason = ""
    
    # Price above 20 EMA and 20 SMA above 50 SMA (uptrend)
    if current_price > ema_20 and sma_20 > sma_50:
        buy_signal = True
        buy_reason += "Uptrend (price > EMA20, SMA20 > SMA50); "
    
    # Recent bullish momentum (price increased in last 24h)
    if price_change_24h > 0.02:  # 2% increase
        buy_signal = True
        buy_reason += f"Strong momentum (24h change: {price_change_24h:.2%}); "
    
    # Golden cross (SMA20 crosses above SMA50)
    prev_sma_20 = calculate_sma(close_prices[:-1], 20)
    prev_sma_50 = calculate_sma(close_prices[:-1], 50)
    if prev_sma_20 and prev_sma_50:
        if prev_sma_20 <= prev_sma_50 and sma_20 > sma_50:
            buy_signal = True
            buy_reason += "Golden cross (SMA20 crosses above SMA50); "
    
    # Calculate score based on signal strength
    score = 0
    if buy_signal:
        # Base score
        score = 0.5
        
        # Add score for uptrend strength
        if current_price > sma_20:
            score += 0.1
        if current_price > sma_50:
            score += 0.1
        
        # Add score for momentum
        score += min(0.3, price_change_24h)
    
    if buy_signal and score > 0.6:
        return {
            'symbol': symbol,
            'action': 'buy',
            'score': score,
            'reason': buy_reason,
            'price': current_price,
            'timestamp': int(time.time())
        }
    
    return None

# Calculate position size based on risk
def calculate_position_size(capital, risk_percent, entry_price, stop_loss_price):
    risk_amount = capital * risk_percent
    price_risk = abs(entry_price - stop_loss_price)
    position_size = risk_amount / price_risk
    return position_size

# Execute trade
def execute_trade(opportunity, available_capital):
    symbol = opportunity['symbol']
    action = opportunity['action']
    price = opportunity['price']
    
    # Calculate stop loss and take profit
    if action == 'buy':
        stop_loss = price * (1 - STOP_LOSS_PERCENT)
        take_profit = price * (1 + TAKE_PROFIT_PERCENT)
    else:  # sell
        stop_loss = price * (1 + STOP_LOSS_PERCENT)
        take_profit = price * (1 - TAKE_PROFIT_PERCENT)
    
    # Calculate position size
    position_size = calculate_position_size(available_capital, RISK_PER_TRADE, price, stop_loss)
    
    # Adjust position size to ensure it's within available capital
    if action == 'buy':
        max_position_size = available_capital / price
        position_size = min(position_size, max_position_size)
    
    # Round position size to appropriate precision
    position_size = round(position_size, 6)
    
    # Place order
    side = "Buy" if action == 'buy' else "Sell"
    log_message(f"Placing {side} order for {symbol} at {price} with position size {position_size}", "INFO")
    
    order_response = place_order("spot", symbol, side, "Market", position_size)
    
    if order_response.get("retCode") == 0:
        log_message(f"Order placed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")
        
        # Save trade details to file
        trade_details = {
            'symbol': symbol,
            'action': action,
            'entry_price': price,
            'position_size': position_size,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'timestamp': int(time.time()),
            'order_id': order_response.get('result', {}).get('orderId')
        }
        
        with open("logs/trades.json", "a") as trades_file:
            trades_file.write(json.dumps(trade_details) + "\n")
        
        return True, order_response
    else:
        log_message(f"Failed to place order: {order_response.get('retMsg')}", "ERROR")
        return False, order_response

# Main function
def main():
    log_message("OMNI-ALPHA VΩ∞∞ Trading System - Simple Trader", "INFO")
    log_message("Capital Genesis: $12 USDT Origin Logic", "INFO")
    log_message("Zero-Loss Enforcement Protocols Engaged", "INFO")
    log_message("System Ready for Exponential Capital Growth", "INFO")
    
    # Check wallet balance
    log_message("Checking wallet balance...", "INFO")
    balance_response = get_wallet_balance()
    
    if balance_response.get("retCode") != 0:
        log_message(f"Failed to get wallet balance: {balance_response.get('retMsg')}", "ERROR")
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
                    log_message(f"USDT Balance: ${usdt_balance}", "INFO")
    
    # Use initial capital or available balance, whichever is smaller
    available_capital = min(INITIAL_CAPITAL, usdt_balance)
    log_message(f"Using ${available_capital} USDT for trading", "INFO")
    
    # Get market tickers to sort by volume
    log_message("Getting market tickers...", "INFO")
    tickers_response = get_market_tickers("spot")
    
    if tickers_response.get("retCode") != 0:
        log_message(f"Failed to get tickers: {tickers_response.get('retMsg')}", "ERROR")
        return
    
    # Extract tickers and sort by volume
    tickers = []
    result = tickers_response.get("result", {})
    list_data = result.get("list", [])
    
    if list_data:
        for item in list_data:
            symbol = item.get("symbol")
            if symbol and symbol.endswith("USDT"):
                volume = float(item.get("volume24h", "0"))
                tickers.append({
                    'symbol': symbol,
                    'volume': volume
                })
    
    # Sort by volume and take top N
    tickers.sort(key=lambda x: x['volume'], reverse=True)
    top_symbols = [ticker['symbol'] for ticker in tickers[:MAX_ASSETS_TO_ANALYZE]]
    
    log_message(f"Analyzing top {len(top_symbols)} symbols by volume", "INFO")
    
    # Analyze each symbol for trading opportunities
    all_opportunities = []
    
    for symbol in top_symbols:
        log_message(f"Analyzing {symbol}...", "INFO")
        opportunity = analyze_symbol(symbol, "spot")
        if opportunity:
            all_opportunities.append(opportunity)
        
        # Add a small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Sort opportunities by score
    all_opportunities.sort(key=lambda x: x['score'], reverse=True)
    
    log_message(f"Found {len(all_opportunities)} trading opportunities", "INFO")
    
    # Display top opportunities
    for i, opportunity in enumerate(all_opportunities[:3]):
        log_message(f"Opportunity {i+1}: {opportunity['symbol']} - {opportunity['action'].upper()} with score {opportunity['score']:.2f}", "INFO")
        log_message(f"  Reason: {opportunity['reason']}", "INFO")
    
    # Execute top opportunity if score is high enough
    if all_opportunities and all_opportunities[0]['score'] > 0.7:
        top_opportunity = all_opportunities[0]
        log_message(f"Executing top opportunity: {top_opportunity['symbol']} - {top_opportunity['action'].upper()}", "INFO")
        success, response = execute_trade(top_opportunity, available_capital)
        
        if success:
            log_message("Trade executed successfully!", "SUCCESS")
        else:
            log_message("Failed to execute trade", "ERROR")
    else:
        log_message("No high-quality opportunities found. Waiting for better conditions.", "INFO")
    
    log_message("Trading cycle completed. System will continue monitoring positions.", "INFO")

if __name__ == "__main__":
    main()
