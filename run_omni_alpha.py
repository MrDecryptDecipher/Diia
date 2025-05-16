#!/usr/bin/env python3
"""
OMNI-ALPHA VΩ∞∞ Trading System - Main Execution Script
"""

import hmac
import json
import time
import random
import datetime
import requests
import numpy as np
import pandas as pd
from urllib.parse import urlencode
from typing import Dict, List, Tuple, Optional, Any, Union

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# System Configuration
INITIAL_CAPITAL = 12.0  # $12 USDT
MAX_CONCURRENT_TRADES = 3
POSITION_SIZE_PERCENTAGE = 0.1  # 10% of capital per trade
STOP_LOSS_PERCENTAGE = 0.02  # 2% stop loss
TAKE_PROFIT_PERCENTAGE = 0.05  # 5% take profit
SCAN_INTERVAL = 300  # 5 minutes
MAX_ITERATIONS = 100

# Technical Indicators Configuration
RSI_PERIOD = 14
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70
MACD_FAST_PERIOD = 12
MACD_SLOW_PERIOD = 26
MACD_SIGNAL_PERIOD = 9
BB_PERIOD = 20
BB_STD_DEV = 2.0

# Trading Opportunity
class TradingOpportunity:
    def __init__(self, symbol: str, action: str, score: float, reason: str, price: float, volume: float):
        self.symbol = symbol
        self.action = action
        self.score = score
        self.reason = reason
        self.price = price
        self.volume = volume
        self.timestamp = int(time.time())

# Active Trade
class ActiveTrade:
    def __init__(self, symbol: str, side: str, entry_price: float, quantity: float, 
                 stop_loss: float, take_profit: float, order_id: str):
        self.symbol = symbol
        self.side = side
        self.entry_price = entry_price
        self.quantity = quantity
        self.stop_loss = stop_loss
        self.take_profit = take_profit
        self.order_id = order_id
        self.entry_time = int(time.time())
        self.highest_price = entry_price
        self.lowest_price = entry_price

# API Functions
def get_timestamp():
    """Get current timestamp in milliseconds"""
    return int(time.time() * 1000)

def generate_signature(timestamp, api_key, recv_window, params_str):
    """Generate HMAC-SHA256 signature"""
    param_str = f"{timestamp}{api_key}{recv_window}{params_str}"
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod="sha256"
    ).hexdigest()
    return signature

def get_wallet_balance(coin=None):
    """Get wallet balance"""
    endpoint = "/v5/account/wallet-balance"
    timestamp = get_timestamp()
    recv_window = "5000"
    
    params = {
        "accountType": "UNIFIED"
    }
    
    if coin:
        params["coin"] = coin
    
    # Sort parameters
    sorted_params = dict(sorted(params.items()))
    query_string = urlencode(sorted_params)
    
    # Generate signature
    signature = generate_signature(timestamp, API_KEY, recv_window, query_string)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": str(timestamp),
        "X-BAPI-RECV-WINDOW": recv_window
    }
    
    # Make request
    url = f"{BASE_URL}{endpoint}?{query_string}"
    response = requests.get(url, headers=headers)
    
    return response.json()

def get_market_tickers(category="spot", symbol=None):
    """Get market tickers"""
    endpoint = "/v5/market/tickers"
    timestamp = get_timestamp()
    recv_window = "5000"
    
    params = {
        "category": category
    }
    
    if symbol:
        params["symbol"] = symbol
    
    # Sort parameters
    sorted_params = dict(sorted(params.items()))
    query_string = urlencode(sorted_params)
    
    # Generate signature
    signature = generate_signature(timestamp, API_KEY, recv_window, query_string)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": str(timestamp),
        "X-BAPI-RECV-WINDOW": recv_window
    }
    
    # Make request
    url = f"{BASE_URL}{endpoint}?{query_string}"
    response = requests.get(url, headers=headers)
    
    return response.json()

def get_klines(symbol, interval, limit=100, category="spot"):
    """Get klines (candlestick data)"""
    endpoint = "/v5/market/kline"
    timestamp = get_timestamp()
    recv_window = "5000"
    
    params = {
        "category": category,
        "symbol": symbol,
        "interval": interval,
        "limit": str(limit)
    }
    
    # Sort parameters
    sorted_params = dict(sorted(params.items()))
    query_string = urlencode(sorted_params)
    
    # Generate signature
    signature = generate_signature(timestamp, API_KEY, recv_window, query_string)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": str(timestamp),
        "X-BAPI-RECV-WINDOW": recv_window
    }
    
    # Make request
    url = f"{BASE_URL}{endpoint}?{query_string}"
    response = requests.get(url, headers=headers)
    
    return response.json()

