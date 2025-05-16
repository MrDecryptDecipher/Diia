use clap::{Parser, Subcommand};
use colored::*;
use regex::Regex;
use rustyline::error::ReadlineError;
use rustyline::Editor;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// OMNI-ALPHA VΩ∞∞ Neural Shell - Natural language command interface
#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    /// Config file path
    #[clap(short, long, value_parser)]
    config: Option<PathBuf>,

    /// Command to run
    #[clap(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the interactive neural shell
    Shell {
        /// History file path
        #[clap(short, long, value_parser)]
        history: Option<PathBuf>,
    },
    
    /// Execute a single natural language command
    Exec {
        /// Command to execute
        #[clap(value_parser)]
        command: String,
    },
}

/// Shell state
struct ShellState {
    /// Whether the system is running
    running: bool,
    /// Current mode (live, backtest, simulation)
    mode: String,
    /// Current capital
    capital: f64,
    /// Active trades
    active_trades: HashMap<String, Trade>,
    /// Agent states
    agent_states: HashMap<String, AgentState>,
    /// Command patterns
    command_patterns: HashMap<String, CommandPattern>,
    /// Command history
    command_history: Vec<String>,
}

/// Trade information
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Trade {
    /// Trade ID
    id: String,
    /// Asset being traded
    asset: String,
    /// Entry price
    entry_price: f64,
    /// Current price
    current_price: f64,
    /// Stop loss price
    stop_loss: f64,
    /// Take profit price
    take_profit: f64,
    /// Position size in USDT
    position_size: f64,
    /// Leverage used
    leverage: f64,
    /// Direction of the trade
    direction: String,
    /// When the trade was entered
    entry_time: chrono::DateTime<chrono::Utc>,
    /// Current P&L
    current_pnl: f64,
    /// Current ROI percentage
    current_roi: f64,
}

/// Agent state
#[derive(Debug, Clone, Serialize, Deserialize)]
struct AgentState {
    /// Agent name
    name: String,
    /// Whether the agent is active
    active: bool,
    /// Agent health (0-100)
    health: u8,
    /// Last processing time in ms
    last_processing_time_ms: u64,
    /// Error count
    error_count: u64,
    /// Last error message
    last_error: Option<String>,
}

/// Command pattern
#[derive(Debug, Clone)]
struct CommandPattern {
    /// Pattern regex
    pattern: Regex,
    /// Command to execute
    command: String,
    /// Parameter names
    params: Vec<String>,
}

/// Main function
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Parse command line arguments
    let cli = Cli::parse();
    
    // Create shell state
    let state = Arc::new(Mutex::new(ShellState {
        running: false,
        mode: "simulation".to_string(),
        capital: 12.0,
        active_trades: HashMap::new(),
        agent_states: HashMap::new(),
        command_patterns: load_command_patterns(),
        command_history: Vec::new(),
    }));
    
    // Handle commands
    match &cli.command {
        Some(Commands::Shell { history }) => {
            run_interactive_shell(state, history.clone()).await?;
        },
        Some(Commands::Exec { command }) => {
            let mut state = state.lock().await;
            process_natural_language(&mut state, command).await?;
        },
        None => {
            // Default to interactive shell if no command specified
            run_interactive_shell(state, None).await?;
        },
    }
    
    Ok(())
}

