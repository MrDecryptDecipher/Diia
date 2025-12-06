<div align="center">

# 🌌 **NIJA DIIA** ⚛️
### *The Event Horizon of Financial Intelligence*

[![OMNI-ALPHA VΩ∞∞](https://img.shields.io/badge/OMNI--ALPHA-VΩ∞∞-7000FF?style=for-the-badge&logo=atom&logoColor=white&labelColor=1a1a1a)](https://github.com/MrDecryptDecipher/Diia)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD700?style=for-the-badge&logo=open-source-initiative&logoColor=black)](https://opensource.org/licenses/MIT)
[![Quantum Core](https://img.shields.io/badge/Quantum_Core-Active-00F0FF?style=for-the-badge&logo=rust&logoColor=white&labelColor=000000)](https://rust-lang.org)
[![Agentic Swarm](https://img.shields.io/badge/Agentic_Swarm-Online-FF0055?style=for-the-badge&logo=openai&logoColor=white&labelColor=2a0a1a)](https://modelcontextprotocol.io)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-Neural-FF9900?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org)

<img src="https://raw.githubusercontent.com/MrDecryptDecipher/Diia/master/ui/dashboard/public/logo192.png" width="220" height="220" alt="Diia Quantum Core" style="filter: drop-shadow(0 0 30px #00F0FF); animation: hover 3s infinite ease-in-out;" />

*Where Artificial General Intelligence meets Quantum Mechanics to create the ultimate financial singularity.*

[<kbd> 🚀 **INITIATE SEQUENCE** </kbd>](http://3.111.22.56:10001) &nbsp; [<kbd> 📖 **THEORY OF EVERYTHING** </kbd>](./docs) &nbsp; [<kbd> 💬 **JOIN THE NEXUS** </kbd>](https://t.me/MrDecryptDecipher)

---
</div>

## 🧬 **THE GENESIS PROTOCOL**

**Nija Diia** is not merely a trading bot; it is a **Super Intelligent Autonomous Financial Organism**. By fusing **Quantum Entanglement Algorithms** with **Agentic Self-Evolution**, Diia transcends traditional market analysis, operating in hyperdimensional data spaces to identify patterns invisible to the linear human mind. 

> *"In the quantum realm of financial markets, probability is not a statistic—it is a landscape. Diia is the cartographer."*

---

## 🏗️ **1. HYPER-STRUCTURED ARCHITECTURE**

The system operates on a decentralized, multi-layered architecture designed for **microsecond latency**.

```mermaid
graph TD
    %% Theme
    %%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true, 'background': '#0d0d0d', 'primaryColor': '#7000ff'}}}%%
    classDef rust fill:#b7410e,stroke:#fff,stroke-width:2px,color:white;
    classDef node fill:#1e4d2b,stroke:#fff,stroke-width:2px,color:white;
    classDef react fill:#003366,stroke:#fff,stroke-width:2px,color:white;
    classDef ext fill:#1a1a1a,stroke:#666,stroke-dasharray: 5 5,color:#ccc;

    subgraph Internet ["🌐 External Reality"]
        Users[("👤 User / Admin")]:::ext
        ByBit[("💹 ByBit Exchange")]:::ext
    end

    subgraph Core ["🧠 The Singularity (PM2 Cluster)"]
        Frontend[("⚛️ React Frontend<br/>Port 10001")]:::react
        API[("🔌 API Gateway<br/>Express + TensorFlow<br/>Port 10002")]:::node
        Socket[("📡 WebSocket Stream<br/>Port 10003")]:::node
        
        subgraph RustEngine ["🦀 Quantum Engine (Rust)"]
            GodKernel["🧠 God Kernel"]:::rust
            Agents["🤖 Agent Swarm"]:::rust
            OrderExec["⚡ Trade Executor"]:::rust
        end
    end

    Users --> Frontend
    Frontend <--> API
    API <==>|gRPC Proto| GodKernel
    Socket <==> |Sub| GodKernel
    GodKernel <--> Agents
    Agents -->|Signal| OrderExec
    OrderExec <-->|API/WS| ByBit
```

### 🛰️ **2. Infrastructure Topology**
Visualizing the physical deployment on AWS Lightsail.

```mermaid
graph LR
    %% Theme
    %%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0099ff', 'clusterBkg': '#111'}}}%%
    
    Client((User Browser)) -->|HTTPS/443| LB[AWS Load Balancer]
    
    subgraph Cloud ["☁️ AWS Lightsail Region"]
        LB --> NGINX[NGINX Reverse Proxy]
        
        subgraph Machine ["🖥️ Ubuntu Instance (3.111.22.56)"]
            NGINX -->|/| React[React Build]
            NGINX -->|/api| Node[Node API]
            NGINX -->|/socket| WS[WebSocket]
            
            Node -.->|IPC| Rust[Rust Binary]
            WS -.->|IPC| Rust
            
            Rust -->|Persistence| Redis[(Redis Cache)]
            Rust -->|Logs| Log[(Log Files)]
        end
    end
```

---

## 🔬 **QUANTUM TECHNICAL DEEP DIVE**

### 🌌 **3. Quantum Entanglement Process**
*Logic from: `src/quantum/quantum_entanglement.rs`*
We calculate **Bell State Pairs** to find assets that move in perfect quantum synchronization.

```mermaid
sequenceDiagram
    %% Theme
    %%{init: {'theme': 'dark', 'themeVariables': { 'darkMode': true}}}%%
    
    participant Market as 💹 Market Data
    participant Matrix as 🧮 Correlation Matrix
    participant Bell as 🔔 Bell State Detector
    participant Strategy as 🧠 Strategy Engine

    Market->>Matrix: Stream Price Data (Asset A, B)
    Matrix->>Matrix: Calc Pearson Coeff (ρ)
    Matrix->>Bell: Send Correlation Pairs
    
    Bell->>Bell: Calc Entanglement Strength (E)
    note right of Bell: E = -log2(1 - |ρ|²)
    
    Bell->>Bell: Check Threshold (> 0.9)
    alt is Entangled
        Bell->>Bell: Calc Phase Difference
        Bell->>Strategy: 🚀 Signal: Bell Pair Found!
    else is Noise
        Bell->>Matrix: Discard
    end
```

### 🧮 **4. Hyperdimensional Computing (HDC) Flow**
*Logic from: `src/quantum/hyperdimensional_computing.rs`*
Projecting scalar market data into 10,000-dimensional vector space for symbolic reasoning.

```mermaid
graph TD
    %% Theme
    %%{init: {'theme': 'forest'}}%%
    
    Input[("📈 Market Scalars<br/>(Price, Vol, RSI)")] --> Encode[("🔣 Encoder")]
    
    subgraph HDC ["Hyperdimensional Space (10k Dims)"]
        Encode -->|Projection Matrix| PVec["Hypervector P"]
        Encode -->|Projection Matrix| VVec["Hypervector V"]
        
        PVec --> Bind{{"⊗ Binding Operation"}}
        VVec --> Bind
        
        Bind --> Bound["Composite Vector<br/>(Price * Volume)"]
        Bound --> Memory[("🧠 Associative Memory<br/>(Vector DB)")]
    end
    
    query[("❓ Current State")] -->|Similarity Check| Memory
    Memory -->|Recall| Prediction[("🔮 Future Pattern")]
```

### 🌊 **5. Spectral Tree Decision Logic**
*Logic from: `src/quantum/spectral_tree_engine.rs`*
Decomposing price action into frequencies to simulate future paths.

```mermaid
graph LR
    %% Theme
    %%{init: {'theme': 'neutral'}}%%
    
    Price[Price History] --> FFT[Fast Fourier Transform]
    
    subgraph FrequencyDomain ["🌊 Spectral Domain"]
        FFT --> F1["Freq 1 (Low)"]
        FFT --> F2["Freq 2 (Mid)"]
        FFT --> F3["Freq 3 (High)"]
    end
    
    F1 --> Recompose[Waveform Reconstruction]
    F2 --> Recompose
    F3 --> Recompose
    
    Recompose --> Fork{Branching}
    Fork --> PathA["Path A (+2%)"]
    Fork --> PathB["Path B (-1%)"]
    Fork --> PathC["Path C (+5%)"]
    
    PathA --> Eval[Confidence Score]
    PathB --> Eval
    PathC --> Eval
    
    Eval --> Best[Selected Trajectory]
```

---

## 🧠 **AGENTIC SWARM INTELLIGENCE**

The **God Kernel** orchestrates **18 specialized agents**.

### 🤖 **6. Agent Consensus & Voting**
How the agents debate and agree on a trade.

```mermaid
graph TD
    %% Theme
    classDef agent fill:#f9f,stroke:#333,stroke-width:2px;
    classDef kernel fill:#000,stroke:#f00,stroke-width:4px,color:#fff;
    classDef decision fill:#0f0,stroke:#333;

    God(("🧠 GOD KERNEL")):::kernel
    
    subgraph Proposers
        Q[Quantum Predictor]:::agent
        S[Sentiment Analyzer]:::agent
        H[Hyperdim Recognizer]:::agent
    end

    Q -->|Bullish 90%| God
    S -->|Bearish 60%| God
    H -->|Neutral| God
    
    subgraph Validators
        R[Risk Manager]:::agent
        Z[Zero Loss Enforcer]:::agent
    end

    R -.->|Veto Power| God
    Z -.->|Simulation Check| God
    
    God --> Weigh{Weighted Voting}
    Weigh -->|Consensus > 85%| Trade(EXECUTE TRADE):::decision
    Weigh -->|Consensus < 85%| Wait(WAIT / HEDGE)
```

---

## ⚡ **EXECUTION & LIFECYCLE**

### 🛡️ **7. Zero Loss Enforcement Cycle**
The critical loop that prevents capital erosion.

```mermaid
stateDiagram-v2
    %% Theme
    %%{init: {'theme': 'dark'}}%%
    
    [*] --> SignalReceived
    
    state "Pre-Trade Simulation" as Sim {
        SignalReceived --> GhostTrade
        GhostTrade --> CheckSpread
        CheckSpread --> CalcSlippage
    }
    
    Sim --> Validation
    
    state Validation {
        [*] --> ProfitProb
        ProfitProb --> CheckDrawdown
    }
    
    Validation --> Execution: Probability > 99%
    Validation --> Discard: Probability < 99%
    
    state Execution {
        SubmitOrder --> MonitorFill
        MonitorFill --> SetHardStop
    }
    
    Execution --> Profit: TP Hit
    Execution --> Breakeven: TSL Hit
```

### 🔁 **8. Feedback & Self-Evolution**
How the system gets smarter over time.

```mermaid
graph TD
    %% Theme
    classDef cycle fill:#ff9900,color:black;
    
    TradeResult[Trade Outcome P&L] --> Feedback[Feedback Loop Agent]
    
    Feedback --> Analyze{Analyze Error}
    
    Analyze -->|Win| Reinforce[Reinforce Weights]:::cycle
    Analyze -->|Loss| Mutate[Mutate Parameters]:::cycle
    
    Reinforce --> Agents
    Mutate --> Agents
    
    Agents --> NextTrade[Next Trade]
```

---

## 🚀 **DEPLOYMENT SEQUENCE**

1.  **Clone**: `git clone https://github.com/MrDecryptDecipher/Diia.git`
2.  **Ignite**: `./start-omni.sh`
3.  **Access**: `http://localhost:10001`

---

## 📚 **ABOUT**

**Sandeep Kumar Sahoo (MrDecryptDecipher)**
*Architect of the Digital Singularity*

His vision is simple: **To create a financial intelligence so advanced it is indistinguishable from magic.**

- **Email**: sandeep.savethem2@gmail.com
- **GitHub**: [@MrDecryptDecipher](https://github.com/MrDecryptDecipher)

---

## 📜 **LICENSE**

**MIT License** © 2025 Nija Diia.
<div align="center">
  <sub>Built with 💜, 🦀 and ⚛️ by Sandeep Kumar Sahoo.</sub>
</div>
