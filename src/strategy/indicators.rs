use crate::exchange::types::Candle;

/// Calculate Simple Moving Average (SMA)
pub fn calculate_sma(candles: &[Candle], period: usize) -> f64 {
    if candles.len() < period {
        return 0.0;
    }

    let sum: f64 = candles.iter().rev().take(period).map(|c| c.close).sum();
    sum / period as f64
}

/// Calculate Exponential Moving Average (EMA)
pub fn calculate_ema(candles: &[Candle], period: usize) -> f64 {
    if candles.len() < period {
        return 0.0;
    }

    let mut ema = candles[candles.len() - period].close;
    let multiplier = 2.0 / (period as f64 + 1.0);

    for i in (candles.len() - period + 1)..candles.len() {
        ema = (candles[i].close - ema) * multiplier + ema;
    }

    ema
}

/// Calculate Relative Strength Index (RSI)
pub fn calculate_rsi(candles: &[Candle], period: usize) -> f64 {
    if candles.len() < period + 1 {
        return 50.0; // Default to neutral
    }

    let mut gains = 0.0;
    let mut losses = 0.0;

    // Calculate initial average gain and loss
    for i in candles.len() - period - 1..candles.len() - 1 {
        let change = candles[i + 1].close - candles[i].close;
        if change >= 0.0 {
            gains += change;
        } else {
            losses -= change; // Make losses positive
        }
    }

    let avg_gain = gains / period as f64;
    let avg_loss = losses / period as f64;

    if avg_loss == 0.0 {
        return 100.0; // No losses, RSI is 100
    }

    let rs = avg_gain / avg_loss;
    100.0 - (100.0 / (1.0 + rs))
}

/// Calculate Moving Average Convergence Divergence (MACD)
pub fn calculate_macd(candles: &[Candle]) -> (f64, f64, f64) {
    let fast_period = 12;
    let slow_period = 26;
    let signal_period = 9;

    let fast_ema = calculate_ema(candles, fast_period);
    let slow_ema = calculate_ema(candles, slow_period);

    let macd_line = fast_ema - slow_ema;

    // Calculate signal line (EMA of MACD line)
    // This is a simplified version since we don't have historical MACD values
    let signal_line = macd_line * 0.2 + macd_line * 0.8; // Approximation

    let histogram = macd_line - signal_line;

    (macd_line, signal_line, histogram)
}

/// Calculate Bollinger Bands
pub fn calculate_bollinger_bands(candles: &[Candle], period: usize, std_dev_multiplier: f64) -> (f64, f64, f64) {
    if candles.len() < period {
        return (0.0, 0.0, 0.0);
    }

    let sma = calculate_sma(candles, period);

    // Calculate standard deviation
    let variance: f64 = candles.iter().rev().take(period)
        .map(|c| (c.close - sma).powi(2))
        .sum::<f64>() / period as f64;

    let std_dev = variance.sqrt();

    let upper_band = sma + (std_dev_multiplier * std_dev);
    let lower_band = sma - (std_dev_multiplier * std_dev);

    (upper_band, sma, lower_band)
}

/// Calculate Average True Range (ATR)
pub fn calculate_atr(candles: &[Candle], period: usize) -> f64 {
    if candles.len() < period + 1 {
        return 0.0;
    }

    let mut tr_sum = 0.0;

    for i in candles.len() - period..candles.len() {
        let high = candles[i].high;
        let low = candles[i].low;
        let prev_close = if i > 0 { candles[i-1].close } else { candles[i].open };

        let tr1 = high - low;
        let tr2 = (high - prev_close).abs();
        let tr3 = (low - prev_close).abs();

        let true_range = tr1.max(tr2).max(tr3);
        tr_sum += true_range;
    }

    tr_sum / period as f64
}