/// Load command patterns
fn load_command_patterns() -> HashMap<String, CommandPattern> {
    let mut patterns = HashMap::new();
    
    // Trade control patterns
    patterns.insert("set_tp".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)set take profit to (\d+\.?\d*)%").unwrap(),
        command: "config take_profit_percentage {0}".to_string(),
        params: vec!["percentage".to_string()],
    });
    
    patterns.insert("set_sl".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)set stop loss to (\d+\.?\d*)%").unwrap(),
        command: "config stop_loss_percentage {0}".to_string(),
        params: vec!["percentage".to_string()],
    });
    
    patterns.insert("pause_trading".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)pause (all )?trading").unwrap(),
        command: "stop".to_string(),
        params: vec![],
    });
    
    patterns.insert("resume_trading".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)resume trading").unwrap(),
        command: "start".to_string(),
        params: vec![],
    });
    
    patterns.insert("set_leverage".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)(set|increase|decrease) leverage to (\d+\.?\d*)x").unwrap(),
        command: "config max_leverage {1}".to_string(),
        params: vec!["action".to_string(), "leverage".to_string()],
    });
    
    // Agent control patterns
    patterns.insert("disable_agent".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)disable (\w+)").unwrap(),
        command: "disable {0}".to_string(),
        params: vec!["agent_name".to_string()],
    });
    
    patterns.insert("enable_agent".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)enable (\w+)").unwrap(),
        command: "enable {0}".to_string(),
        params: vec!["agent_name".to_string()],
    });
    
    patterns.insert("kill_agent".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)kill (\w+) if (.+)").unwrap(),
        command: "disable {0}".to_string(),
        params: vec!["agent_name".to_string(), "condition".to_string()],
    });
    
    // Market filter patterns
    patterns.insert("trade_only".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)only trade ([\w,\s]+)").unwrap(),
        command: "config allowed_assets {0}".to_string(),
        params: vec!["coin_list".to_string()],
    });
    
    patterns.insert("exclude_trading".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)exclude ([\w,\s]+)").unwrap(),
        command: "config excluded_assets {0}".to_string(),
        params: vec!["coin_list".to_string()],
    });
    
    // System control patterns
    patterns.insert("pause_until".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)pause until (.+) ends").unwrap(),
        command: "stop".to_string(),
        params: vec!["event".to_string()],
    });
    
    patterns.insert("emergency_shutdown".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)emergency shutdown").unwrap(),
        command: "stop".to_string(),
        params: vec![],
    });
    
    // Meme patterns
    patterns.insert("to_the_moon".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)to the moon").unwrap(),
        command: "config max_leverage 5".to_string(),
        params: vec![],
    });
    
    patterns.insert("diamond_hands".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)diamond hands").unwrap(),
        command: "config hold_time_minutes 120".to_string(),
        params: vec![],
    });
    
    patterns.insert("paper_hands".to_string(), CommandPattern {
        pattern: Regex::new(r"(?i)paper hands").unwrap(),
        command: "config take_profit_percentage 1.0".to_string(),
        params: vec![],
    });
    
    patterns
}

/// Run the interactive neural shell
async fn run_interactive_shell(state: Arc<Mutex<ShellState>>, history_path: Option<PathBuf>) -> anyhow::Result<()> {
    // Create readline editor
    let mut rl = Editor::<()>::new()?;
    
    // Load history if path provided
    if let Some(history_path) = history_path {
        if history_path.exists() {
            rl.load_history(&history_path)?;
        }
    }
    
    // Print welcome message
    println!("{}", "OMNI-ALPHA VΩ∞∞ Neural Shell".bright_green().bold());
    println!("{}", "Speak to me in natural language...".bright_blue());
    println!("{}", "Type 'help' for examples of what you can say".bright_blue());
    
    // Main loop
    loop {
        // Get prompt based on state
        let prompt = {
            let state = state.lock().await;
            if state.running {
                format!("{}(${:.2}) 🧠 ", state.mode.bright_green(), state.capital)
            } else {
                "omni-alpha 🧠 ".to_string()
            }
        };
        
        // Read line
        match rl.readline(&prompt) {
            Ok(line) => {
                let line = line.trim();
                if !line.is_empty() {
                    // Add to history
                    rl.add_history_entry(line)?;
                    
                    // Execute command
                    let mut state = state.lock().await;
                    state.command_history.push(line.to_string());
                    
                    if line.to_lowercase() == "exit" || line.to_lowercase() == "quit" {
                        println!("Exiting OMNI-ALPHA Neural Shell");
                        break;
                    }
                    
                    if line.to_lowercase() == "help" {
                        print_help();
                    } else {
                        if let Err(e) = process_natural_language(&mut state, line).await {
                            println!("{}: {}", "Error".bright_red(), e);
                        }
                    }
                }
            },
            Err(ReadlineError::Interrupted) => {
                println!("Ctrl-C");
                break;
            },
            Err(ReadlineError::Eof) => {
                println!("Ctrl-D");
                break;
            },
            Err(err) => {
                println!("Error: {}", err);
                break;
            }
        }
    }
    
    // Save history if path provided
    if let Some(history_path) = history_path {
        rl.save_history(&history_path)?;
    }
    
    Ok(())
}