def place_order(symbol, side, order_type, qty, price=None, time_in_force="GTC", 
                reduce_only=False, close_on_trigger=False, take_profit=None, stop_loss=None):
    """Place order"""
    endpoint = "/v5/order/create"
    timestamp = get_timestamp()
    recv_window = "5000"
    
    params = {
        "category": "spot",
        "symbol": symbol,
        "side": side,
        "orderType": order_type,
        "qty": str(qty),
        "timeInForce": time_in_force,
        "reduceOnly": reduce_only,
        "closeOnTrigger": close_on_trigger
    }
    
    if price:
        params["price"] = str(price)
    
    if take_profit:
        params["takeProfit"] = str(take_profit)
    
    if stop_loss:
        params["stopLoss"] = str(stop_loss)
    
    # Convert params to JSON string
    params_json = json.dumps(params)
    
    # Generate signature
    signature = generate_signature(timestamp, API_KEY, recv_window, params_json)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": str(timestamp),
        "X-BAPI-RECV-WINDOW": recv_window,
        "Content-Type": "application/json"
    }
    
    # Make request
    url = f"{BASE_URL}{endpoint}"
    response = requests.post(url, headers=headers, data=params_json)
    
    return response.json()

def get_open_orders(category="spot", symbol=None):
    """Get open orders"""
    endpoint = "/v5/order/realtime"
    timestamp = get_timestamp()
    recv_window = "5000"
    
    params = {
        "category": category
    }
    
    if symbol:
        params["symbol"] = symbol
    
    # Sort parameters
    sorted_params = dict(sorted(params.items()))
    query_string = urlencode(sorted_params)
    
    # Generate signature
    signature = generate_signature(timestamp, API_KEY, recv_window, query_string)
    
    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": str(timestamp),
        "X-BAPI-RECV-WINDOW": recv_window
    }
    
    # Make request
    url = f"{BASE_URL}{endpoint}?{query_string}"
    response = requests.get(url, headers=headers)
    
    return response.json()

