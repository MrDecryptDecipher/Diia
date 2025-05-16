#!/usr/bin/env python3
"""
Generate comprehensive quantum computing components visualization for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle, Ellipse
import networkx as nx
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

def generate_quantum_components_visualization():
    """Generate comprehensive quantum computing components visualization"""
    print("Generating quantum computing components visualization...")
    
    # Define quantum components with detailed attributes
    quantum_components = {
        "Quantum Predictor": {
            "color": OMNI_COLORS['purple'],
            "primary_function": "Price Movement Forecasting",
            "quantum_principles": ["Superposition", "Quantum Interference", "Amplitude Estimation"],
            "key_algorithms": ["Quantum Fourier Transform", "Quantum Phase Estimation", "Quantum Neural Networks"],
            "mathematical_foundation": "Represents market states as quantum states in Hilbert space with complex probability amplitudes",
            "inputs": ["Historical price data", "Technical indicators", "Market sentiment", "Order flow"],
            "outputs": ["Probabilistic price forecasts", "Quantum state representations", "Confidence scores"],
            "interactions": ["Entry/Exit Logic", "Memory Node", "Hyperdimensional Computing"],
            "advantages": ["Multiple scenario modeling", "Uncertainty quantification", "Non-linear pattern detection"],
            "implementation": "Quantum circuit emulation with specialized tensor operations"
        },
        "Quantum Entanglement Analyzer": {
            "color": OMNI_COLORS['light_purple'],
            "primary_function": "Asset Correlation Analysis",
            "quantum_principles": ["Quantum Entanglement", "Bell States", "Quantum Correlation"],
            "key_algorithms": ["Quantum Correlation Estimation", "Entanglement Entropy Calculation", "Quantum Mutual Information"],
            "mathematical_foundation": "Models correlations between assets as entangled quantum states with non-local properties",
            "inputs": ["Multi-asset price data", "Trading volume", "Market events", "Liquidity flows"],
            "outputs": ["Correlation matrices", "Entanglement maps", "Regime change alerts"],
            "interactions": ["Risk Manager", "Macro Sentinel", "Portfolio Optimizer"],
            "advantages": ["Detection of hidden correlations", "Early identification of market regime shifts", "Non-linear dependency modeling"],
            "implementation": "Density matrix calculations with quantum information metrics"
        },
        "Hyperdimensional Computing Engine": {
            "color": OMNI_COLORS['dark_purple'],
            "primary_function": "High-Dimensional Pattern Recognition",
            "quantum_principles": ["High-Dimensional Spaces", "Holographic Representation", "Distributed Computing"],
            "key_algorithms": ["Vector Symbolic Architecture", "Sparse Distributed Memory", "Holographic Reduced Representations"],
            "mathematical_foundation": "Encodes market patterns in 10,000+ dimensional vectors with binding and bundling operations",
            "inputs": ["Market patterns", "Trading signals", "Historical scenarios", "Agent outputs"],
            "outputs": ["Pattern similarity scores", "Associative memory retrievals", "Compositional representations"],
            "interactions": ["Memory Node", "Pattern Recognizer", "Quantum Predictor"],
            "advantages": ["Robust to noise", "Efficient similarity search", "Compositional reasoning"],
            "implementation": "High-dimensional vector operations with specialized hardware acceleration"
        },
        "Spectral Tree Engine": {
            "color": OMNI_COLORS['gold'],
            "primary_function": "Multi-path Scenario Simulation",
            "quantum_principles": ["Quantum Branching", "Path Integrals", "Quantum Random Walks"],
            "key_algorithms": ["Quantum Decision Trees", "Spectral Decomposition", "Path Integral Monte Carlo"],
            "mathematical_foundation": "Simulates price evolution as quantum branching processes with spectral decomposition",
            "inputs": ["Current market state", "Volatility surface", "Event probabilities", "Technical levels"],
            "outputs": ["Branching scenario trees", "Path probabilities", "Critical decision points"],
            "interactions": ["Ghost Trader", "Zero-Loss Enforcer", "Entry/Exit Logic"],
            "advantages": ["Comprehensive scenario coverage", "Identification of critical price levels", "Efficient pruning of unlikely paths"],
            "implementation": "Recursive tree construction with spectral filtering and quantum-inspired branching"
        },
        "Quantum Entropy Analyzer": {
            "color": OMNI_COLORS['teal'],
            "primary_function": "Market Uncertainty Quantification",
            "quantum_principles": ["Quantum Entropy", "Von Neumann Entropy", "Quantum Information Theory"],
            "key_algorithms": ["Entropy Estimation", "Information Gain Calculation", "Quantum Relative Entropy"],
            "mathematical_foundation": "Quantifies market uncertainty using quantum entropy measures on price distribution",
            "inputs": ["Price distributions", "Volatility metrics", "Order book depth", "Market microstructure"],
            "outputs": ["Uncertainty metrics", "Information content measures", "Entropy gradients"],
            "interactions": ["Risk Manager", "Position Sizing", "Macro Sentinel"],
            "advantages": ["Precise uncertainty quantification", "Detection of information flow", "Early volatility regime identification"],
            "implementation": "Density matrix entropy calculations with information theoretic measures"
        },
        "Quantum Coherence Detector": {
            "color": OMNI_COLORS['light_blue'],
            "primary_function": "Market Stability Assessment",
            "quantum_principles": ["Quantum Coherence", "Decoherence", "Quantum Discord"],
            "key_algorithms": ["Coherence Time Estimation", "Quantum Discord Calculation", "Fidelity Measures"],
            "mathematical_foundation": "Measures market stability through quantum coherence metrics on price evolution",
            "inputs": ["Price stability metrics", "Market noise", "Trading activity", "Liquidity changes"],
            "outputs": ["Coherence scores", "Stability assessments", "Decoherence alerts"],
            "interactions": ["Pattern Recognizer", "Risk Manager", "Entry/Exit Logic"],
            "advantages": ["Identification of stable market regimes", "Noise filtering", "Detection of market phase transitions"],
            "implementation": "Quantum state fidelity calculations with coherence metrics"
        }
    }
    
    # Create figure with multiple subplots
    fig = plt.figure(figsize=(20, 24), dpi=300)
    fig.patch.set_facecolor('#f8f8ff')
    
    # Create grid for subplots
    gs = gridspec.GridSpec(4, 2, height_ratios=[1, 1, 1, 1])
    
    # Add title
    fig.suptitle('OMNI-ALPHA VΩ∞∞ Quantum Computing Components', 
                fontsize=24, fontweight='bold', color=OMNI_COLORS['dark_purple'],
                y=0.98)
    
    # Add subtitle
    plt.figtext(0.5, 0.96, 'Comprehensive Analysis of Quantum-Inspired Algorithms and Their Integration',
               ha='center', fontsize=16, color=OMNI_COLORS['gray'])
    
    # Generate quantum network overview
    ax_overview = fig.add_subplot(gs[0, :])
    generate_quantum_network_overview(ax_overview, quantum_components)
    
    # Generate detailed quantum component visualizations
    row, col = 1, 0
    for comp_name, comp_data in list(quantum_components.items())[:6]:  # Limit to 6 components for space
        ax = fig.add_subplot(gs[row, col])
        generate_quantum_component_detail(ax, comp_name, comp_data)
        
        # Update row and column
        col += 1
        if col > 1:
            col = 0
            row += 1
    
    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    
    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'quantum_components_detailed.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Quantum components visualization saved to {output_path}")
    return output_path

def generate_quantum_network_overview(ax, quantum_components):
    """Generate an overview of the quantum component network"""
    # Set title
    ax.set_title('Quantum Component Integration Model', fontsize=18, color=OMNI_COLORS['dark_purple'])
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Add nodes
    for comp_name, comp_data in quantum_components.items():
        G.add_node(comp_name, color=comp_data['color'])
    
    # Add central OMNI Core node
    G.add_node("OMNI Core", color=OMNI_COLORS['dark_blue'])
    
    # Add edges from OMNI Core to all quantum components
    for comp_name in quantum_components:
        G.add_edge("OMNI Core", comp_name, color=OMNI_COLORS['dark_blue'], alpha=0.7)
    
    # Add edges based on interactions
    for comp_name, comp_data in quantum_components.items():
        for interaction in comp_data['interactions']:
            if interaction in quantum_components:
                G.add_edge(comp_name, interaction, color=comp_data['color'], alpha=0.7)
    
    # Create layout
    pos = nx.spring_layout(G, k=0.3, iterations=50, seed=42)
    
    # Ensure OMNI Core is in the center
    pos["OMNI Core"] = np.array([0.5, 0.5])
    
    # Draw nodes
    # First draw OMNI Core
    nx.draw_networkx_nodes(G, pos, 
                          nodelist=["OMNI Core"],
                          node_color=OMNI_COLORS['dark_blue'],
                          node_size=2000,
                          alpha=0.8,
                          edgecolors='white',
                          linewidths=2)
    
    # Then draw quantum components
    for comp_name, comp_data in quantum_components.items():
        nx.draw_networkx_nodes(G, pos, 
                              nodelist=[comp_name],
                              node_color=comp_data['color'],
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
    legend_elements = [plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=OMNI_COLORS['dark_blue'],
                                 markersize=10, label="OMNI Core")]
    
    for comp_name, comp_data in quantum_components.items():
        legend_elements.append(plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=comp_data['color'],
                                        markersize=10, label=comp_name))
    
    ax.legend(handles=legend_elements, loc='upper center', 
             bbox_to_anchor=(0.5, -0.05), ncol=3, fontsize=12)
    
    # Remove axis
    ax.axis('off')
    
    # Add annotation
    ax.text(0.5, 0.05, 'Directed edges represent primary information flows between components', 
           transform=ax.transAxes, ha='center', fontsize=12, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_quantum_component_detail(ax, comp_name, comp_data):
    """Generate detailed visualization for a specific quantum component"""
    # Set title with component name
    ax.set_title(comp_name, fontsize=16, color=comp_data['color'])
    
    # Turn off axis
    ax.axis('off')
    
    # Create background rectangle
    background = plt.Rectangle((0.05, 0.05), 0.9, 0.9, 
                              facecolor=comp_data['color'], alpha=0.1,
                              transform=ax.transAxes, zorder=0,
                              edgecolor=comp_data['color'], linewidth=2,
                              linestyle='-', joinstyle='round')
    ax.add_patch(background)
    
    # Add quantum icon
    icon = plt.Circle((0.15, 0.85), 0.08, 
                     facecolor=comp_data['color'], alpha=0.8,
                     transform=ax.transAxes, zorder=1,
                     edgecolor='white', linewidth=2)
    ax.add_patch(icon)
    
    # Add electron-like orbits around the icon
    for i in range(3):
        angle = i * np.pi/3
        orbit = Ellipse((0.15, 0.85), 0.12 + i*0.03, 0.06 + i*0.02, 
                       angle=angle*180/np.pi,
                       facecolor='none', edgecolor=comp_data['color'], alpha=0.6,
                       transform=ax.transAxes, zorder=0, linewidth=1)
        ax.add_patch(orbit)
        
        # Add electron on orbit
        electron_x = 0.15 + (0.06 + i*0.015) * np.cos(angle + i*np.pi/4)
        electron_y = 0.85 + (0.03 + i*0.01) * np.sin(angle + i*np.pi/4)
        electron = plt.Circle((electron_x, electron_y), 0.01, 
                             facecolor='white', edgecolor=comp_data['color'],
                             transform=ax.transAxes, zorder=2)
        ax.add_patch(electron)
    
    # Add primary function
    ax.text(0.5, 0.85, f"Function: {comp_data['primary_function']}", 
           transform=ax.transAxes, ha='center', fontsize=12, fontweight='bold',
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))
    
    # Add quantum principles
    principles_text = "Quantum Principles: " + ", ".join(comp_data['quantum_principles'])
    ax.text(0.5, 0.75, principles_text, 
           transform=ax.transAxes, ha='center', fontsize=10,
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.2'))
    
    # Add mathematical foundation
    ax.text(0.1, 0.65, "Mathematical Foundation:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    ax.text(0.1, 0.6, comp_data['mathematical_foundation'], transform=ax.transAxes, ha='left', fontsize=9, 
           bbox=dict(facecolor='white', alpha=0.6, boxstyle='round,pad=0.2'))
    
    # Add key algorithms
    ax.text(0.1, 0.5, "Key Algorithms:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, algorithm in enumerate(comp_data['key_algorithms'][:3]):  # Limit to 3 for space
        ax.text(0.15, 0.45 - i*0.05, f"• {algorithm}", transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add advantages
    ax.text(0.1, 0.3, "Advantages:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, advantage in enumerate(comp_data['advantages'][:3]):  # Limit to 3 for space
        ax.text(0.15, 0.25 - i*0.05, f"• {advantage}", transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add interactions
    ax.text(0.6, 0.5, "Interactions:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    for i, interaction in enumerate(comp_data['interactions'][:3]):  # Limit to 3 for space
        ax.text(0.65, 0.45 - i*0.05, f"• {interaction}", transform=ax.transAxes, ha='left', fontsize=9)
    
    # Add implementation
    ax.text(0.6, 0.3, "Implementation:", transform=ax.transAxes, ha='left', fontsize=10, fontweight='bold')
    ax.text(0.6, 0.25, comp_data['implementation'], transform=ax.transAxes, ha='left', fontsize=9,
           bbox=dict(facecolor='white', alpha=0.6, boxstyle='round,pad=0.2'))

if __name__ == "__main__":
    generate_quantum_components_visualization()