/// Process natural language command
async fn process_natural_language(state: &mut ShellState, input: &str) -> anyhow::Result<()> {
    // Check for direct commands first
    if input.starts_with("/") {
        let cmd = &input[1..];
        return execute_command(state, cmd).await;
    }
    
    // Try to match against patterns
    for (name, pattern) in &state.command_patterns {
        if let Some(captures) = pattern.pattern.captures(input) {
            println!("{}: Recognized command pattern: {}", "Info".bright_blue(), name);
            
            // Extract parameters
            let mut params = Vec::new();
            for i in 1..captures.len() {
                params.push(captures.get(i).map_or("", |m| m.as_str()));
            }
            
            // Format command
            let mut cmd = pattern.command.clone();
            for (i, param) in params.iter().enumerate() {
                cmd = cmd.replace(&format!("{{{}}}", i), param);
            }
            
            println!("{}: Executing: {}", "Info".bright_blue(), cmd);
            return execute_command(state, &cmd).await;
        }
    }
    
    // If no pattern matched, try some fallbacks
    if input.to_lowercase().contains("status") || input.to_lowercase().contains("how are you") {
        return execute_command(state, "status").await;
    } else if input.to_lowercase().contains("trades") || input.to_lowercase().contains("positions") {
        return execute_command(state, "trades").await;
    } else if input.to_lowercase().contains("agents") || input.to_lowercase().contains("bots") {
        return execute_command(state, "agents").await;
    } else if input.to_lowercase().contains("start") || input.to_lowercase().contains("begin") {
        return execute_command(state, "start").await;
    } else if input.to_lowercase().contains("stop") || input.to_lowercase().contains("halt") {
        return execute_command(state, "stop").await;
    }
    
    println!("{}: I don't understand that command. Type 'help' for examples.", "Sorry".bright_yellow());
    Ok(())
}

/// Execute a shell command
async fn execute_command(state: &mut ShellState, command: &str) -> anyhow::Result<()> {
    // Split command and arguments
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Ok(());
    }
    
    let cmd = parts[0];
    let args = &parts[1..];
    
    match cmd {
        "help" => {
            print_help();
        },
        "start" => {
            let mode = if args.is_empty() { "simulation" } else { args[0] };
            start_system(state, mode).await?;
        },
        "stop" => {
            stop_system(state).await?;
        },
        "status" => {
            print_status(state).await?;
        },
        "trades" => {
            list_trades(state).await?;
        },
        "agents" => {
            list_agents(state).await?;
        },
        "enable" => {
            if args.is_empty() {
                println!("{}: Agent name required", "Error".bright_red());
            } else {
                enable_agent(state, args[0]).await?;
            }
        },
        "disable" => {
            if args.is_empty() {
                println!("{}: Agent name required", "Error".bright_red());
            } else {
                disable_agent(state, args[0]).await?;
            }
        },
        "config" => {
            if args.len() < 1 {
                show_config(state).await?;
            } else if args.len() < 2 {
                show_config_section(state, args[0]).await?;
            } else {
                set_config(state, args[0], args[1]).await?;
            }
        },
        "clear" => {
            // Clear screen
            print!("\x1B[2J\x1B[1;1H");
        },
        _ => {
            println!("{}: Unknown command '{}'", "Error".bright_red(), cmd);
            println!("Type 'help' for available commands");
        }
    }
    
    Ok(())
}