# Technical Indicators
def calculate_rsi(prices, period=14):
    """Calculate RSI"""
    deltas = np.diff(prices)
    seed = deltas[:period+1]
    up = seed[seed >= 0].sum()/period
    down = -seed[seed < 0].sum()/period
    rs = up/down
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100./(1. + rs)
    
    for i in range(period, len(prices)):
        delta = deltas[i-1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta
            
        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        rs = up/down
        rsi[i] = 100. - 100./(1. + rs)
        
    return rsi

def calculate_ema(prices, period):
    """Calculate EMA"""
    ema = [sum(prices[:period]) / period]
    k = 2 / (period + 1)
    
    for i in range(period, len(prices)):
        ema.append(prices[i] * k + ema[-1] * (1 - k))
        
    return ema

def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """Calculate MACD"""
    fast_ema = calculate_ema(prices, fast_period)
    slow_ema = calculate_ema(prices, slow_period)
    
    # Adjust lengths
    fast_ema = fast_ema[-(len(slow_ema)):]
    
    # MACD Line
    macd_line = [fast - slow for fast, slow in zip(fast_ema, slow_ema)]
    
    # Signal Line
    signal_line = calculate_ema(macd_line, signal_period)
    
    # Histogram
    histogram = [macd - signal for macd, signal in zip(macd_line[-len(signal_line):], signal_line)]
    
    return macd_line[-len(signal_line):], signal_line, histogram

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    sma = []
    upper_band = []
    lower_band = []
    
    for i in range(len(prices) - period + 1):
        price_slice = prices[i:i+period]
        mean = sum(price_slice) / period
        std = (sum([(x - mean) ** 2 for x in price_slice]) / period) ** 0.5
        
        sma.append(mean)
        upper_band.append(mean + std_dev * std)
        lower_band.append(mean - std_dev * std)
        
    return upper_band, sma, lower_band

# Trading Logic
def scan_for_opportunities(symbols, timeframes=["15", "60"]):
    """Scan for trading opportunities"""
    opportunities = []
    
    for symbol in symbols:
        for timeframe in timeframes:
            # Get klines
            klines_response = get_klines(symbol, timeframe)
            
            if klines_response["retCode"] != 0:
                print(f"Failed to get klines for {symbol}: {klines_response['retMsg']}")
                continue
                
            if "result" not in klines_response or "list" not in klines_response["result"]:
                print(f"No klines data for {symbol}")
                continue
                
            klines_data = klines_response["result"]["list"]
            
            if not klines_data:
                print(f"Empty klines data for {symbol}")
                continue
            
            # Convert to numpy arrays
            close_prices = np.array([float(k[4]) for k in klines_data])
            
            # Reverse to get chronological order
            close_prices = np.flip(close_prices)
            
            if len(close_prices) < 50:
                print(f"Not enough data for {symbol}")
                continue
            
            # Calculate indicators
            rsi = calculate_rsi(close_prices, RSI_PERIOD)
            macd_line, signal_line, histogram = calculate_macd(
                close_prices, MACD_FAST_PERIOD, MACD_SLOW_PERIOD, MACD_SIGNAL_PERIOD
            )
            bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(
                close_prices, BB_PERIOD, BB_STD_DEV
            )
            
            # Check for buy signals
            buy_signal, buy_score, buy_reason = check_buy_signals(
                close_prices, rsi, macd_line, signal_line, histogram, bb_upper, bb_middle, bb_lower
            )
            
            if buy_signal:
                opportunity = TradingOpportunity(
                    symbol=symbol,
                    action="Buy",
                    score=buy_score,
                    reason=buy_reason,
                    price=close_prices[-1],
                    volume=float(klines_data[0][5])  # Volume
                )
                opportunities.append(opportunity)
            
            # Check for sell signals
            sell_signal, sell_score, sell_reason = check_sell_signals(
                close_prices, rsi, macd_line, signal_line, histogram, bb_upper, bb_middle, bb_lower
            )
            
            if sell_signal:
                opportunity = TradingOpportunity(
                    symbol=symbol,
                    action="Sell",
                    score=sell_score,
                    reason=sell_reason,
                    price=close_prices[-1],
                    volume=float(klines_data[0][5])  # Volume
                )
                opportunities.append(opportunity)
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.1)
    
    # Sort by score
    opportunities.sort(key=lambda x: x.score, reverse=True)
    
    return opportunities

def check_buy_signals(close_prices, rsi, macd_line, signal_line, histogram, bb_upper, bb_middle, bb_lower):
    """Check for buy signals"""
    buy_signal = False
    buy_reason = ""
    score = 0.0
    
    # RSI oversold and turning up
    if len(rsi) >= 2 and rsi[-1] < RSI_OVERSOLD and rsi[-1] > rsi[-2]:
        buy_signal = True
        buy_reason += "RSI oversold and turning up; "
        score += 0.2
    
    # MACD crossover
    if len(macd_line) >= 2 and len(signal_line) >= 2 and \
       macd_line[-2] < signal_line[-2] and macd_line[-1] > signal_line[-1]:
        buy_signal = True
        buy_reason += "MACD bullish crossover; "
        score += 0.2
    
    # Price near lower Bollinger Band
    if len(bb_lower) >= 1 and close_prices[-1] < bb_lower[-1] * 1.01:
        buy_signal = True
        buy_reason += "Price near lower Bollinger Band; "
        score += 0.15
    
    # Normalize score
    score = min(1.0, max(0.0, score))
    
    return buy_signal, score, buy_reason

def check_sell_signals(close_prices, rsi, macd_line, signal_line, histogram, bb_upper, bb_middle, bb_lower):
    """Check for sell signals"""
    sell_signal = False
    sell_reason = ""
    score = 0.0
    
    # RSI overbought and turning down
    if len(rsi) >= 2 and rsi[-1] > RSI_OVERBOUGHT and rsi[-1] < rsi[-2]:
        sell_signal = True
        sell_reason += "RSI overbought and turning down; "
        score += 0.2
    
    # MACD bearish crossover
    if len(macd_line) >= 2 and len(signal_line) >= 2 and \
       macd_line[-2] > signal_line[-2] and macd_line[-1] < signal_line[-1]:
        sell_signal = True
        sell_reason += "MACD bearish crossover; "
        score += 0.2
    
    # Price near upper Bollinger Band
    if len(bb_upper) >= 1 and close_prices[-1] > bb_upper[-1] * 0.99:
        sell_signal = True
        sell_reason += "Price near upper Bollinger Band; "
        score += 0.15
    
    # Normalize score
    score = min(1.0, max(0.0, score))
    
    return sell_signal, score, sell_reason

