#!/usr/bin/env python3
"""
Generate sophisticated multi-agent network visualization for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import networkx as nx
from matplotlib.colors import LinearSegmentedColormap

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

def generate_agent_network_visualization():
    """Generate sophisticated multi-agent network visualization"""
    print("Generating multi-agent network visualization...")
    
    # Create figure
    fig, ax = plt.subplots(figsize=(15, 12), dpi=300)
    fig.patch.set_facecolor('#f0f0f8')
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Define agent categories
    categories = {
        'core': {'color': OMNI_COLORS['dark_blue'], 'size': 2000},
        'agent': {'color': OMNI_COLORS['light_blue'], 'size': 1500},
        'quantum': {'color': OMNI_COLORS['purple'], 'size': 1500},
        'trading': {'color': OMNI_COLORS['green'], 'size': 1500},
        'interface': {'color': OMNI_COLORS['red'], 'size': 1500},
        'data': {'color': OMNI_COLORS['teal'], 'size': 1500}
    }
    
    # Define nodes
    nodes = {
        # Core
        'OMNI Core': {'category': 'core', 'desc': 'Central coordination system'},
        
        # Agents
        'Ghost Trader': {'category': 'agent', 'desc': 'Simulates trades before execution'},
        'Memory Node': {'category': 'agent', 'desc': 'Stores and learns from trading history'},
        'Macro Sentinel': {'category': 'agent', 'desc': 'Monitors global economic events'},
        'Micro Analyzer': {'category': 'agent', 'desc': 'Analyzes short-term market patterns'},
        'Risk Manager': {'category': 'agent', 'desc': 'Manages risk and exposure'},
        'Pattern Recognizer': {'category': 'agent', 'desc': 'Identifies market patterns'},
        
        # Quantum components
        'Quantum Predictor': {'category': 'quantum', 'desc': 'Forecasts price movements'},
        'Quantum Entanglement': {'category': 'quantum', 'desc': 'Analyzes asset correlations'},
        'Hyperdimensional Computing': {'category': 'quantum', 'desc': 'Processes high-dimensional data'},
        'Spectral Tree Engine': {'category': 'quantum', 'desc': 'Simulates price paths'},
        
        # Trading components
        'Zero-Loss Enforcer': {'category': 'trading', 'desc': 'Prevents capital loss'},
        'Position Sizing': {'category': 'trading', 'desc': 'Determines optimal position size'},
        'Entry/Exit Logic': {'category': 'trading', 'desc': 'Determines when to enter/exit trades'},
        'Technical Indicators': {'category': 'trading', 'desc': 'Calculates technical indicators'},
        
        # Interface components
        'Exchange API': {'category': 'interface', 'desc': 'Connects to cryptocurrency exchanges'},
        'Market Data': {'category': 'interface', 'desc': 'Retrieves market data'},
        'Dashboard': {'category': 'interface', 'desc': 'Visualizes system performance'},
        
        # Data components
        'Trade History': {'category': 'data', 'desc': 'Stores historical trades'},
        'Market Database': {'category': 'data', 'desc': 'Stores market data'},
        'Vector Memory': {'category': 'data', 'desc': 'Stores high-dimensional vectors'}
    }
    
    # Add nodes to graph
    for name, attrs in nodes.items():
        category = attrs['category']
        G.add_node(name, 
                  category=category,
                  color=categories[category]['color'],
                  size=categories[category]['size'],
                  desc=attrs['desc'])
    
    # Define edges with types
    edges = [
        # Core to agents
        ('OMNI Core', 'Ghost Trader', 'command'),
        ('OMNI Core', 'Memory Node', 'command'),
        ('OMNI Core', 'Macro Sentinel', 'command'),
        ('OMNI Core', 'Micro Analyzer', 'command'),
        ('OMNI Core', 'Risk Manager', 'command'),
        ('OMNI Core', 'Pattern Recognizer', 'command'),
        
        # Core to quantum
        ('OMNI Core', 'Quantum Predictor', 'command'),
        ('OMNI Core', 'Quantum Entanglement', 'command'),
        ('OMNI Core', 'Hyperdimensional Computing', 'command'),
        ('OMNI Core', 'Spectral Tree Engine', 'command'),
        
        # Core to trading
        ('OMNI Core', 'Zero-Loss Enforcer', 'command'),
        ('OMNI Core', 'Position Sizing', 'command'),
        ('OMNI Core', 'Entry/Exit Logic', 'command'),
        ('OMNI Core', 'Technical Indicators', 'command'),
        
        # Core to interface
        ('OMNI Core', 'Exchange API', 'command'),
        ('OMNI Core', 'Market Data', 'command'),
        ('OMNI Core', 'Dashboard', 'command'),
        
        # Core to data
        ('OMNI Core', 'Trade History', 'command'),
        ('OMNI Core', 'Market Database', 'command'),
        ('OMNI Core', 'Vector Memory', 'command'),
        
        # Agent interactions
        ('Ghost Trader', 'Zero-Loss Enforcer', 'data'),
        ('Memory Node', 'Quantum Predictor', 'data'),
        ('Macro Sentinel', 'Quantum Entanglement', 'data'),
        ('Micro Analyzer', 'Technical Indicators', 'data'),
        ('Risk Manager', 'Position Sizing', 'data'),
        ('Pattern Recognizer', 'Entry/Exit Logic', 'data'),
        
        # Quantum interactions
        ('Quantum Predictor', 'Entry/Exit Logic', 'data'),
        ('Quantum Entanglement', 'Risk Manager', 'data'),
        ('Hyperdimensional Computing', 'Memory Node', 'data'),
        ('Spectral Tree Engine', 'Ghost Trader', 'data'),
        
        # Interface interactions
        ('Exchange API', 'Market Data', 'data'),
        ('Market Data', 'Technical Indicators', 'data'),
        ('Market Data', 'Market Database', 'data'),
        
        # Data interactions
        ('Trade History', 'Memory Node', 'data'),
        ('Market Database', 'Quantum Predictor', 'data'),
        ('Vector Memory', 'Hyperdimensional Computing', 'data'),
        
        # Feedback loops
        ('Zero-Loss Enforcer', 'Risk Manager', 'feedback'),
        ('Entry/Exit Logic', 'Ghost Trader', 'feedback'),
        ('Technical Indicators', 'Pattern Recognizer', 'feedback'),
        ('Dashboard', 'OMNI Core', 'feedback')
    ]
    
    # Add edges to graph
    for source, target, edge_type in edges:
        G.add_edge(source, target, type=edge_type)
    
    # Create layout
    # Use spring layout with adjusted parameters for better spacing
    pos = nx.spring_layout(G, k=0.3, iterations=50, seed=42)
    
    # Adjust positions to ensure core is in center
    pos['OMNI Core'] = np.array([0.5, 0.5])
    
    # Define edge colors based on type
    edge_colors = {
        'command': OMNI_COLORS['dark_blue'],
        'data': OMNI_COLORS['purple'],
        'feedback': OMNI_COLORS['gold']
    }
    
    # Draw edges with different styles based on type
    for edge_type in ['command', 'data', 'feedback']:
        edge_list = [(u, v) for u, v, d in G.edges(data=True) if d['type'] == edge_type]
        
        # Set edge style based on type
        if edge_type == 'command':
            style = 'solid'
            width = 1.5
            alpha = 0.7
            arrow_size = 15
        elif edge_type == 'data':
            style = 'dashed'
            width = 1.2
            alpha = 0.6
            arrow_size = 12
        else:  # feedback
            style = 'dotted'
            width = 1.0
            alpha = 0.5
            arrow_size = 10
        
        # Draw edges
        nx.draw_networkx_edges(G, pos, edgelist=edge_list, 
                              edge_color=edge_colors[edge_type],
                              style=style, width=width, alpha=alpha,
                              arrowsize=arrow_size, 
                              connectionstyle='arc3,rad=0.1')
    
    # Draw nodes
    for category, attrs in categories.items():
        # Get nodes of this category
        node_list = [node for node, data in G.nodes(data=True) if data['category'] == category]
        
        # Draw nodes
        nx.draw_networkx_nodes(G, pos, nodelist=node_list,
                              node_color=attrs['color'],
                              node_size=attrs['size'],
                              alpha=0.8)
    
    # Draw node labels
    nx.draw_networkx_labels(G, pos, font_size=10, font_color='white', font_weight='bold')
    
    # Add node descriptions as annotations
    for node, (x, y) in pos.items():
        desc = G.nodes[node]['desc']
        category = G.nodes[node]['category']
        color = G.nodes[node]['color']
        
        # Skip core node (description would overlap with other nodes)
        if category == 'core':
            continue
        
        # Calculate position for description
        # Adjust based on node position relative to center
        center_x, center_y = pos['OMNI Core']
        angle = np.arctan2(y - center_y, x - center_x)
        
        # Adjust distance based on node size
        distance = 0.07
        desc_x = x + distance * np.cos(angle)
        desc_y = y + distance * np.sin(angle)
        
        # Add description
        ax.text(desc_x, desc_y, desc, ha='center', va='center',
               fontsize=8, color='black',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))
    
    # Add legend for edge types
    legend_elements = [
        plt.Line2D([0], [0], color=edge_colors['command'], linestyle='solid',
                  lw=2, label='Command Flow'),
        plt.Line2D([0], [0], color=edge_colors['data'], linestyle='dashed',
                  lw=2, label='Data Flow'),
        plt.Line2D([0], [0], color=edge_colors['feedback'], linestyle='dotted',
                  lw=2, label='Feedback Loop')
    ]
    
    # Add legend for node categories
    for category, attrs in categories.items():
        legend_elements.append(
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=attrs['color'],
                      markersize=10, label=f'{category.capitalize()} Component')
        )
    
    # Place legend
    ax.legend(handles=legend_elements, loc='upper center', 
             bbox_to_anchor=(0.5, 0.05), ncol=3, fontsize=10)
    
    # Add title
    plt.title('OMNI-ALPHA VΩ∞∞ Multi-Agent Network Architecture', 
             fontsize=20, fontweight='bold', color=OMNI_COLORS['dark_purple'])
    
    # Add subtitle
    plt.figtext(0.5, 0.94, 'Interconnected Agent Network with Command, Data, and Feedback Flows',
               ha='center', fontsize=14, color=OMNI_COLORS['gray'])
    
    # Remove axis
    plt.axis('off')
    
    # Add system description
    description = """The OMNI-ALPHA VΩ∞∞ system employs a sophisticated multi-agent architecture where specialized components
collaborate to achieve optimal trading performance. The system is orchestrated by the OMNI Core, which coordinates
the activities of agent, quantum, trading, interface, and data components through command, data, and feedback flows."""
    
    plt.figtext(0.5, 0.02, description, ha='center', fontsize=10, color=OMNI_COLORS['dark_purple'],
               bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.5'))
    
    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'agent_network_advanced.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Visualization saved to {output_path}")
    return output_path

if __name__ == "__main__":
    generate_agent_network_visualization()