/// Print help information
fn print_help() {
    println!("{}", "Examples of what you can say:".bright_yellow().bold());
    println!("  {}", "set take profit to 2.5%");
    println!("  {}", "set stop loss to 1.0%");
    println!("  {}", "pause all trading");
    println!("  {}", "resume trading");
    println!("  {}", "increase leverage to 5x");
    println!("  {}", "disable ghost_trader");
    println!("  {}", "enable macro_sentinel");
    println!("  {}", "kill whale_pulse if spoofing misfires again");
    println!("  {}", "only trade BTC, ETH");
    println!("  {}", "exclude SOL, DOGE");
    println!("  {}", "pause until CPI print ends");
    println!("  {}", "emergency shutdown");
    println!("");
    println!("{}", "Meme commands:".bright_yellow().bold());
    println!("  {}", "to the moon");
    println!("  {}", "diamond hands");
    println!("  {}", "paper hands");
    println!("");
    println!("{}", "Direct commands (start with /):".bright_yellow().bold());
    println!("  {}", "/status - Show system status");
    println!("  {}", "/trades - List active trades");
    println!("  {}", "/agents - List all agents");
    println!("  {}", "/start - Start the system");
    println!("  {}", "/stop - Stop the system");
    println!("  {}", "/clear - Clear the screen");
    println!("  {}", "/exit or /quit - Exit the shell");
}

/// Start the system
async fn start_system(state: &mut ShellState, mode: &str) -> anyhow::Result<()> {
    if state.running {
        println!("{}: System is already running in {} mode", "Warning".bright_yellow(), state.mode);
        return Ok(());
    }
    
    // Validate mode
    let valid_modes = ["live", "backtest", "simulation"];
    if !valid_modes.contains(&mode) {
        return Err(anyhow::anyhow!("Invalid mode: {}. Valid modes are: {}", mode, valid_modes.join(", ")));
    }
    
    // In a real implementation, this would start the actual system
    // For now, we'll just update the state
    state.running = true;
    state.mode = mode.to_string();
    
    // Initialize some dummy agents
    state.agent_states.insert("macro_sentinel".to_string(), AgentState {
        name: "macro_sentinel".to_string(),
        active: true,
        health: 100,
        last_processing_time_ms: 50,
        error_count: 0,
        last_error: None,
    });
    
    state.agent_states.insert("ghost_trader".to_string(), AgentState {
        name: "ghost_trader".to_string(),
        active: true,
        health: 100,
        last_processing_time_ms: 120,
        error_count: 0,
        last_error: None,
    });
    
    state.agent_states.insert("whale_pulse".to_string(), AgentState {
        name: "whale_pulse".to_string(),
        active: true,
        health: 100,
        last_processing_time_ms: 85,
        error_count: 0,
        last_error: None,
    });
    
    println!("{}: System started in {} mode", "Success".bright_green(), mode);
    
    Ok(())
}

/// Stop the system
async fn stop_system(state: &mut ShellState) -> anyhow::Result<()> {
    if !state.running {
        println!("{}: System is not running", "Warning".bright_yellow());
        return Ok(());
    }
    
    // In a real implementation, this would stop the actual system
    // For now, we'll just update the state
    state.running = false;
    state.active_trades.clear();
    state.agent_states.clear();
    
    println!("{}: System stopped", "Success".bright_green());
    
    Ok(())
}

/// Print system status
async fn print_status(state: &ShellState) -> anyhow::Result<()> {
    println!("{}", "System Status:".bright_yellow().bold());
    println!("  {:<15}: {}", "Running", if state.running { "Yes".bright_green() } else { "No".bright_red() });
    println!("  {:<15}: {}", "Mode", state.mode);
    println!("  {:<15}: ${:.2}", "Capital", state.capital);
    println!("  {:<15}: {}", "Active Trades", state.active_trades.len());
    println!("  {:<15}: {}", "Active Agents", state.agent_states.values().filter(|a| a.active).count());
    println!("  {:<15}: {}", "Total Agents", state.agent_states.len());
    
    Ok(())
}

