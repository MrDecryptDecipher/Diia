#!/usr/bin/env python3
"""
Generate detailed agent personality visualizations for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle
import networkx as nx
from PIL import Image as PILImage
from io import BytesIO

# Directory for storing generated images
IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
os.makedirs(IMAGE_DIR, exist_ok=True)

# Custom colors
OMNI_COLORS = {
    'dark_blue': '#003366',
    'light_blue': '#3399ff',
    'purple': '#6600cc',
    'gold': '#cc9900',
    'green': '#009933',
    'red': '#cc0000',
    'teal': '#009999',
    'dark_purple': '#330066',
    'light_purple': '#9966ff',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#666666',
    'light_gray': '#cccccc'
}

def create_custom_colormap(name, colors):
    """Create a custom colormap from a list of colors"""
    return LinearSegmentedColormap.from_list(name, colors)

def generate_agent_personality_visualization():
    """Generate detailed agent personality visualization"""
    print("Generating agent personality visualization...")
    
    # Define agent personalities with detailed attributes
    agents = {
        "Ghost Trader": {
            "color": OMNI_COLORS['light_blue'],
            "primary_function": "Trade Simulation",
            "personality_traits": ["Analytical", "Cautious", "Detail-oriented"],
            "decision_making": "Probabilistic simulation with multiple scenarios",
            "learning_style": "Reinforcement learning from simulated outcomes",
            "risk_profile": "Conservative with high accuracy requirements",
            "communication_style": "Data-driven reports with confidence scores",
            "strengths": ["Pattern recognition", "Risk assessment", "Scenario planning"],
            "weaknesses": ["Computational intensity", "Sensitivity to input quality"],
            "key_algorithms": ["Monte Carlo simulation", "Bayesian inference", "Decision trees"],
            "inputs": ["Market data", "Technical indicators", "Historical patterns"],
            "outputs": ["Trade simulations", "Confidence scores", "Risk assessments"],
            "interactions": ["Risk Manager", "Memory Node", "Entry/Exit Logic"]
        },
        "Memory Node": {
            "color": OMNI_COLORS['dark_blue'],
            "primary_function": "Experience Storage and Retrieval",
            "personality_traits": ["Reflective", "Associative", "Pattern-seeking"],
            "decision_making": "Similarity-based retrieval with context awareness",
            "learning_style": "Episodic and semantic memory formation with decay",
            "risk_profile": "Balanced with emphasis on pattern reliability",
            "communication_style": "Contextual insights with historical references",
            "strengths": ["Long-term pattern recognition", "Contextual awareness", "Associative recall"],
            "weaknesses": ["Potential for overfitting to past patterns", "Memory decay"],
            "key_algorithms": ["Vector symbolic architecture", "Sparse distributed memory", "Temporal difference learning"],
            "inputs": ["Trade outcomes", "Market conditions", "Agent interactions"],
            "outputs": ["Similar historical scenarios", "Pattern predictions", "Learning signals"],
            "interactions": ["Ghost Trader", "Quantum Predictor", "Hyperdimensional Computing"]
        },
        "Macro Sentinel": {
            "color": OMNI_COLORS['gold'],
            "primary_function": "Global Economic Monitoring",
            "personality_traits": ["Vigilant", "Broad-minded", "Forward-looking"],
            "decision_making": "Multi-factor analysis with scenario planning",
            "learning_style": "Causal inference from economic relationships",
            "risk_profile": "Cautious with emphasis on systemic risks",
            "communication_style": "Alert-based with severity classifications",
            "strengths": ["Global perspective", "Early warning detection", "Correlation analysis"],
            "weaknesses": ["Signal-to-noise ratio in news", "Lag in economic data"],
            "key_algorithms": ["Natural language processing", "Sentiment analysis", "Causal inference"],
            "inputs": ["Economic news", "Central bank announcements", "Geopolitical events"],
            "outputs": ["Risk alerts", "Market regime shifts", "Correlation changes"],
            "interactions": ["Risk Manager", "Quantum Entanglement", "Position Sizing"]
        },
        "Micro Analyzer": {
            "color": OMNI_COLORS['teal'],
            "primary_function": "Short-term Market Microstructure Analysis",
            "personality_traits": ["Detail-focused", "Reactive", "Precise"],
            "decision_making": "Real-time statistical analysis with anomaly detection",
            "learning_style": "Rapid adaptation to changing market conditions",
            "risk_profile": "Opportunistic with quick risk assessment",
            "communication_style": "High-frequency signals with confidence metrics",
            "strengths": ["Order flow analysis", "Liquidity assessment", "Short-term prediction"],
            "weaknesses": ["Noise sensitivity", "Limited historical context"],
            "key_algorithms": ["Time series analysis", "Market microstructure models", "Statistical arbitrage"],
            "inputs": ["Order book data", "Trade tape", "Short-term price action"],
            "outputs": ["Short-term predictions", "Liquidity signals", "Market inefficiencies"],
            "interactions": ["Technical Indicators", "Entry/Exit Logic", "Pattern Recognizer"]
        },
        "Risk Manager": {
            "color": OMNI_COLORS['red'],
            "primary_function": "Risk Assessment and Mitigation",
            "personality_traits": ["Conservative", "Systematic", "Protective"],
            "decision_making": "Risk-reward optimization with constraint satisfaction",
            "learning_style": "Bayesian updating of risk models",
            "risk_profile": "Highly risk-averse with capital preservation focus",
            "communication_style": "Clear risk metrics with actionable thresholds",
            "strengths": ["Comprehensive risk assessment", "Portfolio-level analysis", "Drawdown prevention"],
            "weaknesses": ["Potential over-conservatism", "Model risk"],
            "key_algorithms": ["Value at Risk", "Expected shortfall", "Kelly criterion"],
            "inputs": ["Position data", "Market volatility", "Correlation matrices"],
            "outputs": ["Position size recommendations", "Stop-loss levels", "Risk exposure metrics"],
            "interactions": ["Zero-Loss Enforcer", "Position Sizing", "Macro Sentinel"]
        },
        "Quantum Predictor": {
            "color": OMNI_COLORS['purple'],
            "primary_function": "Price Movement Forecasting",
            "personality_traits": ["Probabilistic", "Non-deterministic", "Exploratory"],
            "decision_making": "Quantum-inspired probability amplitude calculation",
            "learning_style": "Quantum annealing of prediction parameters",
            "risk_profile": "Balanced with explicit uncertainty quantification",
            "communication_style": "Probability distributions with quantum states",
            "strengths": ["Multiple scenario modeling", "Uncertainty quantification", "Non-linear pattern detection"],
            "weaknesses": ["Computational complexity", "Parameter sensitivity"],
            "key_algorithms": ["Quantum amplitude estimation", "Quantum Fourier transform", "Quantum neural networks"],
            "inputs": ["Price history", "Technical indicators", "Market sentiment"],
            "outputs": ["Price predictions", "Probability distributions", "Quantum states"],
            "interactions": ["Entry/Exit Logic", "Memory Node", "Hyperdimensional Computing"]
        },
        "Zero-Loss Enforcer": {
            "color": OMNI_COLORS['green'],
            "primary_function": "Capital Preservation",
            "personality_traits": ["Disciplined", "Unyielding", "Protective"],
            "decision_making": "Rule-based with dynamic parameter adjustment",
            "learning_style": "Parameter optimization through outcome analysis",
            "risk_profile": "Extremely risk-averse with zero-loss mandate",
            "communication_style": "Direct commands with non-negotiable thresholds",
            "strengths": ["Strict discipline enforcement", "Dynamic risk adaptation", "Capital preservation"],
            "weaknesses": ["Potential opportunity cost", "Parameter optimization challenges"],
            "key_algorithms": ["Dynamic stop-loss", "Trailing stop optimization", "Partial profit taking"],
            "inputs": ["Position data", "Price action", "Volatility metrics"],
            "outputs": ["Stop-loss levels", "Profit-taking signals", "Position closure commands"],
            "interactions": ["Risk Manager", "Position Sizing", "Entry/Exit Logic"]
        }
    }
    
    # Create figure with multiple subplots
    fig = plt.figure(figsize=(20, 24), dpi=300)
    fig.patch.set_facecolor('#f8f8ff')
    
    # Create grid for subplots
    gs = gridspec.GridSpec(4, 2, height_ratios=[1, 1, 1, 1])
    
    # Add title
    fig.suptitle('OMNI-ALPHA VΩ∞∞ Agent Personalities', 
                fontsize=24, fontweight='bold', color=OMNI_COLORS['dark_purple'],
                y=0.98)
    
    # Add subtitle
    plt.figtext(0.5, 0.96, 'Detailed Analysis of Specialized AI Agents and Their Cognitive Architectures',
               ha='center', fontsize=16, color=OMNI_COLORS['gray'])
    
    # Generate agent network overview
    ax_overview = fig.add_subplot(gs[0, :])
    generate_agent_network_overview(ax_overview, agents)
    
    # Generate detailed agent visualizations
    row, col = 1, 0
    for agent_name, agent_data in list(agents.items())[:6]:  # Limit to 6 agents for space
        ax = fig.add_subplot(gs[row, col])
        generate_agent_detail(ax, agent_name, agent_data)
        
        # Update row and column
        col += 1
        if col > 1:
            col = 0
            row += 1
    
    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    
    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'agent_personalities_detailed.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Agent personality visualization saved to {output_path}")
    return output_path

def generate_agent_network_overview(ax, agents):
    """Generate an overview of the agent network"""
    # Set title
    ax.set_title('Agent Network Interaction Model', fontsize=18, color=OMNI_COLORS['dark_purple'])
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Add nodes
    for agent_name, agent_data in agents.items():
        G.add_node(agent_name, color=agent_data['color'])
    
    # Add edges based on interactions
    for agent_name, agent_data in agents.items():
        for interaction in agent_data['interactions']:
            if interaction in agents:
                G.add_edge(agent_name, interaction, color=agent_data['color'], alpha=0.7)
    
    # Create layout
    pos = nx.spring_layout(G, k=0.3, iterations=50, seed=42)
    
    # Draw nodes
    for agent_name, agent_data in agents.items():
        nx.draw_networkx_nodes(G, pos, 
                              nodelist=[agent_name],
                              node_color=agent_data['color'],
                              node_size=1500,
                              alpha=0.8,
                              edgecolors='white',
                              linewidths=2)
    
    # Draw edges
    for u, v, d in G.edges(data=True):
        ax.annotate("",
                   xy=pos[v], xycoords='data',
                   xytext=pos[u], textcoords='data',
                   arrowprops=dict(arrowstyle="->", color=d['color'],
                                  connectionstyle="arc3,rad=0.2",
                                  alpha=d['alpha'], linewidth=2))
    
    # Draw labels
    nx.draw_networkx_labels(G, pos, font_size=12, font_color='white', font_weight='bold')
    
    # Add legend
    legend_elements = []
    for agent_name, agent_data in agents.items():
        legend_elements.append(plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=agent_data['color'],
                                        markersize=10, label=agent_name))
    
    ax.legend(handles=legend_elements, loc='upper center', 
             bbox_to_anchor=(0.5, -0.05), ncol=3, fontsize=12)
    
    # Remove axis
    ax.axis('off')
    
    # Add annotation
    ax.text(0.5, 0.05, 'Directed edges represent primary information flows between agents', 
           transform=ax.transAxes, ha='center', fontsize=12, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_agent_detail(ax, agent_name, agent_data):
    """Generate detailed visualization for a specific agent"""
    # Set title with agent name
    ax.set_title(agent_name, fontsize=16, color=agent_data['color'])
    
    # Turn off axis
    ax.axis('off')
    
    # Create background rectangle
    background = plt.Rectangle((0.05, 0.05), 0.9, 0.9, 
                              facecolor=agent_data['color'], alpha=0.1,
                              transform=ax.transAxes, zorder=0,
                              edgecolor=agent_data['color'], linewidth=2,
                              linestyle='-', joinstyle='round')
    ax.add_patch(background)
    
    # Add agent icon
    icon = plt.Circle((0.15, 0.85), 0.08, 
                     facecolor=agent_data['color'], alpha=0.8,
                     transform=ax.transAxes, zorder=1,
                     edgecolor='white', linewidth=2)
    ax.add_patch(icon)
    
    # Add primary function
    ax.text(0.5, 0.85, f"Function: {agent_data['primary_function']}", 
           transform=ax.transAxes, ha='center', fontsize=12, fontweight='bold',
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))
    
    # Add personality traits
    traits_text = "Traits: " + ", ".join(agent_data['personality_traits'])
    ax.text(0.5, 0.75, traits_text, 
           transform=ax.transAxes, ha='center', fontsize=10,
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.2'))
    
    # Add decision making and learning style
    ax.text(0.1, 0.65, "Decision Making:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    ax.text(0.1, 0.6, agent_data['decision_making'], transform=ax.transAxes, ha='left', fontsize=9)
    
    ax.text(0.1, 0.55, "Learning Style:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    ax.text(0.1, 0.5, agent_data['learning_style'], transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add strengths and weaknesses
    ax.text(0.1, 0.45, "Strengths:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, strength in enumerate(agent_data['strengths'][:3]):  # Limit to 3 for space
        ax.text(0.15, 0.4 - i*0.05, f"• {strength}", transform=ax.transAxes, ha='left', fontsize=9)
    
    ax.text(0.6, 0.45, "Weaknesses:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, weakness in enumerate(agent_data['weaknesses'][:2]):  # Limit to 2 for space
        ax.text(0.65, 0.4 - i*0.05, f"• {weakness}", transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add key algorithms
    ax.text(0.1, 0.25, "Key Algorithms:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, algorithm in enumerate(agent_data['key_algorithms'][:3]):  # Limit to 3 for space
        ax.text(0.15, 0.2 - i*0.05, f"• {algorithm}", transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add interactions
    ax.text(0.6, 0.25, "Interactions:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, interaction in enumerate(agent_data['interactions'][:3]):  # Limit to 3 for space
        ax.text(0.65, 0.2 - i*0.05, f"• {interaction}", transform=ax.transAxes, ha='left', fontsize=9)

if __name__ == "__main__":
    generate_agent_personality_visualization()