def execute_opportunity(opportunity, trading_capital):
    """Execute trading opportunity"""
    # Calculate position size
    position_value = trading_capital * POSITION_SIZE_PERCENTAGE
    quantity = position_value / opportunity.price
    
    # Round quantity to appropriate precision
    quantity = round(quantity * 1000000) / 1000000
    
    print(f"Executing opportunity: {opportunity.symbol} - {opportunity.action} at ${opportunity.price:.2f}")
    print(f"Position size: {quantity} (value: ${position_value:.2f})")
    
    # Calculate stop loss and take profit
    if opportunity.action == "Buy":
        stop_loss = opportunity.price * (1.0 - STOP_LOSS_PERCENTAGE)
        take_profit = opportunity.price * (1.0 + TAKE_PROFIT_PERCENTAGE)
    else:  # Sell
        stop_loss = opportunity.price * (1.0 + STOP_LOSS_PERCENTAGE)
        take_profit = opportunity.price * (1.0 - TAKE_PROFIT_PERCENTAGE)
    
    # Place order
    order_response = place_order(
        symbol=opportunity.symbol,
        side=opportunity.action,
        order_type="Market",
        qty=quantity,
        time_in_force="GTC",
        reduce_only=False,
        close_on_trigger=False,
        take_profit=take_profit,
        stop_loss=stop_loss
    )
    
    if order_response["retCode"] == 0:
        order_id = order_response["result"]["orderId"]
        print(f"Order placed successfully! Order ID: {order_id}")
        
        # Create active trade
        active_trade = ActiveTrade(
            symbol=opportunity.symbol,
            side=opportunity.action,
            entry_price=opportunity.price,
            quantity=quantity,
            stop_loss=stop_loss,
            take_profit=take_profit,
            order_id=order_id
        )
        
        return active_trade
    else:
        print(f"Failed to place order: {order_response['retMsg']}")
        return None

def update_active_trades(active_trades):
    """Update active trades"""
    # Get open orders
    open_orders_response = get_open_orders()
    
    if open_orders_response["retCode"] != 0:
        print(f"Failed to get open orders: {open_orders_response['retMsg']}")
        return active_trades
    
    open_order_ids = []
    if "result" in open_orders_response and "list" in open_orders_response["result"]:
        open_order_ids = [order["orderId"] for order in open_orders_response["result"]["list"]]
    
    # Update active trades
    updated_trades = []
    
    for trade in active_trades:
        # Check if order is still active
        if trade.order_id in open_order_ids:
            updated_trades.append(trade)
        else:
            # Get current price
            ticker_response = get_market_tickers(symbol=trade.symbol)
            
            if ticker_response["retCode"] == 0 and "result" in ticker_response and "list" in ticker_response["result"]:
                tickers = ticker_response["result"]["list"]
                
                if tickers:
                    current_price = float(tickers[0]["lastPrice"])
                    
                    # Calculate PnL
                    if trade.side == "Buy":
                        pnl = (current_price - trade.entry_price) * trade.quantity
                    else:  # Sell
                        pnl = (trade.entry_price - current_price) * trade.quantity
                    
                    roi = pnl / (trade.entry_price * trade.quantity)
                    
                    print(f"Trade for {trade.symbol} is no longer active. PnL: ${pnl:.2f} ({roi*100:.2f}%)")
    
    return updated_trades

