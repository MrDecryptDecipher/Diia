use std::collections::HashMap;
use std::time::{Duration, Instant};

// We'll use a simple random number generator instead of the rand crate
struct SimpleRng {
    seed: u64,
}

impl SimpleRng {
    fn new() -> Self {
        Self {
            seed: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    fn gen(&mut self) -> f64 {
        self.seed = self.seed.wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        (self.seed >> 11) as f64 / ((1u64 << 53) as f64)
    }

    fn gen_range(&mut self, min: f64, max: f64) -> f64 {
        min + (max - min) * self.gen()
    }
}

// Simple candle structure
#[derive(Clone)]
struct Candle {
    timestamp: u64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: f64,
}

// Trading strategy interface
trait TradingStrategy {
    fn analyze(&self, symbol: &str, candles: &[Candle]) -> Option<TradeSignal>;
}

// Trade signal
enum TradeSignal {
    Buy,
    Sell,
    Hold,
}

// Simple moving average strategy
struct MovingAverageStrategy {
    short_period: usize,
    long_period: usize,
}

impl MovingAverageStrategy {
    fn new(short_period: usize, long_period: usize) -> Self {
        Self {
            short_period,
            long_period,
        }
    }

    fn calculate_sma(&self, prices: &[f64], period: usize) -> Option<f64> {
        if prices.len() < period {
            return None;
        }

        let sum: f64 = prices[prices.len() - period..].iter().sum();
        Some(sum / period as f64)
    }
}

impl TradingStrategy for MovingAverageStrategy {
    fn analyze(&self, _symbol: &str, candles: &[Candle]) -> Option<TradeSignal> {
        if candles.len() < self.long_period {
            return None;
        }

        // Extract close prices
        let closes: Vec<f64> = candles.iter().map(|c| c.close).collect();

        // Calculate moving averages
        let short_ma = self.calculate_sma(&closes, self.short_period)?;
        let long_ma = self.calculate_sma(&closes, self.long_period)?;

        // Generate signal
        if short_ma > long_ma {
            Some(TradeSignal::Buy)
        } else if short_ma < long_ma {
            Some(TradeSignal::Sell)
        } else {
            Some(TradeSignal::Hold)
        }
    }
}

// Market simulator
struct MarketSimulator {
    prices: HashMap<String, f64>,
    candles: HashMap<String, Vec<Candle>>,
    current_time: u64,
    rng: SimpleRng,
}

impl MarketSimulator {
    fn new() -> Self {
        let mut prices = HashMap::new();
        prices.insert("BTCUSDT".to_string(), 50000.0);
        prices.insert("ETHUSDT".to_string(), 3000.0);
        prices.insert("SOLUSDT".to_string(), 100.0);
        prices.insert("BNBUSDT".to_string(), 500.0);
        prices.insert("ADAUSDT".to_string(), 0.5);

        Self {
            prices,
            candles: HashMap::new(),
            current_time: 0,
            rng: SimpleRng::new(),
        }
    }

    fn update(&mut self) {
        self.current_time += 60; // 1 minute

        // Update prices with random movements
        for (symbol, price) in self.prices.iter_mut() {
            // Generate random price movement
            let change_pct = (self.rng.gen() - 0.5) * 0.002; // -0.1% to +0.1%
            let new_price = *price * (1.0 + change_pct);

            // Update price
            *price = new_price;

            // Create candle
            let candle = Candle {
                timestamp: self.current_time,
                open: *price * (1.0 - 0.0005 * self.rng.gen()),
                high: *price * (1.0 + 0.001 * self.rng.gen()),
                low: *price * (1.0 - 0.001 * self.rng.gen()),
                close: new_price,
                volume: new_price * 10.0 * self.rng.gen_range(0.5, 2.0),
            };

            // Add candle to history
            self.candles.entry(symbol.clone())
                .or_insert_with(Vec::new)
                .push(candle);
        }
    }

    fn get_candles(&self, symbol: &str, limit: usize) -> Vec<Candle> {
        if let Some(candles) = self.candles.get(symbol) {
            if candles.len() <= limit {
                candles.clone()
            } else {
                candles[candles.len() - limit..].to_vec()
            }
        } else {
            Vec::new()
        }
    }

    fn get_price(&self, symbol: &str) -> Option<f64> {
        self.prices.get(symbol).copied()
    }
}

// Portfolio
struct Portfolio {
    cash: f64,
    positions: HashMap<String, f64>,
}

impl Portfolio {
    fn new(initial_capital: f64) -> Self {
        Self {
            cash: initial_capital,
            positions: HashMap::new(),
        }
    }

    fn buy(&mut self, symbol: &str, amount: f64, price: f64) -> bool {
        let cost = amount * price;

        if cost > self.cash {
            println!("Insufficient funds to buy {} {}", amount, symbol);
            return false;
        }

        // Update position
        *self.positions.entry(symbol.to_string()).or_insert(0.0) += amount;

        // Update cash
        self.cash -= cost;

        println!("Bought {} {} at ${:.2} for ${:.2}", amount, symbol, price, cost);
        true
    }

    fn sell(&mut self, symbol: &str, amount: f64, price: f64) -> bool {
        // Check if we have the position
        if !self.positions.contains_key(symbol) {
            println!("No position in {}", symbol);
            return false;
        }

        // Check if we have enough
        let current_amount = *self.positions.get(symbol).unwrap();
        if current_amount < amount {
            println!("Insufficient position to sell {} {} (have {})", amount, symbol, current_amount);
            return false;
        }

        // Update position
        let position = self.positions.get_mut(symbol).unwrap();
        *position -= amount;

        // Update cash
        self.cash += amount * price;

        println!("Sold {} {} at ${:.2} for ${:.2}", amount, symbol, price, amount * price);
        true
    }

    fn get_value(&self, prices: &HashMap<String, f64>) -> f64 {
        let mut value = self.cash;

        for (symbol, amount) in &self.positions {
            if let Some(price) = prices.get(symbol) {
                value += amount * price;
            }
        }

        value
    }
}

// Trading system
struct TradingSystem {
    portfolio: Portfolio,
    simulator: MarketSimulator,
    strategies: HashMap<String, Box<dyn TradingStrategy>>,
    assets: Vec<String>,
    initial_capital: f64,
}

impl TradingSystem {
    fn new(initial_capital: f64) -> Self {
        let assets = vec![
            "BTCUSDT".to_string(),
            "ETHUSDT".to_string(),
            "SOLUSDT".to_string(),
            "BNBUSDT".to_string(),
            "ADAUSDT".to_string(),
        ];

        let mut strategies = HashMap::new();
        strategies.insert("MA".to_string(), Box::new(MovingAverageStrategy::new(5, 20)) as Box<dyn TradingStrategy>);

        Self {
            portfolio: Portfolio::new(initial_capital),
            simulator: MarketSimulator::new(),
            strategies,
            assets,
            initial_capital,
        }
    }

    fn update(&mut self) {
        // Update market simulator
        self.simulator.update();

        // Process trading signals
        for symbol in &self.assets {
            // Get candles
            let candles = self.simulator.get_candles(symbol, 30);

            if candles.len() < 20 {
                continue; // Not enough data
            }

            // Get current price
            let price = match self.simulator.get_price(symbol) {
                Some(p) => p,
                None => continue,
            };

            // Get trading signal
            for strategy in self.strategies.values() {
                if let Some(signal) = strategy.analyze(symbol, &candles) {
                    match signal {
                        TradeSignal::Buy => {
                            // Check if we have cash
                            if self.portfolio.cash > price {
                                // Calculate position size (10% of available cash)
                                let amount = self.portfolio.cash * 0.1 / price;
                                self.portfolio.buy(symbol, amount, price);
                            }
                        },
                        TradeSignal::Sell => {
                            // Check if we have a position
                            if let Some(position) = self.portfolio.positions.get(symbol) {
                                if *position > 0.0 {
                                    // Sell entire position
                                    self.portfolio.sell(symbol, *position, price);
                                }
                            }
                        },
                        TradeSignal::Hold => {
                            // Do nothing
                        },
                    }
                }
            }
        }
    }

    fn get_portfolio_value(&self) -> f64 {
        self.portfolio.get_value(&self.simulator.prices)
    }

    fn print_status(&self) {
        let value = self.get_portfolio_value();
        let pnl = value - self.initial_capital;
        let roi = pnl / self.initial_capital * 100.0;

        println!("Portfolio value: ${:.2} (Cash: ${:.2}, Assets: ${:.2})",
            value, self.portfolio.cash, value - self.portfolio.cash);
        println!("P&L: ${:.2} (ROI: {:.2}%)", pnl, roi);

        // Print positions
        if !self.portfolio.positions.is_empty() {
            println!("Positions:");
            for (symbol, amount) in &self.portfolio.positions {
                if *amount > 0.0 {
                    if let Some(price) = self.simulator.prices.get(symbol) {
                        println!("  {}: {} units at ${:.2} = ${:.2}",
                            symbol, amount, price, amount * price);
                    }
                }
            }
        }
    }
}

fn main() {
    // Create trading system
    let initial_capital = 12.0;
    let mut system = TradingSystem::new(initial_capital);

    println!("Starting OMNI-ALPHA VΩ∞∞ in simulation mode");
    println!("Initial capital: ${:.2}", initial_capital);

    // Run simulation for 1 hour (60 minutes)
    let duration_mins = 60;
    println!("Running for {} minutes", duration_mins);

    let start_time = Instant::now();
    let mut last_status_time = Instant::now();

    // Generate initial data
    for _ in 0..30 {
        system.simulator.update();
    }

    // Main simulation loop
    while start_time.elapsed() < Duration::from_secs(duration_mins * 60) {
        // Update system
        system.update();

        // Print status every 10 seconds
        if last_status_time.elapsed() > Duration::from_secs(10) {
            println!("\nStatus update (elapsed: {:?}):", start_time.elapsed());
            system.print_status();
            last_status_time = Instant::now();
        }

        // Sleep to avoid consuming too much CPU
        std::thread::sleep(Duration::from_millis(100));
    }

    // Print final results
    println!("\nSimulation completed");
    println!("Initial capital: ${:.2}", initial_capital);
    println!("Final portfolio value: ${:.2}", system.get_portfolio_value());

    let final_value = system.get_portfolio_value();
    let pnl = final_value - initial_capital;
    let roi = pnl / initial_capital * 100.0;

    println!("P&L: ${:.2} (ROI: {:.2}%)", pnl, roi);
}