/// List active trades
async fn list_trades(state: &ShellState) -> anyhow::Result<()> {
    if state.active_trades.is_empty() {
        println!("No active trades");
        return Ok(());
    }
    
    println!("{}", "Active Trades:".bright_yellow().bold());
    println!("{:<10} {:<8} {:<10} {:<10} {:<10} {:<10}", "ID", "Asset", "Direction", "Entry", "Current", "ROI");
    
    for trade in state.active_trades.values() {
        let roi_color = if trade.current_roi >= 0.0 { "green" } else { "red" };
        println!("{:<10} {:<8} {:<10} {:<10.2} {:<10.2} {}", 
                 trade.id, 
                 trade.asset, 
                 trade.direction, 
                 trade.entry_price, 
                 trade.current_price, 
                 format!("{:.2}%", trade.current_roi).color(roi_color));
    }
    
    Ok(())
}

/// List all agents and their status
async fn list_agents(state: &ShellState) -> anyhow::Result<()> {
    if state.agent_states.is_empty() {
        println!("No agents available");
        return Ok(());
    }
    
    println!("{}", "Agents:".bright_yellow().bold());
    println!("{:<20} {:<10} {:<10} {:<15} {:<10}", "Name", "Status", "Health", "Process Time", "Errors");
    
    for agent in state.agent_states.values() {
        println!("{:<20} {:<10} {:<10} {:<15} {:<10}", 
                 agent.name, 
                 if agent.active { "Active".bright_green() } else { "Inactive".bright_red() }, 
                 format!("{}%", agent.health).color(if agent.health >= 80 { "green" } else if agent.health >= 50 { "yellow" } else { "red" }),
                 format!("{}ms", agent.last_processing_time_ms),
                 agent.error_count);
    }
    
    Ok(())
}

/// Enable an agent
async fn enable_agent(state: &mut ShellState, agent_name: &str) -> anyhow::Result<()> {
    if !state.running {
        println!("{}: System is not running", "Error".bright_red());
        return Ok(());
    }
    
    if let Some(agent) = state.agent_states.get_mut(agent_name) {
        // In a real implementation, this would enable the actual agent
        // For now, we'll just update the state
        agent.active = true;
        
        println!("{}: Enabled agent {}", "Success".bright_green(), agent_name);
    } else {
        println!("{}: Agent not found: {}", "Error".bright_red(), agent_name);
    }
    
    Ok(())
}

/// Disable an agent
async fn disable_agent(state: &mut ShellState, agent_name: &str) -> anyhow::Result<()> {
    if !state.running {
        println!("{}: System is not running", "Error".bright_red());
        return Ok(());
    }
    
    if let Some(agent) = state.agent_states.get_mut(agent_name) {
        // In a real implementation, this would disable the actual agent
        // For now, we'll just update the state
        agent.active = false;
        
        println!("{}: Disabled agent {}", "Success".bright_green(), agent_name);
    } else {
        println!("{}: Agent not found: {}", "Error".bright_red(), agent_name);
    }
    
    Ok(())
}

/// Show configuration
async fn show_config(state: &ShellState) -> anyhow::Result<()> {
    // In a real implementation, this would show actual configuration
    // For now, we'll just show a placeholder
    println!("{}", "Configuration:".bright_yellow().bold());
    println!("  {:<20}: {}", "initial_capital", "12.0");
    println!("  {:<20}: {}", "max_risk_per_trade", "1.5");
    println!("  {:<20}: {}", "min_confidence", "96.95");
    println!("  {:<20}: {}", "max_leverage", "3.0");
    println!("  {:<20}: {}", "simulation_mode", state.mode);
    
    Ok(())
}

/// Show a specific configuration section
async fn show_config_section(state: &ShellState, section: &str) -> anyhow::Result<()> {
    // In a real implementation, this would show an actual configuration section
    // For now, we'll just show a placeholder
    println!("{}", format!("Configuration Section '{}':", section).bright_yellow().bold());
    println!("Configuration section details not available in this demo");
    
    Ok(())
}

/// Set a configuration value
async fn set_config(state: &mut ShellState, key: &str, value: &str) -> anyhow::Result<()> {
    // In a real implementation, this would set an actual configuration value
    // For now, we'll just show a placeholder
    println!("{}: Set configuration {} = {}", "Success".bright_green(), key, value);
    
    Ok(())
}
