#!/usr/bin/env python3
"""
Generate detailed mathematical derivations for OMNI whitepaper
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch, Rectangle, Circle
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

def generate_equation_image(equation, filename, dpi=300, fontsize=16, transparent=True):
    """Generate a high-resolution image of a LaTeX equation"""
    fig = plt.figure(figsize=(10, 1.2), dpi=dpi)
    if transparent:
        fig.patch.set_alpha(0)
    else:
        fig.patch.set_facecolor('#f8f8ff')

    plt.text(0.5, 0.5, f"${equation}$", fontsize=fontsize, ha='center', va='center',
             color=OMNI_COLORS['dark_purple'])

    # Remove axes and margins
    plt.axis('off')
    plt.tight_layout(pad=0.1)

    # Save to file
    img_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(img_path, dpi=dpi, bbox_inches='tight', pad_inches=0.1, transparent=transparent)
    plt.close(fig)

    return img_path

def generate_derivation_image(title, equations, explanations, filename, dpi=300, fontsize=14, transparent=False):
    """Generate a detailed derivation with step-by-step equations and explanations"""
    # Calculate figure height based on number of equations
    height = 1.5 + len(equations) * 1.0

    fig = plt.figure(figsize=(12, height), dpi=dpi)
    if transparent:
        fig.patch.set_alpha(0)
    else:
        fig.patch.set_facecolor('#f8f8ff')

    # Add title
    plt.figtext(0.5, 0.95, title, fontsize=fontsize+2, ha='center', va='top',
               color=OMNI_COLORS['dark_purple'], fontweight='bold')

    # Add equations and explanations
    for i, (eq, exp) in enumerate(zip(equations, explanations)):
        y_pos = 0.85 - i * (0.8 / len(equations))

        # Add equation
        plt.figtext(0.5, y_pos, f"${eq}$", fontsize=fontsize, ha='center', va='center',
                   color=OMNI_COLORS['dark_purple'])

        # Add explanation
        plt.figtext(0.5, y_pos - 0.05, exp, fontsize=fontsize-2, ha='center', va='top',
                   color=OMNI_COLORS['gray'], style='italic')

        # Add arrow between equations
        if i < len(equations) - 1:
            arrow = FancyArrowPatch((0.5, y_pos - 0.1), (0.5, y_pos - 0.15),
                                   arrowstyle='->', color=OMNI_COLORS['light_purple'],
                                   mutation_scale=20, linewidth=1.5,
                                   transform=fig.transFigure, figure=fig)
            fig.patches.append(arrow)

    # Remove axes and margins
    plt.axis('off')
    plt.tight_layout(pad=0.1)

    # Save to file
    img_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(img_path, dpi=dpi, bbox_inches='tight', pad_inches=0.1, transparent=transparent)
    plt.close(fig)

    return img_path

def generate_mathematical_derivations():
    """Generate detailed mathematical derivations for OMNI whitepaper"""
    print("Generating mathematical derivations...")

    # 1. Capital Growth Model Derivation
    capital_growth_title = "Capital Growth Model Derivation"
    capital_growth_equations = [
        r"C_t = C_0 \cdot \prod_{i=1}^{t} (1 + R_i)",
        r"R_i = r_i \cdot (1 - L_i)",
        r"C_t = C_0 \cdot \prod_{i=1}^{t} (1 + r_i \cdot (1 - L_i))",
        r"C_t \approx C_0 \cdot (1 + \bar{r})^t \cdot \prod_{i=1}^{t} (1 - L_i)",
        r"C_t = C_0 \cdot (1 + \bar{r})^t \cdot e^{-\sum_{i=1}^{t} L_i}"
    ]

    capital_growth_explanations = [
        "Initial capital growth formula where C_t is capital at time t, C_0 is initial capital, and R_i is return for trade i",
        "Decomposing return R_i into raw return r_i and loss factor L_i",
        "Substituting the return decomposition into the capital growth formula",
        "Approximating with average return rate \\bar{r} when raw returns are relatively stable",
        "Final form using exponential representation of the loss product, showing impact of cumulative losses"
    ]

    capital_growth_derivation = generate_derivation_image(
        capital_growth_title,
        capital_growth_equations,
        capital_growth_explanations,
        "capital_growth_derivation.png"
    )

    # 2. Quantum State Evolution Derivation
    quantum_state_title = "Quantum State Evolution Derivation"
    quantum_state_equations = [
        r"|\psi(t)\rangle = \sum_{i=0}^{n-1} \alpha_i(t) |i\rangle",
        r"|\psi(t+1)\rangle = \hat{U}(t) |\psi(t)\rangle",
        r"|\psi(t+1)\rangle = \sum_{j=0}^{n-1} \sum_{i=0}^{n-1} U_{ji}(t) \alpha_i(t) |j\rangle",
        r"|\psi(t+1)\rangle = \sum_{j=0}^{n-1} \beta_j(t+1) |j\rangle",
        r"\beta_j(t+1) = \sum_{i=0}^{n-1} U_{ji}(t) \alpha_i(t)"
    ]

    quantum_state_explanations = [
        "Initial quantum state representation where |\\psi(t)\\rangle is the market state at time t",
        "State evolution through unitary operator \\hat{U}(t) representing market dynamics",
        "Expanding the unitary operation using matrix elements U_{ji}(t)",
        "Resulting state at time t+1 with new probability amplitudes \\beta_j(t+1)",
        "Explicit calculation of new probability amplitudes from previous state"
    ]

    quantum_state_derivation = generate_derivation_image(
        quantum_state_title,
        quantum_state_equations,
        quantum_state_explanations,
        "quantum_state_derivation.png"
    )

    # 3. Hyperdimensional Computing Derivation
    hyperdimensional_title = "Hyperdimensional Computing Operations Derivation"
    hyperdimensional_equations = [
        r"\mathbf{v} = \phi(x) \in \mathbb{R}^D, D \gg 1000",
        r"\mathbf{c} = \mathbf{a} \otimes \mathbf{b} \approx \mathbf{a} \odot \mathbf{b}",
        r"\mathbf{s} = \mathbf{a} + \mathbf{b} \approx \frac{\mathbf{a} + \mathbf{b}}{|\mathbf{a} + \mathbf{b}|}",
        r"\mathbf{M} = \sum_{i=1}^{N} \phi(\mathbf{x}_i) \otimes \phi(\mathbf{y}_i)",
        r"\mathbf{y'} = \mathbf{M} \otimes \phi(\mathbf{x'}) \approx \arg\max_{\mathbf{y}} \text{sim}(\mathbf{M} \otimes \phi(\mathbf{x'}), \phi(\mathbf{y}))"
    ]

    hyperdimensional_explanations = [
        "Encoding function \\phi maps input x to high-dimensional vector \\mathbf{v} in D-dimensional space",
        "Binding operation \\otimes creates associations, approximated by element-wise multiplication \\odot",
        "Bundling operation + combines vectors, typically normalized to maintain vector magnitude",
        "Memory matrix \\mathbf{M} stores associations between input-output pairs using binding",
        "Retrieval operation finds the most similar output vector using similarity metric sim()"
    ]

    hyperdimensional_derivation = generate_derivation_image(
        hyperdimensional_title,
        hyperdimensional_equations,
        hyperdimensional_explanations,
        "hyperdimensional_derivation.png"
    )

    # 4. Zero-Loss Enforcement Derivation
    zero_loss_title = "Zero-Loss Enforcement Mechanism Derivation"
    zero_loss_equations = [
        r"\text{SL}_{\text{initial}}(t) = \text{Entry} - f \cdot \text{ATR}(t)",
        r"\text{SL}_{\text{trailing}}(t) = \max(\text{Price}(t) - f \cdot \text{ATR}(t), \text{SL}(t-1))",
        r"\text{SL}_{\text{breakeven}}(t) = \text{Entry if PnL}(t) \geq \text{TargetPnL}_1 \text{ else SL}_{\text{trailing}}(t)",
        r"\text{SL}(t) = \max(\text{SL}_{\text{initial}}(t), \text{SL}_{\text{trailing}}(t), \text{SL}_{\text{breakeven}}(t))",
        r"\text{ExpectedPnL}(t) = \sum_{i=1}^{n} p_i \cdot \text{PnL}_i(t) \geq 0"
    ]

    zero_loss_explanations = [
        "Initial stop-loss based on Average True Range (ATR) and scaling factor f",
        "Trailing stop-loss that moves up with price, never moves down",
        "Break-even stop-loss that moves to entry price after reaching first profit target",
        "Final stop-loss is the maximum of all stop-loss types, ensuring the tightest protection",
        "Expected profit and loss must be non-negative, enforcing the zero-loss principle"
    ]

    zero_loss_derivation = generate_derivation_image(
        zero_loss_title,
        zero_loss_equations,
        zero_loss_explanations,
        "zero_loss_derivation.png"
    )

    # 5. Position Sizing Algorithm Derivation
    position_sizing_title = "Position Sizing Algorithm Derivation"
    position_sizing_equations = [
        r"\text{Risk}_{\$} = \text{Capital} \times \text{Risk\%}",
        r"\text{Risk}_{\text{price}} = \text{Entry} - \text{StopLoss} = f \cdot \text{ATR}",
        r"\text{Size}_{\text{raw}} = \frac{\text{Risk}_{\$}}{\text{Risk}_{\text{price}}}",
        r"\text{Size}_{\text{adjusted}} = \text{Size}_{\text{raw}} \times \text{Confidence}",
        r"\text{Size}_{\text{final}} = \min(\text{Size}_{\text{adjusted}}, \text{Size}_{\text{max}})"
    ]

    position_sizing_explanations = [
        "Dollar risk is calculated as a percentage of total capital",
        "Price risk is the distance from entry to stop-loss, proportional to ATR",
        "Raw position size is the ratio of dollar risk to price risk",
        "Position size is adjusted by confidence score from prediction models",
        "Final position size is capped by maximum allowed size to prevent overexposure"
    ]

    position_sizing_derivation = generate_derivation_image(
        position_sizing_title,
        position_sizing_equations,
        position_sizing_explanations,
        "position_sizing_derivation.png"
    )

    # Create a combined image with all derivations
    print("  Creating combined derivations image...")

    # Create figure with multiple subplots
    fig = plt.figure(figsize=(20, 24), dpi=300)
    fig.patch.set_facecolor('#f8f8ff')

    # Create grid for subplots
    gs = gridspec.GridSpec(5, 1, height_ratios=[1, 1, 1, 1, 1])

    # Add title
    fig.suptitle('OMNI-ALPHA VΩ∞∞ Mathematical Derivations',
                fontsize=24, fontweight='bold', color=OMNI_COLORS['dark_purple'],
                y=0.98)

    # Add subtitle
    plt.figtext(0.5, 0.96, 'Detailed Step-by-Step Mathematical Foundations of the System',
               ha='center', fontsize=16, color=OMNI_COLORS['gray'])

    # Add derivation images
    derivation_images = [
        capital_growth_derivation,
        quantum_state_derivation,
        hyperdimensional_derivation,
        zero_loss_derivation,
        position_sizing_derivation
    ]

    for i, img_path in enumerate(derivation_images):
        ax = fig.add_subplot(gs[i])
        img = plt.imread(img_path)
        ax.imshow(img)
        ax.axis('off')

    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    # Save figure
    output_path = os.path.join(IMAGE_DIR, 'mathematical_derivations_combined.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Mathematical derivations saved to {output_path}")
    return output_path

if __name__ == "__main__":
    generate_mathematical_derivations()