/// Calculate Stochastic Oscillator
pub fn calculate_stochastic(candles: &[Candle], k_period: usize, d_period: usize) -> (f64, f64) {
    if candles.len() < k_period {
        return (50.0, 50.0); // Default to neutral
    }

    // Find highest high and lowest low over k_period
    let mut highest_high = f64::MIN;
    let mut lowest_low = f64::MAX;

    for i in candles.len() - k_period..candles.len() {
        highest_high = highest_high.max(candles[i].high);
        lowest_low = lowest_low.min(candles[i].low);
    }

    // Calculate %K
    let current_close = candles.last().unwrap().close;
    let k = if highest_high == lowest_low {
        50.0
    } else {
        100.0 * (current_close - lowest_low) / (highest_high - lowest_low)
    };

    // Calculate %D (simple moving average of %K)
    // This is a simplified version since we don't have historical %K values
    let d = k; // Approximation

    (k, d)
}

/// Detect if price is in an uptrend
pub fn is_uptrend(candles: &[Candle], period: usize) -> bool {
    if candles.len() < period * 2 {
        return false;
    }

    let short_sma = calculate_sma(candles, period);
    let long_sma = calculate_sma(candles, period * 2);

    short_sma > long_sma
}

/// Detect if price is in a downtrend
pub fn is_downtrend(candles: &[Candle], period: usize) -> bool {
    if candles.len() < period * 2 {
        return false;
    }

    let short_sma = calculate_sma(candles, period);
    let long_sma = calculate_sma(candles, period * 2);

    short_sma < long_sma
}

/// Detect if RSI is oversold (below 30)
pub fn is_oversold(candles: &[Candle], period: usize) -> bool {
    calculate_rsi(candles, period) < 30.0
}

/// Detect if RSI is overbought (above 70)
pub fn is_overbought(candles: &[Candle], period: usize) -> bool {
    calculate_rsi(candles, period) > 70.0
}

/// Detect if MACD is crossing above signal line
pub fn is_macd_crossing_up(candles: &[Candle]) -> bool {
    if candles.len() < 30 {
        return false;
    }

    let (macd_now, signal_now, _) = calculate_macd(candles);

    // Create a slice without the last candle to check previous state
    let prev_candles = &candles[0..candles.len()-1];
    let (macd_prev, signal_prev, _) = calculate_macd(prev_candles);

    macd_prev < signal_prev && macd_now > signal_now
}

/// Detect if MACD is crossing below signal line
pub fn is_macd_crossing_down(candles: &[Candle]) -> bool {
    if candles.len() < 30 {
        return false;
    }

    let (macd_now, signal_now, _) = calculate_macd(candles);

    // Create a slice without the last candle to check previous state
    let prev_candles = &candles[0..candles.len()-1];
    let (macd_prev, signal_prev, _) = calculate_macd(prev_candles);

    macd_prev > signal_prev && macd_now < signal_now
}

/// Detect if price is breaking out of Bollinger Bands upper band
pub fn is_breaking_upper_band(candles: &[Candle], period: usize, std_dev: f64) -> bool {
    if candles.len() < period {
        return false;
    }

    let (upper_band, _, _) = calculate_bollinger_bands(candles, period, std_dev);
    let current_close = candles.last().unwrap().close;

    current_close > upper_band
}

/// Detect if price is breaking below Bollinger Bands lower band
pub fn is_breaking_lower_band(candles: &[Candle], period: usize, std_dev: f64) -> bool {
    if candles.len() < period {
        return false;
    }

    let (_, _, lower_band) = calculate_bollinger_bands(candles, period, std_dev);
    let current_close = candles.last().unwrap().close;

    current_close < lower_band
}

/// Calculate optimal position size based on risk percentage and ATR
pub fn calculate_position_size(capital: f64, risk_percentage: f64, current_price: f64, atr: f64, atr_multiplier: f64) -> f64 {
    let risk_amount = capital * risk_percentage;
    let stop_distance = atr * atr_multiplier;

    if stop_distance <= 0.0 {
        return 0.0;
    }

    let position_size = risk_amount / stop_distance;
    let units = position_size / current_price;

    units
}
