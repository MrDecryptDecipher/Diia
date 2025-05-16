#!/usr/bin/env python3
"""
Generate sophisticated quantum prediction visualization for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
import matplotlib.gridspec as gridspec

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

def generate_quantum_prediction_visualization():
    """Generate sophisticated quantum prediction visualization"""
    print("Generating quantum prediction visualization...")
    
    # Create figure with multiple subplots
    fig = plt.figure(figsize=(15, 12), dpi=300)
    fig.patch.set_facecolor('#f0f0f8')
    
    # Create grid for subplots
    gs = gridspec.GridSpec(3, 3, height_ratios=[1, 1.5, 1])
    
    # 1. Quantum State Representation - Top Left
    ax1 = fig.add_subplot(gs[0, 0])
    generate_quantum_state_representation(ax1)
    
    # 2. Price Prediction with Probability Amplitudes - Top Middle and Right
    ax2 = fig.add_subplot(gs[0, 1:])
    generate_price_prediction(ax2)
    
    # 3. 3D Quantum Landscape - Middle Row
    ax3 = fig.add_subplot(gs[1, :], projection='3d')
    generate_quantum_landscape(ax3)
    
    # 4. Quantum Circuit Diagram - Bottom Left
    ax4 = fig.add_subplot(gs[2, 0])
    generate_quantum_circuit(ax4)
    
    # 5. Entanglement Network - Bottom Middle
    ax5 = fig.add_subplot(gs[2, 1])
    generate_entanglement_network(ax5)
    
    # 6. Quantum Entropy Measurement - Bottom Right
    ax6 = fig.add_subplot(gs[2, 2])
    generate_quantum_entropy(ax6)
    
    # Add title
    fig.suptitle('OMNI-ALPHA VΩ∞∞ Quantum-Inspired Prediction System', 
                fontsize=20, fontweight='bold', color=OMNI_COLORS['dark_purple'],
                y=0.98)
    
    # Add subtitle
    plt.figtext(0.5, 0.94, 'Visualization of Quantum State Representation, Probability Amplitudes, and Entanglement',
               ha='center', fontsize=14, color=OMNI_COLORS['gray'])
    
    # Add equation
    equation = r"$|\psi(t)\rangle = \sum_{i=0}^{n-1} \alpha_i(t) |i\rangle$"
    plt.figtext(0.5, 0.91, equation, ha='center', fontsize=16, color=OMNI_COLORS['dark_purple'])
    
    # Add explanation
    explanation = "where $|\\psi(t)\\rangle$ represents the quantum state at time $t$, $\\alpha_i(t)$ are complex probability amplitudes, and $|i\\rangle$ are basis states representing different price levels."
    plt.figtext(0.5, 0.89, explanation, ha='center', fontsize=12, color=OMNI_COLORS['gray'])
    
    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.88])
    
    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'quantum_prediction_advanced.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"Visualization saved to {output_path}")
    return output_path

def generate_quantum_state_representation(ax):
    """Generate visualization of quantum state representation"""
    # Set title
    ax.set_title('Quantum State Representation', fontsize=12, color=OMNI_COLORS['dark_purple'])
    
    # Generate data
    n_states = 8
    states = np.arange(n_states)
    
    # Generate complex amplitudes
    np.random.seed(42)
    real_parts = np.random.normal(0, 0.3, n_states)
    imag_parts = np.random.normal(0, 0.3, n_states)
    amplitudes = real_parts + 1j * imag_parts
    
    # Normalize
    norm = np.sqrt(np.sum(np.abs(amplitudes)**2))
    amplitudes = amplitudes / norm
    
    # Calculate probabilities
    probabilities = np.abs(amplitudes)**2
    
    # Plot bars for probabilities
    bars = ax.bar(states, probabilities, color=OMNI_COLORS['light_purple'], alpha=0.7)
    
    # Add phase as color gradient on top of bars
    phases = np.angle(amplitudes)
    phase_colors = plt.cm.hsv((phases + np.pi) / (2 * np.pi))
    
    for bar, phase_color in zip(bars, phase_colors):
        bar.set_edgecolor(phase_color)
        bar.set_linewidth(2)
    
    # Add labels
    ax.set_xlabel('Basis States |i⟩', fontsize=10)
    ax.set_ylabel('Probability |α|²', fontsize=10)
    ax.set_xticks(states)
    ax.set_xticklabels([f'|{i}⟩' for i in states])
    
    # Add grid
    ax.grid(True, alpha=0.3)
    
    # Add annotation
    ax.text(0.5, 0.9, 'Quantum State Probabilities', transform=ax.transAxes,
           ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_price_prediction(ax):
    """Generate visualization of price prediction with probability amplitudes"""
    # Set title
    ax.set_title('Price Prediction with Probability Amplitudes', fontsize=12, color=OMNI_COLORS['dark_purple'])
    
    # Generate historical price data
    np.random.seed(42)
    n_hist = 50
    n_pred = 30
    x_hist = np.arange(0, n_hist)
    noise = np.random.normal(0, 1, n_hist)
    trend = 0.05 * x_hist
    cycle = 5 * np.sin(x_hist / 10)
    y_hist = 100 + trend + cycle + noise.cumsum()
    
    # Generate prediction data
    x_pred = np.arange(n_hist, n_hist + n_pred)
    
    # Main prediction path
    trend_pred = 0.05 * x_pred
    cycle_pred = 5 * np.sin(x_pred / 10)
    y_pred_main = y_hist[-1] + (trend_pred[-1] - trend_pred[0]) + (cycle_pred - cycle_pred[0])
    
    # Alternative paths with different probabilities
    paths = []
    probabilities = [0.5, 0.3, 0.15, 0.05]
    volatilities = [1.0, 1.5, 2.0, 3.0]
    
    for vol, prob in zip(volatilities, probabilities):
        noise_pred = np.random.normal(0, vol, n_pred)
        path = y_hist[-1] + (trend_pred[-1] - trend_pred[0]) + (cycle_pred - cycle_pred[0]) + noise_pred.cumsum()
        paths.append((path, prob))
    
    # Plot historical data
    ax.plot(x_hist, y_hist, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Historical Price')
    
    # Plot prediction paths with probability-based transparency
    quantum_cmap = create_custom_colormap('quantum', [OMNI_COLORS['purple'], OMNI_COLORS['light_purple']])
    
    for i, (path, prob) in enumerate(paths):
        color = quantum_cmap(i / len(paths))
        ax.plot(x_pred, path, color=color, linewidth=2, alpha=0.8, 
                label=f'Path {i+1} ({prob*100:.0f}%)')
        
        # Add probability cloud
        std_dev = 2 * (i + 1)
        ax.fill_between(x_pred, path - std_dev, path + std_dev, color=color, alpha=0.1 * prob)
    
    # Add vertical line separating history from prediction
    ax.axvline(x=n_hist-1, color=OMNI_COLORS['gray'], linestyle='--', alpha=0.5, label='Present')
    
    # Add quantum effects
    for i in range(15):
        x = np.random.uniform(n_hist, n_hist + n_pred)
        y = np.random.uniform(y_hist[-1] - 15, y_hist[-1] + 15)
        size = np.random.uniform(20, 100)
        alpha = np.random.uniform(0.05, 0.2)
        ax.add_patch(plt.Circle((x, y), size, color=OMNI_COLORS['light_purple'], alpha=alpha))
    
    # Add labels and legend
    ax.set_xlabel('Time', fontsize=10)
    ax.set_ylabel('Price', fontsize=10)
    ax.legend(loc='upper left', fontsize=8)
    ax.grid(True, alpha=0.3)
    
    # Add annotation
    ax.text(0.5, 0.05, 'Multiple potential future price paths with associated probabilities', 
           transform=ax.transAxes, ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_quantum_landscape(ax):
    """Generate 3D quantum landscape visualization"""
    # Set title
    ax.set_title('Quantum Probability Landscape', fontsize=14, color=OMNI_COLORS['dark_purple'])
    
    # Generate data
    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)
    
    # Create quantum-inspired landscape
    Z1 = np.exp(-(X**2 + Y**2) / 2) / (2 * np.pi)  # Gaussian
    Z2 = np.exp(-((X-1.5)**2 + (Y-1.5)**2) / 1) / (2 * np.pi) * 0.7  # Secondary peak
    Z3 = np.exp(-((X+1.5)**2 + (Y+1.5)**2) / 1) / (2 * np.pi) * 0.5  # Tertiary peak
    Z = Z1 + Z2 + Z3
    
    # Add interference patterns
    interference = 0.1 * np.sin(5*X) * np.sin(5*Y)
    Z += interference
    
    # Create custom colormap
    quantum_cmap = create_custom_colormap('quantum_landscape', 
                                         [OMNI_COLORS['dark_purple'], 
                                          OMNI_COLORS['purple'], 
                                          OMNI_COLORS['light_purple']])
    
    # Plot surface
    surf = ax.plot_surface(X, Y, Z, cmap=quantum_cmap, linewidth=0, 
                          antialiased=True, alpha=0.8)
    
    # Add contour plot at the bottom
    ax.contour(X, Y, Z, zdir='z', offset=-0.1, cmap='viridis', alpha=0.5)
    
    # Add probability paths
    theta = np.linspace(0, 2*np.pi, 100)
    for r in [0.5, 1.0, 1.5, 2.0]:
        x_path = r * np.cos(theta)
        y_path = r * np.sin(theta)
        z_path = np.zeros_like(theta) - 0.05
        ax.plot(x_path, y_path, z_path, color=OMNI_COLORS['light_gray'], alpha=0.5)
    
    # Add labels
    ax.set_xlabel('Price Change', fontsize=10)
    ax.set_ylabel('Volatility', fontsize=10)
    ax.set_zlabel('Probability Amplitude', fontsize=10)
    
    # Set limits
    ax.set_xlim(-3, 3)
    ax.set_ylim(-3, 3)
    ax.set_zlim(-0.1, 0.5)
    
    # Set view angle
    ax.view_init(elev=30, azim=45)
    
    # Add colorbar
    cbar = plt.colorbar(surf, ax=ax, shrink=0.6, aspect=10)
    cbar.set_label('Probability Density', fontsize=10)
    
    # Add annotation
    ax.text2D(0.5, 0.02, 'Quantum probability landscape showing potential market states', 
             transform=ax.transAxes, ha='center', fontsize=9, color=OMNI_COLORS['gray'],
             bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_quantum_circuit(ax):
    """Generate visualization of quantum circuit diagram"""
    # Set title
    ax.set_title('Quantum Circuit Representation', fontsize=12, color=OMNI_COLORS['dark_purple'])
    
    # Turn off axis
    ax.axis('off')
    
    # Define circuit elements
    n_qubits = 5
    n_gates = 6
    
    # Draw qubit lines
    for i in range(n_qubits):
        ax.plot([0, 1], [i, i], 'k-', linewidth=1.5)
        ax.text(-0.1, i, f'q{i}', fontsize=10, ha='right', va='center')
    
    # Define gate positions and types
    gates = [
        {'type': 'H', 'qubit': 0, 'pos': 0.1},
        {'type': 'H', 'qubit': 1, 'pos': 0.1},
        {'type': 'X', 'qubit': 2, 'pos': 0.1},
        {'type': 'CNOT', 'control': 0, 'target': 3, 'pos': 0.3},
        {'type': 'CNOT', 'control': 1, 'target': 4, 'pos': 0.3},
        {'type': 'R', 'qubit': 2, 'pos': 0.3, 'angle': 'π/4'},
        {'type': 'CNOT', 'control': 2, 'target': 0, 'pos': 0.5},
        {'type': 'SWAP', 'qubit1': 3, 'qubit2': 4, 'pos': 0.5},
        {'type': 'H', 'qubit': 0, 'pos': 0.7},
        {'type': 'H', 'qubit': 1, 'pos': 0.7},
        {'type': 'M', 'qubit': 0, 'pos': 0.9},
        {'type': 'M', 'qubit': 1, 'pos': 0.9},
        {'type': 'M', 'qubit': 2, 'pos': 0.9},
    ]
    
    # Draw gates
    for gate in gates:
        if gate['type'] == 'H':
            # Hadamard gate
            rect = plt.Rectangle((gate['pos']-0.03, gate['qubit']-0.03), 0.06, 0.06, 
                                facecolor=OMNI_COLORS['light_blue'], alpha=0.8, 
                                edgecolor='black', linewidth=1)
            ax.add_patch(rect)
            ax.text(gate['pos'], gate['qubit'], 'H', ha='center', va='center', fontsize=8)
            
        elif gate['type'] == 'X':
            # X gate
            rect = plt.Rectangle((gate['pos']-0.03, gate['qubit']-0.03), 0.06, 0.06, 
                                facecolor=OMNI_COLORS['light_purple'], alpha=0.8, 
                                edgecolor='black', linewidth=1)
            ax.add_patch(rect)
            ax.text(gate['pos'], gate['qubit'], 'X', ha='center', va='center', fontsize=8)
            
        elif gate['type'] == 'R':
            # Rotation gate
            rect = plt.Rectangle((gate['pos']-0.03, gate['qubit']-0.03), 0.06, 0.06, 
                                facecolor=OMNI_COLORS['gold'], alpha=0.8, 
                                edgecolor='black', linewidth=1)
            ax.add_patch(rect)
            ax.text(gate['pos'], gate['qubit'], 'R', ha='center', va='center', fontsize=8)
            ax.text(gate['pos']+0.03, gate['qubit']-0.03, gate['angle'], ha='left', va='top', fontsize=6)
            
        elif gate['type'] == 'CNOT':
            # CNOT gate
            ax.plot([gate['pos'], gate['pos']], [gate['control'], gate['target']], 'k-', linewidth=1.5)
            ax.plot(gate['pos'], gate['control'], 'ko', markersize=5, mfc='black')
            circle = plt.Circle((gate['pos'], gate['target']), 0.03, 
                               facecolor='white', edgecolor='black', linewidth=1.5)
            ax.add_patch(circle)
            ax.plot([gate['pos']-0.03, gate['pos']+0.03], [gate['target'], gate['target']], 'k-', linewidth=1.5)
            
        elif gate['type'] == 'SWAP':
            # SWAP gate
            ax.plot([gate['pos'], gate['pos']], [gate['qubit1'], gate['qubit2']], 'k-', linewidth=1.5)
            ax.plot([gate['pos']-0.02, gate['pos']+0.02], [gate['qubit1']-0.02, gate['qubit1']+0.02], 'k-', linewidth=1.5)
            ax.plot([gate['pos']-0.02, gate['pos']+0.02], [gate['qubit1']+0.02, gate['qubit1']-0.02], 'k-', linewidth=1.5)
            ax.plot([gate['pos']-0.02, gate['pos']+0.02], [gate['qubit2']-0.02, gate['qubit2']+0.02], 'k-', linewidth=1.5)
            ax.plot([gate['pos']-0.02, gate['pos']+0.02], [gate['qubit2']+0.02, gate['qubit2']-0.02], 'k-', linewidth=1.5)
            
        elif gate['type'] == 'M':
            # Measurement
            rect = plt.Rectangle((gate['pos']-0.03, gate['qubit']-0.03), 0.06, 0.06, 
                                facecolor=OMNI_COLORS['red'], alpha=0.8, 
                                edgecolor='black', linewidth=1)
            ax.add_patch(rect)
            ax.text(gate['pos'], gate['qubit'], 'M', ha='center', va='center', fontsize=8, color='white')
    
    # Set limits
    ax.set_xlim(-0.2, 1.1)
    ax.set_ylim(-0.5, n_qubits-0.5)
    
    # Add annotation
    ax.text(0.5, -0.3, 'Quantum circuit for price prediction', 
           ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_entanglement_network(ax):
    """Generate visualization of quantum entanglement network"""
    # Set title
    ax.set_title('Asset Entanglement Network', fontsize=12, color=OMNI_COLORS['dark_purple'])
    
    # Turn off axis
    ax.axis('off')
    
    # Define nodes (assets)
    assets = [
        {'name': 'BTC', 'pos': (0.5, 0.8), 'size': 0.15},
        {'name': 'ETH', 'pos': (0.3, 0.6), 'size': 0.12},
        {'name': 'SOL', 'pos': (0.7, 0.6), 'size': 0.1},
        {'name': 'BNB', 'pos': (0.2, 0.4), 'size': 0.08},
        {'name': 'XRP', 'pos': (0.5, 0.4), 'size': 0.07},
        {'name': 'ADA', 'pos': (0.8, 0.4), 'size': 0.07},
        {'name': 'DOGE', 'pos': (0.3, 0.2), 'size': 0.06},
        {'name': 'DOT', 'pos': (0.7, 0.2), 'size': 0.06},
    ]
    
    # Define edges (correlations/entanglements)
    edges = [
        {'from': 'BTC', 'to': 'ETH', 'strength': 0.9},
        {'from': 'BTC', 'to': 'SOL', 'strength': 0.8},
        {'from': 'BTC', 'to': 'BNB', 'strength': 0.7},
        {'from': 'BTC', 'to': 'XRP', 'strength': 0.6},
        {'from': 'BTC', 'to': 'ADA', 'strength': 0.7},
        {'from': 'ETH', 'to': 'SOL', 'strength': 0.8},
        {'from': 'ETH', 'to': 'BNB', 'strength': 0.7},
        {'from': 'ETH', 'to': 'DOT', 'strength': 0.6},
        {'from': 'SOL', 'to': 'ADA', 'strength': 0.5},
        {'from': 'XRP', 'to': 'DOGE', 'strength': 0.4},
        {'from': 'DOGE', 'to': 'DOT', 'strength': 0.3},
    ]
    
    # Create a mapping from asset names to positions
    asset_positions = {asset['name']: asset['pos'] for asset in assets}
    
    # Draw edges
    for edge in edges:
        start_pos = asset_positions[edge['from']]
        end_pos = asset_positions[edge['to']]
        
        # Draw edge with strength-based width and alpha
        ax.plot([start_pos[0], end_pos[0]], [start_pos[1], end_pos[1]], 
               color=OMNI_COLORS['purple'], alpha=edge['strength'], 
               linewidth=edge['strength']*3)
        
        # Add some "entanglement" effects
        for _ in range(3):
            t = np.random.uniform(0.3, 0.7)
            x = start_pos[0] + t * (end_pos[0] - start_pos[0])
            y = start_pos[1] + t * (end_pos[1] - start_pos[1])
            
            # Add a small glow effect
            glow = plt.Circle((x, y), 0.02, color=OMNI_COLORS['light_purple'], alpha=edge['strength']*0.7)
            ax.add_patch(glow)
    
    # Draw nodes
    for asset in assets:
        # Draw node
        circle = plt.Circle(asset['pos'], asset['size'], 
                           facecolor=OMNI_COLORS['light_purple'], alpha=0.7, 
                           edgecolor=OMNI_COLORS['purple'], linewidth=2)
        ax.add_patch(circle)
        
        # Add asset name
        ax.text(asset['pos'][0], asset['pos'][1], asset['name'], 
               ha='center', va='center', fontsize=10, fontweight='bold')
    
    # Set limits
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    
    # Add annotation
    ax.text(0.5, 0.02, 'Quantum entanglement between correlated assets', 
           ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_quantum_entropy(ax):
    """Generate visualization of quantum entropy measurement"""
    # Set title
    ax.set_title('Quantum Entropy Analysis', fontsize=12, color=OMNI_COLORS['dark_purple'])
    
    # Generate data
    np.random.seed(42)
    n_days = 100
    x = np.arange(n_days)
    
    # Generate price data
    price = 100 + np.cumsum(np.random.normal(0, 1, n_days))
    
    # Generate entropy data
    base_entropy = np.linspace(0.2, 0.8, n_days) + np.random.normal(0, 0.1, n_days)
    entropy_spikes = np.zeros(n_days)
    spike_points = [20, 40, 60, 80]
    for point in spike_points:
        entropy_spikes[point-3:point+3] = np.linspace(0, 0.5, 6)
    entropy = np.clip(base_entropy + entropy_spikes, 0, 1)
    
    # Create twin axes
    ax2 = ax.twinx()
    
    # Plot price
    ax.plot(x, price, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Price')
    ax.set_xlabel('Time', fontsize=10)
    ax.set_ylabel('Price', fontsize=10, color=OMNI_COLORS['dark_blue'])
    ax.tick_params(axis='y', labelcolor=OMNI_COLORS['dark_blue'])
    
    # Plot entropy
    ax2.plot(x, entropy, color=OMNI_COLORS['purple'], linewidth=2, label='Quantum Entropy')
    ax2.set_ylabel('Entropy', fontsize=10, color=OMNI_COLORS['purple'])
    ax2.tick_params(axis='y', labelcolor=OMNI_COLORS['purple'])
    
    # Add uncertainty regions
    for point in spike_points:
        ax.axvspan(point-3, point+3, color=OMNI_COLORS['light_purple'], alpha=0.2)
    
    # Add grid
    ax.grid(True, alpha=0.3)
    
    # Add legend
    lines1, labels1 = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=8)
    
    # Add annotation
    ax.text(0.5, 0.05, 'Quantum entropy measures market uncertainty', 
           transform=ax.transAxes, ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

if __name__ == "__main__":
    generate_quantum_prediction_visualization()