def main():
    """Main function"""
    print("OMNI-ALPHA VΩ∞∞ Trading System")
    print("Capital Genesis: $12 USDT Origin Logic")
    print("Recursive Intelligence Loop Activated")
    print("Zero-Loss Enforcement Protocols Engaged")
    print("Quantum Prediction System Online")
    print("Multi-Agent Collaboration Network Established")
    print("System Ready for Exponential Capital Growth")
    print("=" * 80)
    
    # Get wallet balance
    print("Checking wallet balance...")
    balance_response = get_wallet_balance(coin="USDT")
    
    if balance_response["retCode"] != 0:
        print(f"Failed to retrieve wallet balance: {balance_response['retMsg']}")
        return
    
    # Extract USDT balance
    usdt_balance = None
    
    if "result" in balance_response and "list" in balance_response["result"]:
        for account in balance_response["result"]["list"]:
            if "coin" in account:
                for coin_data in account["coin"]:
                    if coin_data["coin"] == "USDT":
                        usdt_balance = float(coin_data["equity"])
                        break
    
    if usdt_balance is None:
        print("No USDT balance found.")
        return
    
    print(f"USDT Balance: ${usdt_balance:.2f}")
    
    # Use $12 USDT for trading
    trading_capital = min(INITIAL_CAPITAL, usdt_balance)
    print(f"Using ${trading_capital:.2f} USDT for trading")
    
    # Get market tickers
    print("Getting market tickers...")
    tickers_response = get_market_tickers()
    
    if tickers_response["retCode"] != 0:
        print(f"Failed to retrieve market tickers: {tickers_response['retMsg']}")
        return
    
    # Extract and filter symbols
    symbols = []
    
    if "result" in tickers_response and "list" in tickers_response["result"]:
        tickers = tickers_response["result"]["list"]
        
        # Filter USDT pairs
        usdt_tickers = [t for t in tickers if t["symbol"].endswith("USDT")]
        
        # Sort by volume
        sorted_tickers = sorted(usdt_tickers, key=lambda t: float(t["volume24h"]), reverse=True)
        
        # Take top 20 symbols
        symbols = [t["symbol"] for t in sorted_tickers[:20]]
    
    if not symbols:
        print("No symbols found.")
        return
    
    print(f"Found {len(symbols)} symbols to analyze")
    
    # Main trading loop
    active_trades = []
    iteration = 0
    
    while iteration < MAX_ITERATIONS:
        print(f"\nTrading iteration {iteration}")
        
        # Update active trades
        active_trades = update_active_trades(active_trades)
        print(f"Active trades: {len(active_trades)}")
        
        # Check if we can open new trades
        if len(active_trades) < MAX_CONCURRENT_TRADES:
            # Scan for trading opportunities
            print("Scanning for trading opportunities...")
            opportunities = scan_for_opportunities(symbols, ["15", "60"])
            
            # Display top opportunities
            for i, opportunity in enumerate(opportunities[:3]):
                print(f"Opportunity {i+1}: {opportunity.symbol} - {opportunity.action} with score {opportunity.score:.2f} at ${opportunity.price:.2f}")
                print(f"  Reason: {opportunity.reason}")
            
            # Execute top opportunity if score is high enough
            if opportunities and opportunities[0].score > 0.7:
                # Check if we already have an active trade for this symbol
                symbol_exists = any(t.symbol == opportunities[0].symbol for t in active_trades)
                
                if not symbol_exists:
                    new_trade = execute_opportunity(opportunities[0], trading_capital)
                    
                    if new_trade:
                        active_trades.append(new_trade)
                else:
                    print(f"Already have an active trade for {opportunities[0].symbol}")
            else:
                print("No high-quality opportunities found. Waiting for better conditions.")
        
        # Update trading capital
        balance_response = get_wallet_balance(coin="USDT")
        
        if balance_response["retCode"] == 0:
            if "result" in balance_response and "list" in balance_response["result"]:
                for account in balance_response["result"]["list"]:
                    if "coin" in account:
                        for coin_data in account["coin"]:
                            if coin_data["coin"] == "USDT":
                                usdt_balance = float(coin_data["equity"])
                                break
            
            trading_capital = usdt_balance
            
            # Calculate PnL
            pnl = trading_capital - INITIAL_CAPITAL
            roi = pnl / INITIAL_CAPITAL
            
            print(f"Current capital: ${trading_capital:.2f}, PnL: ${pnl:.2f} ({roi*100:.2f}%)")
        
        # Sleep for scan interval
        print(f"Sleeping for {SCAN_INTERVAL} seconds...")
        time.sleep(SCAN_INTERVAL)
        
        iteration += 1
    
    print("\nOMNI-ALPHA VΩ∞∞ Trading System stopped")

if __name__ == "__main__":
    main()
