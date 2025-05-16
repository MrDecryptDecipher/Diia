#!/usr/bin/env python3
"""
Generate sophisticated zero-loss enforcement visualization for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch

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

def generate_zero_loss_visualization():
    """Generate sophisticated zero-loss enforcement visualization"""
    print("Generating zero-loss enforcement visualization...")

    # Create figure with multiple subplots
    fig = plt.figure(figsize=(15, 12), dpi=300)
    fig.patch.set_facecolor('#f0f0f8')

    # Create grid for subplots
    gs = gridspec.GridSpec(2, 2, height_ratios=[1.5, 1])

    # 1. Main Zero-Loss Trade Example - Top Row
    ax1 = fig.add_subplot(gs[0, :])
    generate_zero_loss_trade_example(ax1)

    # 2. Dynamic Stop-Loss Adjustment - Bottom Left
    ax2 = fig.add_subplot(gs[1, 0])
    generate_dynamic_stop_loss(ax2)

    # 3. Position Sizing Algorithm - Bottom Right
    ax3 = fig.add_subplot(gs[1, 1])
    generate_position_sizing(ax3)

    # Add title
    fig.suptitle('OMNI-ALPHA VΩ∞∞ Zero-Loss Enforcement System',
                fontsize=20, fontweight='bold', color=OMNI_COLORS['dark_purple'],
                y=0.98)

    # Add subtitle
    plt.figtext(0.5, 0.94, 'Advanced Risk Management with Dynamic Stop-Loss and Optimal Position Sizing',
               ha='center', fontsize=14, color=OMNI_COLORS['gray'])

    # Add equation
    equation = r"$\mathrm{SL}(t) = \mathrm{Entry} - \max(\mathrm{ATR}(t) \times f, \mathrm{Entry} - \mathrm{Exit}(t-1))$"
    plt.figtext(0.5, 0.91, equation, ha='center', fontsize=16, color=OMNI_COLORS['dark_purple'])

    # Add explanation
    explanation = "where SL(t) is the stop-loss level at time t, ATR is the Average True Range, f is a scaling factor, and Exit(t-1) is the previous exit level."
    plt.figtext(0.5, 0.89, explanation, ha='center', fontsize=12, color=OMNI_COLORS['gray'])

    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.88])

    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'zero_loss_advanced.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Visualization saved to {output_path}")
    return output_path

def generate_zero_loss_trade_example(ax):
    """Generate visualization of a zero-loss trade example"""
    # Set title
    ax.set_title('Zero-Loss Trade Example with Dynamic Risk Management',
                fontsize=14, color=OMNI_COLORS['dark_purple'])

    # Generate price data
    np.random.seed(42)  # For reproducibility
    n_points = 100

    # Create price data with a trend and some volatility
    t = np.linspace(0, 10, n_points)
    price = 100 + np.cumsum(np.random.normal(0.05, 0.2, n_points))

    # Plot price
    ax.plot(t, price, color=OMNI_COLORS['dark_blue'], linewidth=2.5, label='Asset Price')

    # Add entry point
    entry_idx = 10
    entry_price = price[entry_idx]
    ax.scatter(t[entry_idx], entry_price, color=OMNI_COLORS['green'], s=150, marker='^',
              label='Entry Point')
    ax.axhline(y=entry_price, xmin=t[entry_idx]/t[-1], xmax=1,
              color=OMNI_COLORS['green'], linestyle='--', linewidth=1, alpha=0.5)

    # Add initial stop loss
    initial_stop = entry_price - 2
    ax.axhline(y=initial_stop, xmin=t[entry_idx]/t[-1], xmax=t[entry_idx+10]/t[-1],
              color=OMNI_COLORS['red'], linestyle='--', linewidth=2,
              label='Initial Stop Loss')

    # Add trailing stop phases
    stop_phases = [
        {"start_idx": entry_idx+10, "end_idx": entry_idx+30, "level": entry_price - 1.5},
        {"start_idx": entry_idx+30, "end_idx": entry_idx+50, "level": entry_price},
        {"start_idx": entry_idx+50, "end_idx": entry_idx+70, "level": entry_price + 2},
        {"start_idx": entry_idx+70, "end_idx": n_points-1, "level": entry_price + 4}
    ]

    # Plot stop phases
    for i, phase in enumerate(stop_phases):
        ax.axhline(y=phase["level"],
                  xmin=t[phase["start_idx"]]/t[-1],
                  xmax=t[phase["end_idx"]]/t[-1],
                  color=OMNI_COLORS['red'], linestyle='--', linewidth=2)

        # Add label for first phase only to avoid clutter
        if i == 0:
            ax.text(t[phase["start_idx"]+5], phase["level"]-0.3,
                   "Trailing Stop", color=OMNI_COLORS['red'], fontsize=10, fontweight='bold')

    # Add partial profit taking points
    profit_points = [
        {"idx": entry_idx+25, "amount": "25%", "price": price[entry_idx+25]},
        {"idx": entry_idx+45, "amount": "25%", "price": price[entry_idx+45]},
        {"idx": entry_idx+65, "amount": "25%", "price": price[entry_idx+65]}
    ]

    for point in profit_points:
        ax.scatter(t[point["idx"]], point["price"], color=OMNI_COLORS['gold'], s=120, marker='d')
        ax.text(t[point["idx"]], point["price"]+1,
               f"Take {point['amount']} Profit", color=OMNI_COLORS['gold'], fontsize=10, fontweight='bold',
               ha='center', va='bottom')

    # Add final exit
    exit_idx = n_points - 10
    ax.scatter(t[exit_idx], price[exit_idx], color=OMNI_COLORS['red'], s=150, marker='v',
              label='Final Exit (25%)')

    # Add annotations for key concepts
    # Break-even point
    ax.annotate("Break-Even Point",
               xy=(t[entry_idx+30], entry_price),
               xytext=(t[entry_idx+30]-1, entry_price-3),
               arrowprops=dict(facecolor=OMNI_COLORS['green'], shrink=0.05, width=1.5),
               color=OMNI_COLORS['green'], fontsize=10, fontweight='bold')

    # Risk eliminated
    ax.annotate("Risk Eliminated",
               xy=(t[entry_idx+40], entry_price),
               xytext=(t[entry_idx+40]+1, entry_price-3),
               arrowprops=dict(facecolor=OMNI_COLORS['green'], shrink=0.05, width=1.5),
               color=OMNI_COLORS['green'], fontsize=10, fontweight='bold')

    # Add profit zones
    ax.axhspan(entry_price, entry_price + 6, alpha=0.1, color=OMNI_COLORS['green'], label='Profit Zone')
    ax.axhspan(entry_price - 3, entry_price, alpha=0.1, color=OMNI_COLORS['red'], label='Risk Zone')

    # Add trade phases
    phases = [
        {"start": entry_idx, "end": entry_idx+30, "name": "Phase 1: Risk Management", "y": price.min() - 2},
        {"start": entry_idx+30, "end": entry_idx+70, "name": "Phase 2: Profit Accumulation", "y": price.min() - 2},
        {"start": entry_idx+70, "end": n_points-1, "name": "Phase 3: Exit Strategy", "y": price.min() - 2}
    ]

    for phase in phases:
        ax.annotate(phase["name"],
                   xy=(t[phase["start"] + (phase["end"] - phase["start"])//2], phase["y"]),
                   xytext=(t[phase["start"] + (phase["end"] - phase["start"])//2], phase["y"]),
                   ha='center', va='center', fontsize=10, fontweight='bold',
                   bbox=dict(facecolor=OMNI_COLORS['light_gray'], alpha=0.7, boxstyle='round,pad=0.3'))

        # Add vertical lines separating phases
        if phase["start"] > entry_idx:
            ax.axvline(x=t[phase["start"]], color=OMNI_COLORS['gray'], linestyle='--', alpha=0.5)

    # Add labels
    ax.set_xlabel('Time', fontsize=12)
    ax.set_ylabel('Price', fontsize=12)
    ax.grid(True, alpha=0.3)

    # Add legend
    ax.legend(loc='upper left', fontsize=10)

    # Add trade statistics
    stats_text = """
    Entry Price: 100.00
    Initial Stop: 98.00
    Initial Risk: 2.00 (2%)
    Final Exit: 106.50
    Total Profit: 5.50 (5.5%)
    Risk-Reward: 2.75
    """

    # Add stats box
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
           fontsize=10, fontweight='bold', va='top',
           bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.5'))

    # Add zero-loss principle explanation
    principle_text = """
    Zero-Loss Principle:
    1. Initial tight stop-loss
    2. Move stop to break-even after partial profit
    3. Trail stop as price advances
    4. Take partial profits at predetermined levels
    5. Exit final position with trailing stop
    """

    # Add principle box
    ax.text(0.98, 0.98, principle_text, transform=ax.transAxes,
           fontsize=10, fontweight='bold', va='top', ha='right',
           bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.5'))

def generate_dynamic_stop_loss(ax):
    """Generate visualization of dynamic stop-loss adjustment"""
    # Set title
    ax.set_title('Dynamic Stop-Loss Adjustment', fontsize=12, color=OMNI_COLORS['dark_purple'])

    # Generate price data
    np.random.seed(43)  # Different seed for variety
    n_points = 50

    # Create price data with a trend and some volatility
    t = np.linspace(0, 5, n_points)
    price = 100 + np.cumsum(np.random.normal(0.05, 0.3, n_points))

    # Calculate ATR (simplified version)
    atr = np.zeros_like(price)
    for i in range(1, len(price)):
        true_range = max(price[i] - price[i-1], abs(price[i] - price[i-1]))
        atr[i] = 0.9 * atr[i-1] + 0.1 * true_range if i > 1 else true_range

    # Calculate dynamic stop-loss
    entry_price = price[5]
    f_values = [1.5, 2.0, 2.5]  # Different ATR multipliers
    stop_loss = {}

    for f in f_values:
        stop_loss[f] = np.zeros_like(price)
        stop_loss[f][5] = entry_price - f * atr[5]  # Initial stop

        for i in range(6, len(price)):
            # Dynamic adjustment based on ATR and previous levels
            new_stop = entry_price - f * atr[i]
            stop_loss[f][i] = max(stop_loss[f][i-1], new_stop)

            # After price moves up enough, start trailing
            if price[i] > entry_price + f * atr[i]:
                stop_loss[f][i] = max(stop_loss[f][i], price[i] - f * atr[i])

    # Plot price
    ax.plot(t, price, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Price')

    # Plot entry point
    ax.scatter(t[5], entry_price, color=OMNI_COLORS['green'], s=100, marker='^', label='Entry')

    # Plot stop-loss levels with different ATR multipliers
    colors = [OMNI_COLORS['red'], OMNI_COLORS['gold'], OMNI_COLORS['purple']]
    for i, f in enumerate(f_values):
        ax.plot(t[5:], stop_loss[f][5:], color=colors[i], linestyle='--', linewidth=2,
               label=f'Stop (ATR×{f})')

    # Add labels
    ax.set_xlabel('Time', fontsize=10)
    ax.set_ylabel('Price', fontsize=10)
    ax.grid(True, alpha=0.3)

    # Add legend
    ax.legend(loc='upper left', fontsize=8)

    # Add annotation
    ax.text(0.5, 0.05, 'Dynamic stop-loss adjusts based on market volatility (ATR)',
           transform=ax.transAxes, ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

def generate_position_sizing(ax):
    """Generate visualization of position sizing algorithm"""
    # Set title
    ax.set_title('Optimal Position Sizing', fontsize=12, color=OMNI_COLORS['dark_purple'])

    # Create data for visualization
    risk_pct = np.linspace(0.5, 2.5, 5)  # Risk percentage
    confidence = np.linspace(0.5, 1.0, 6)  # Confidence levels
    atr_values = np.array([0.5, 1.0, 1.5, 2.0, 2.5])  # ATR values

    # Create meshgrid for 3D surface
    X, Y = np.meshgrid(risk_pct, confidence)

    # Calculate position sizes for different ATR values
    capital = 10000
    Z_matrices = []

    for atr in atr_values:
        # Position size formula: (Capital × Risk% × Confidence) / (ATR × Multiplier)
        # Using a fixed multiplier of 2 for simplicity
        # Ensure proper broadcasting by using meshgrid correctly
        Z = (capital * X * Y) / (atr * 2)
        Z_matrices.append(Z)

    # Create custom colormap
    position_cmap = create_custom_colormap('position_sizing',
                                         [OMNI_COLORS['red'],
                                          OMNI_COLORS['gold'],
                                          OMNI_COLORS['green']])

    # Plot heatmap for middle ATR value
    middle_idx = len(atr_values) // 2
    im = ax.imshow(Z_matrices[middle_idx], cmap=position_cmap, aspect='auto', origin='lower')

    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Position Size ($)', fontsize=10)

    # Set x and y ticks
    ax.set_xticks(np.arange(len(risk_pct)))
    ax.set_yticks(np.arange(len(confidence)))
    ax.set_xticklabels([f'{r:.1f}%' for r in risk_pct])
    ax.set_yticklabels([f'{c:.2f}' for c in confidence])

    # Set labels
    ax.set_xlabel('Risk Percentage', fontsize=10)
    ax.set_ylabel('Confidence Score', fontsize=10)

    # Add title for the specific ATR
    ax.set_title(f'Position Size Heatmap (ATR = {atr_values[middle_idx]})', fontsize=12)

    # Add position sizing formula
    formula = r"$\mathrm{Size} = \frac{\mathrm{Capital} \times \mathrm{Risk\%} \times \mathrm{Confidence}}{\mathrm{ATR} \times \mathrm{Multiplier}}$"
    ax.text(0.5, -0.15, formula, transform=ax.transAxes, ha='center', fontsize=12)

    # Add annotation
    ax.text(0.5, -0.25, 'Optimal position sizing balances risk and confidence',
           transform=ax.transAxes, ha='center', fontsize=9, color=OMNI_COLORS['gray'],
           bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.3'))

if __name__ == "__main__":
    generate_zero_loss_visualization()
