#!/usr/bin/env python3
"""
Generate comprehensive documentation for the OMNI project with advanced features
"""

import os
import sys
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, Rectangle, Arrow, Polygon
from matplotlib.collections import PatchCollection
import matplotlib.colors as mcolors
from matplotlib.path import Path
import matplotlib.patches as mpatches
import networkx as nx
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.platypus import PageBreak, Table, TableStyle, Flowable, KeepTogether
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import HRFlowable
from io import BytesIO
import math

# Directory for storing generated images
IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
os.makedirs(IMAGE_DIR, exist_ok=True)

# Custom colors
OMNI_COLORS = {
    'dark_blue': (0/255, 51/255, 102/255),
    'light_blue': (51/255, 153/255, 255/255),
    'purple': (102/255, 0/255, 204/255),
    'gold': (204/255, 153/255, 0/255),
    'green': (0/255, 153/255, 51/255),
    'red': (204/255, 0/255, 0/255),
    'orange': (255/255, 153/255, 0/255),
    'teal': (0/255, 153/255, 153/255),
    'light_gray': (240/255, 240/255, 240/255),
    'dark_gray': (80/255, 80/255, 80/255)
}

# LaTeX equation rendering class - simplified version without usetex
class LatexEquation(Flowable):
    """A flowable that renders a LaTeX equation using matplotlib"""

    def __init__(self, latex_code, width=6*inch, height=1*inch, fontsize=12):
        Flowable.__init__(self)
        self.latex_code = latex_code
        self.width = width
        self.height = height
        self.fontsize = fontsize

    def draw(self):
        # Create a BytesIO object to store the image
        buf = BytesIO()

        # Create a figure with transparent background
        fig = plt.figure(figsize=(self.width/inch, self.height/inch), dpi=100)
        fig.patch.set_alpha(0.0)

        # Add text without LaTeX rendering
        plt.text(0.5, 0.5, f"{self.latex_code}",
                 fontsize=self.fontsize, ha='center', va='center')

        # Remove axes
        plt.axis('off')

        # Save the figure to the BytesIO object
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0.1, transparent=True)
        plt.close(fig)

        # Get the image from the BytesIO object
        buf.seek(0)
        img = RLImage(buf, width=self.width, height=self.height)

        # Draw the image
        img.drawOn(self.canv, 0, 0)

# Function to generate quantum background image
def generate_quantum_background(filename, width=1000, height=1000):
    """Generate a quantum-inspired background image"""
    # Create a figure with transparent background
    fig, ax = plt.subplots(figsize=(width/100, height/100), dpi=100)
    fig.patch.set_alpha(0.0)
    ax.set_aspect('equal')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    # Create custom colormap
    colors = [OMNI_COLORS['dark_blue'], OMNI_COLORS['light_blue'],
              (0.4, 0.6, 1.0), (0.6, 0.8, 1.0)]
    cmap = matplotlib.colors.LinearSegmentedColormap.from_list("OmniBlue", colors)

    # Generate quantum wave patterns
    x = np.linspace(0, 1, 1000)
    y = np.linspace(0, 1, 1000)
    X, Y = np.meshgrid(x, y)

    # Create wave patterns
    Z1 = 0.5 * np.sin(X * 50) * np.sin(Y * 50)
    Z2 = 0.3 * np.sin(X * 30 + Y * 30)
    Z3 = 0.2 * np.cos(X * 20 - Y * 20)
    Z = Z1 + Z2 + Z3

    # Plot contour
    contour = ax.contourf(X, Y, Z, 50, cmap=cmap, alpha=0.7)

    # Add some quantum particle effects
    for _ in range(20):
        x0, y0 = np.random.rand(), np.random.rand()
        size = np.random.rand() * 0.02 + 0.01
        ax.add_patch(plt.Circle((x0, y0), size, color='white', alpha=0.7))

    # Save the background
    plt.savefig(os.path.join(IMAGE_DIR, filename), dpi=100,
                bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close()

    return os.path.join(IMAGE_DIR, filename)

# Function to generate OMNI logo
def generate_omni_logo(filename, size=(800, 800)):
    """Generate the OMNI logo"""
    # Create figure
    fig, ax = plt.subplots(figsize=(size[0]/100, size[1]/100), dpi=100)
    fig.patch.set_alpha(0.0)
    ax.set_aspect('equal')
    ax.set_xlim(-1, 1)
    ax.set_ylim(-1, 1)
    ax.axis('off')

    # Create circular background with gradient
    n = 100
    r = np.linspace(0, 1, n)
    theta = np.linspace(0, 2*np.pi, n)
    R, Theta = np.meshgrid(r, theta)
    X = R * np.cos(Theta)
    Y = R * np.sin(Theta)

    # Create a radial gradient
    C = 1 - R  # Color intensity decreases with radius

    # Plot with custom colormap
    colors = [OMNI_COLORS['dark_blue'], OMNI_COLORS['light_blue']]
    cmap = matplotlib.colors.LinearSegmentedColormap.from_list("OmniBlue", colors)
    ax.pcolormesh(X, Y, C, cmap=cmap, shading='auto')

    # Add infinity symbol
    t = np.linspace(0, 2*np.pi, 1000)
    x = 0.5 * np.sin(t)
    y = 0.3 * np.sin(t) * np.cos(t)
    ax.plot(x, y, color='white', linewidth=5, alpha=0.9)

    # Add text
    ax.text(0, 0.5, "OMNI", color='white', fontsize=50,
            ha='center', va='center', weight='bold')
    ax.text(0, -0.2, "ALPHA VΩ∞∞", color='white', fontsize=20,
            ha='center', va='center', weight='bold')

    # Save the logo
    plt.savefig(os.path.join(IMAGE_DIR, filename), dpi=100,
                bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close()

    return os.path.join(IMAGE_DIR, filename)

# Function to generate agent network diagram
def generate_agent_network(filename, size=(1000, 800)):
    """Generate a network diagram of OMNI agents"""
    # Create a directed graph
    G = nx.DiGraph()

    # Add nodes for different components
    # Central node
    G.add_node("OMNI Core", type="core")

    # Agent nodes
    agents = ["Ghost Trader", "Memory Node", "Macro Sentinel",
              "Micro Analyzer", "Risk Manager"]
    for agent in agents:
        G.add_node(agent, type="agent")
        G.add_edge("OMNI Core", agent)

    # Quantum components
    quantum = ["Quantum Predictor", "Quantum Entanglement",
               "Hyperdimensional Computing", "Spectral Tree Engine"]
    for comp in quantum:
        G.add_node(comp, type="quantum")
        G.add_edge("OMNI Core", comp)

    # Trading components
    trading = ["Zero-Loss Enforcer", "Position Sizing",
               "Entry/Exit Logic", "Technical Indicators"]
    for comp in trading:
        G.add_node(comp, type="trading")
        G.add_edge("OMNI Core", comp)

    # External interfaces
    interfaces = ["Exchange API", "Market Data", "Dashboard", "News Feed"]
    for interface in interfaces:
        G.add_node(interface, type="interface")
        G.add_edge("OMNI Core", interface)

    # Add some cross-connections
    G.add_edge("Ghost Trader", "Zero-Loss Enforcer")
    G.add_edge("Memory Node", "Quantum Predictor")
    G.add_edge("Macro Sentinel", "Quantum Entanglement")
    G.add_edge("Micro Analyzer", "Technical Indicators")
    G.add_edge("Risk Manager", "Position Sizing")
    G.add_edge("Quantum Predictor", "Entry/Exit Logic")
    G.add_edge("Hyperdimensional Computing", "Memory Node")
    G.add_edge("Spectral Tree Engine", "Ghost Trader")
    G.add_edge("Exchange API", "Market Data")
    G.add_edge("Market Data", "Technical Indicators")

    # Create figure
    plt.figure(figsize=(size[0]/100, size[1]/100), dpi=100)

    # Define node colors based on type
    color_map = {
        "core": OMNI_COLORS['dark_blue'],
        "agent": OMNI_COLORS['light_blue'],
        "quantum": OMNI_COLORS['purple'],
        "trading": OMNI_COLORS['green'],
        "interface": OMNI_COLORS['red']
    }

    # Get node colors
    node_colors = [color_map[G.nodes[node]['type']] for node in G.nodes()]

    # Define node sizes
    node_sizes = [1500 if G.nodes[node]['type'] == 'core' else 1000 for node in G.nodes()]

    # Create layout
    pos = nx.spring_layout(G, k=0.3, iterations=50, seed=42)

    # Draw the graph
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes, alpha=0.8)
    nx.draw_networkx_edges(G, pos, width=1.5, alpha=0.7, edge_color='gray', arrows=True,
                          arrowsize=15, connectionstyle='arc3,rad=0.1')
    nx.draw_networkx_labels(G, pos, font_size=10, font_color='white', font_weight='bold')

    # Add legend
    legend_elements = [
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color_map['core'],
                  markersize=15, label='Core System'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color_map['agent'],
                  markersize=15, label='Agent Network'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color_map['quantum'],
                  markersize=15, label='Quantum Components'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color_map['trading'],
                  markersize=15, label='Trading Logic'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color_map['interface'],
                  markersize=15, label='External Interfaces')
    ]
    plt.legend(handles=legend_elements, loc='lower center', ncol=5,
              bbox_to_anchor=(0.5, -0.1))

    # Remove axes
    plt.axis('off')
    plt.tight_layout()

    # Save the figure
    plt.savefig(os.path.join(IMAGE_DIR, filename), dpi=100,
                bbox_inches='tight', pad_inches=0.5)
    plt.close()

    return os.path.join(IMAGE_DIR, filename)

# Function to generate the architecture mindmap
def generate_mindmap(logo_path, bg_path):
    """Generate a comprehensive architecture mindmap of the OMNI system"""
    print("  Creating mindmap PDF...")

    # Create the document
    doc = SimpleDocTemplate(
        "omni_mindmap.pdf",
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Add custom styles
    # Check if styles already exist before adding them
    if 'Heading0' not in styles:
        styles.add(ParagraphStyle(
            name='Heading0',
            parent=styles['Heading1'],
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=20
        ))

    if 'BodyText' not in styles:
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['Normal'],
            fontSize=10,
            leading=12,
            alignment=TA_LEFT
        ))

    if 'Caption' not in styles:
        styles.add(ParagraphStyle(
            name='Caption',
            parent=styles['BodyText'],
            fontSize=9,
            leading=11,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        ))

    # Create story (content)
    story = []

    # Add title
    story.append(Paragraph("OMNI-ALPHA VΩ∞∞ Architecture Mindmap", styles['Heading0']))
    story.append(Spacer(1, 0.2*inch))

    # Create and add comprehensive mindmap visualization
    def create_comprehensive_mindmap():
        """Create a comprehensive mindmap of the OMNI architecture"""
        img_path = os.path.join(IMAGE_DIR, 'comprehensive_mindmap.png')

        # Create figure with large size for detailed mindmap
        fig, ax = plt.subplots(figsize=(15, 10), dpi=150)

        # Create a light background
        ax.set_facecolor((0.98, 0.98, 1.0))

        # Define the main components and their subcomponents
        components = {
            "OMNI Core": {
                "pos": (0.5, 0.5),
                "color": OMNI_COLORS['dark_blue'],
                "size": 0.1,
                "subcomponents": [
                    "Message Bus",
                    "Agent Orchestrator",
                    "System State Manager",
                    "Configuration Manager",
                    "Logging System"
                ]
            },
            "Agent Network": {
                "pos": (0.25, 0.7),
                "color": OMNI_COLORS['light_blue'],
                "size": 0.08,
                "subcomponents": [
                    "Ghost Trader",
                    "Memory Node",
                    "Macro Sentinel",
                    "Micro Analyzer",
                    "Risk Manager",
                    "Pattern Recognizer",
                    "Trend Analyzer"
                ]
            },
            "Quantum Components": {
                "pos": (0.75, 0.7),
                "color": OMNI_COLORS['purple'],
                "size": 0.08,
                "subcomponents": [
                    "Quantum Predictor",
                    "Quantum Entanglement",
                    "Hyperdimensional Computing",
                    "Spectral Tree Engine",
                    "Quantum Entropy Analyzer",
                    "Quantum Coherence Detector"
                ]
            },
            "Trading Logic": {
                "pos": (0.25, 0.3),
                "color": OMNI_COLORS['green'],
                "size": 0.08,
                "subcomponents": [
                    "Zero-Loss Enforcer",
                    "Position Sizing",
                    "Entry/Exit Logic",
                    "Technical Indicators",
                    "Risk/Reward Calculator",
                    "Trade Validator",
                    "Profit Maximizer"
                ]
            },
            "Exchange Interface": {
                "pos": (0.75, 0.3),
                "color": OMNI_COLORS['red'],
                "size": 0.08,
                "subcomponents": [
                    "API Connector",
                    "Order Manager",
                    "Market Data Fetcher",
                    "Rate Limiter",
                    "Error Handler",
                    "Authentication Manager"
                ]
            },
            "User Interface": {
                "pos": (0.9, 0.5),
                "color": OMNI_COLORS['gold'],
                "size": 0.08,
                "subcomponents": [
                    "Dashboard",
                    "Trade Visualizer",
                    "Performance Metrics",
                    "Configuration Panel",
                    "Alert System"
                ]
            },
            "Data Storage": {
                "pos": (0.1, 0.5),
                "color": OMNI_COLORS['teal'],
                "size": 0.08,
                "subcomponents": [
                    "Trade History",
                    "Market Data",
                    "System Logs",
                    "Performance Metrics",
                    "Configuration Data"
                ]
            }
        }

        # Draw main components
        for name, component in components.items():
            # Draw component circle
            circle = plt.Circle(component["pos"], component["size"], color=component["color"], alpha=0.8)
            ax.add_patch(circle)

            # Add component name
            ax.text(component["pos"][0], component["pos"][1], name,
                   ha='center', va='center', color='white', fontweight='bold', fontsize=12)

            # Calculate positions for subcomponents
            n_subcomponents = len(component["subcomponents"])
            radius = component["size"] * 2.5  # Distance from main component

            # Determine angle range based on position relative to center
            center_x, center_y = 0.5, 0.5
            angle_to_center = np.arctan2(component["pos"][1] - center_y, component["pos"][0] - center_x)

            # Adjust angle range to point away from center
            if name == "OMNI Core":
                # For core, distribute subcomponents in a full circle
                start_angle = 0
                end_angle = 2 * np.pi
            else:
                # For other components, distribute in a semicircle pointing away from center
                start_angle = angle_to_center - np.pi/2
                end_angle = angle_to_center + np.pi/2

            angles = np.linspace(start_angle, end_angle, n_subcomponents)

            # Draw subcomponents
            for i, (subcomponent, angle) in enumerate(zip(component["subcomponents"], angles)):
                # Calculate position
                x = component["pos"][0] + radius * np.cos(angle)
                y = component["pos"][1] + radius * np.sin(angle)

                # Draw subcomponent circle
                subcircle = plt.Circle((x, y), component["size"] * 0.6, color=component["color"], alpha=0.6)
                ax.add_patch(subcircle)

                # Add subcomponent name
                ax.text(x, y, subcomponent, ha='center', va='center',
                       color='black', fontsize=8, fontweight='bold',
                       bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.1'))

                # Draw connection to main component
                ax.plot([component["pos"][0], x], [component["pos"][1], y],
                       color=component["color"], alpha=0.6, linewidth=1.5)

        # Draw connections between main components
        connections = [
            ("OMNI Core", "Agent Network"),
            ("OMNI Core", "Quantum Components"),
            ("OMNI Core", "Trading Logic"),
            ("OMNI Core", "Exchange Interface"),
            ("OMNI Core", "User Interface"),
            ("OMNI Core", "Data Storage"),
            ("Agent Network", "Trading Logic"),
            ("Quantum Components", "Trading Logic"),
            ("Trading Logic", "Exchange Interface"),
            ("Data Storage", "Agent Network"),
            ("User Interface", "Data Storage")
        ]

        for comp1, comp2 in connections:
            # Draw connection
            ax.plot([components[comp1]["pos"][0], components[comp2]["pos"][0]],
                   [components[comp1]["pos"][1], components[comp2]["pos"][1]],
                   color='gray', alpha=0.4, linewidth=2, linestyle='--')

            # Add flow indicators
            mid_x = (components[comp1]["pos"][0] + components[comp2]["pos"][0]) / 2
            mid_y = (components[comp1]["pos"][1] + components[comp2]["pos"][1]) / 2

            # Add a small glow effect
            glow = plt.Circle((mid_x, mid_y), 0.015, color='white', alpha=0.7)
            ax.add_patch(glow)

        # Add detailed descriptions for key components
        descriptions = {
            "OMNI Core": "Central coordination system\nOrchestrates all components\nManages system state",
            "Agent Network": "Specialized AI agents\nCollaborative decision-making\nAdaptive learning",
            "Quantum Components": "Quantum-inspired algorithms\nProbabilistic prediction\nPattern recognition",
            "Trading Logic": "Trade execution rules\nRisk management\nProfit optimization",
            "Exchange Interface": "API communication\nOrder management\nMarket data access",
            "User Interface": "Performance monitoring\nConfiguration\nVisualization",
            "Data Storage": "Historical data\nSystem logs\nPerformance metrics"
        }

        for name, desc in descriptions.items():
            component = components[name]

            # Calculate position for description
            angle_to_center = np.arctan2(component["pos"][1] - 0.5, component["pos"][0] - 0.5)
            desc_distance = component["size"] * 1.2
            desc_x = component["pos"][0] + desc_distance * np.cos(angle_to_center)
            desc_y = component["pos"][1] + desc_distance * np.sin(angle_to_center)

            # Add description
            if name == "OMNI Core":
                # For core, place description inside the circle
                ax.text(component["pos"][0], component["pos"][1] - 0.02, desc,
                       ha='center', va='center', color='white', fontsize=6,
                       linespacing=0.8)
            else:
                # For other components, place description nearby
                ax.text(desc_x, desc_y, desc,
                       ha='center', va='center', color=component["color"], fontsize=7,
                       linespacing=0.8,
                       bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.1'))

        # Add title
        ax.text(0.5, 0.95, "OMNI-ALPHA VΩ∞∞ Comprehensive Architecture",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=18, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Add subtitle
        ax.text(0.5, 0.9, "A Multi-Agent, Quantum-Inspired Trading System",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=14,
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=150, bbox_inches='tight')
        plt.close()

        return img_path

    # Add comprehensive mindmap
    mindmap_img_path = create_comprehensive_mindmap()
    mindmap_img = RLImage(mindmap_img_path, width=9*inch, height=6*inch)
    story.append(mindmap_img)
    story.append(Paragraph("Figure 1: OMNI-ALPHA VΩ∞∞ Comprehensive Architecture Mindmap", styles['Caption']))
    story.append(Spacer(1, 0.3*inch))

    # Add component descriptions
    story.append(Paragraph("Component Descriptions", styles['Heading2']))

    # Create component descriptions
    component_descriptions = [
        {"name": "OMNI Core", "desc": """The central coordination system that orchestrates all components and manages the system state.
        It includes the Message Bus for communication, Agent Orchestrator for coordination, System State Manager for maintaining system state,
        Configuration Manager for handling settings, and Logging System for tracking system activities."""},

        {"name": "Agent Network", "desc": """A collaborative network of specialized AI agents, each with unique capabilities.
        Includes Ghost Trader for trade simulation, Memory Node for learning from past trades, Macro Sentinel for monitoring economic events,
        Micro Analyzer for short-term analysis, Risk Manager for risk control, Pattern Recognizer for identifying market patterns,
        and Trend Analyzer for identifying market trends."""},

        {"name": "Quantum Components", "desc": """Implements quantum-inspired algorithms for prediction and pattern recognition.
        Includes Quantum Predictor for forecasting price movements, Quantum Entanglement for identifying asset correlations,
        Hyperdimensional Computing for high-dimensional pattern recognition, Spectral Tree Engine for simulating price paths,
        Quantum Entropy Analyzer for measuring uncertainty, and Quantum Coherence Detector for identifying stable patterns."""},

        {"name": "Trading Logic", "desc": """Handles the execution of trading strategies and risk management.
        Includes Zero-Loss Enforcer for preventing capital loss, Position Sizing for determining trade size,
        Entry/Exit Logic for determining when to enter and exit trades, Technical Indicators for market analysis,
        Risk/Reward Calculator for evaluating trade potential, Trade Validator for verifying trade viability,
        and Profit Maximizer for optimizing trade outcomes."""},

        {"name": "Exchange Interface", "desc": """Manages communication with cryptocurrency exchanges.
        Includes API Connector for interfacing with exchange APIs, Order Manager for handling orders,
        Market Data Fetcher for retrieving market data, Rate Limiter for managing API rate limits,
        Error Handler for managing API errors, and Authentication Manager for handling API authentication."""},

        {"name": "User Interface", "desc": """Provides visualization and control for the user.
        Includes Dashboard for system overview, Trade Visualizer for displaying trades,
        Performance Metrics for tracking system performance, Configuration Panel for system settings,
        and Alert System for notifying the user of important events."""},

        {"name": "Data Storage", "desc": """Manages the storage and retrieval of system data.
        Includes Trade History for storing past trades, Market Data for storing historical market data,
        System Logs for tracking system activities, Performance Metrics for storing system performance data,
        and Configuration Data for storing system settings."""}
    ]

    # Add component descriptions
    for component in component_descriptions:
        # Create a mini-header for the component
        component_header = Paragraph(component["name"], styles['Heading3'])
        component_desc = Paragraph(component["desc"], styles['BodyText'])

        # Add to story
        story.append(component_header)
        story.append(component_desc)
        story.append(Spacer(1, 0.1*inch))

    # Add data flow section
    story.append(Paragraph("Data Flow and Interactions", styles['Heading2']))

    data_flow_text = """The OMNI system components interact through a sophisticated message bus that enables asynchronous
    communication and coordination. Key data flows include:

    • Market data from Exchange Interface to Quantum Components and Trading Logic
    • Predictions from Quantum Components to Agent Network and Trading Logic
    • Trade decisions from Agent Network to Trading Logic
    • Trade execution from Trading Logic to Exchange Interface
    • Performance metrics from all components to Data Storage
    • Visualization data from all components to User Interface

    This architecture allows for parallel processing, decentralized decision-making with centralized coordination,
    fault tolerance through redundancy and isolation, and scalability through modular design."""

    story.append(Paragraph(data_flow_text, styles['BodyText']))

    # Build the document
    doc.build(story)
    print("  Mindmap saved as omni_mindmap.pdf")

    # Move the file to the docs directory
    os.rename("omni_mindmap.pdf", os.path.join(os.path.dirname(os.path.abspath(__file__)), "omni_mindmap.pdf"))

# Function to generate the user-friendly overview
def generate_overview(logo_path, bg_path, agent_network_path):
    """Generate a user-friendly overview of the OMNI system with visuals"""
    print("  Creating overview PDF...")

    # Create the document
    doc = SimpleDocTemplate(
        "omni_overview.pdf",
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Add custom styles
    # Check if styles already exist before adding them
    if 'Heading0' not in styles:
        styles.add(ParagraphStyle(
            name='Heading0',
            parent=styles['Heading1'],
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=20
        ))

    if 'BodyText' not in styles:
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            alignment=TA_JUSTIFY
        ))

    if 'BodyTextIndent' not in styles:
        styles.add(ParagraphStyle(
            name='BodyTextIndent',
            parent=styles['BodyText'],
            leftIndent=20
        ))

    if 'Caption' not in styles:
        styles.add(ParagraphStyle(
            name='Caption',
            parent=styles['BodyText'],
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        ))

    if 'BoxTitle' not in styles:
        styles.add(ParagraphStyle(
            name='BoxTitle',
            parent=styles['Heading3'],
            fontSize=14,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.white
        ))

    if 'BoxText' not in styles:
        styles.add(ParagraphStyle(
            name='BoxText',
            parent=styles['BodyText'],
            fontSize=10,
            leading=12,
            alignment=TA_LEFT
        ))

    # Create story (content)
    story = []

    # Add logo
    logo = RLImage(logo_path, width=2*inch, height=2*inch)
    story.append(logo)

    # Add title
    story.append(Paragraph("OMNI-ALPHA VΩ∞∞", styles['Heading0']))
    story.append(Paragraph("Revolutionary AI Trading System", styles['Heading2']))
    story.append(Paragraph("Overview & Opportunity", styles['Heading3']))
    story.append(Spacer(1, 0.5*inch))

    # Add info box for "What is OMNI?"
    def create_info_box(title, content, color):
        """Create a styled information box"""
        box_style = TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), color),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
            ('ALIGNMENT', (0, 0), (0, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, 0), 14),
            ('BOTTOMPADDING', (0, 0), (0, 0), 8),
            ('BACKGROUND', (0, 1), (0, 1), colors.white),
            ('BOX', (0, 0), (0, 1), 1, colors.black),
            ('GRID', (0, 0), (0, 1), 0.5, colors.black),
        ])

        # Create the table
        title_data = [[title]]
        title_table = Table(title_data, colWidths=[6*inch])
        title_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), color),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
            ('ALIGNMENT', (0, 0), (0, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, 0), 14),
            ('BOTTOMPADDING', (0, 0), (0, 0), 8),
        ]))

        # Create content paragraph
        content_para = Paragraph(content, styles['BodyText'])
        content_data = [[content_para]]
        content_table = Table(content_data, colWidths=[6*inch])
        content_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.white),
            ('ALIGNMENT', (0, 0), (0, 0), 'LEFT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica'),
            ('FONTSIZE', (0, 0), (0, 0), 11),
            ('TOPPADDING', (0, 0), (0, 0), 10),
            ('BOTTOMPADDING', (0, 0), (0, 0), 10),
            ('LEFTPADDING', (0, 0), (0, 0), 15),
            ('RIGHTPADDING', (0, 0), (0, 0), 15),
        ]))

        return [title_table, content_table, Spacer(1, 0.2*inch)]

    # Add "What is OMNI?" info box
    what_is_omni = """OMNI-ALPHA VΩ∞∞ is a revolutionary trading system that combines artificial intelligence,
    quantum computing principles, and multi-agent collaboration to achieve consistent profitability
    in cryptocurrency markets. Starting with minimal capital, OMNI can generate steady profits through
    intelligent trading strategies that adapt and improve over time."""

    story.extend(create_info_box("What is OMNI?", what_is_omni, colors.HexColor("#0066CC")))

    # Add introduction section
    story.append(Paragraph("Introduction to OMNI", styles['Heading1']))

    # Create and add concept visualization
    def create_concept_viz():
        """Create a concept visualization for the overview"""
        img_path = os.path.join(IMAGE_DIR, 'omni_concept.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 5), dpi=100)

        # Create a gradient background
        x = np.linspace(0, 1, 100)
        y = np.linspace(0, 1, 100)
        X, Y = np.meshgrid(x, y)

        # Create a blue gradient
        Z = Y  # Gradient from bottom to top

        # Plot with custom colormap
        colors_bg = [(0.9, 0.95, 1), (0.7, 0.85, 1), (0.5, 0.7, 0.9)]
        cmap_bg = matplotlib.colors.LinearSegmentedColormap.from_list("OmniBackground", colors_bg)
        ax.pcolormesh(X, Y, Z, cmap=cmap_bg, shading='auto')

        # Add nodes for different components
        nodes = [
            {"name": "Quantum\nPredictor", "pos": (0.3, 0.7), "size": 0.1, "color": OMNI_COLORS['purple']},
            {"name": "Ghost\nTrader", "pos": (0.7, 0.7), "size": 0.1, "color": OMNI_COLORS['light_blue']},
            {"name": "Memory\nNode", "pos": (0.5, 0.5), "size": 0.12, "color": OMNI_COLORS['dark_blue']},
            {"name": "Macro\nSentinel", "pos": (0.3, 0.3), "size": 0.1, "color": OMNI_COLORS['gold']},
            {"name": "Zero Loss\nEnforcer", "pos": (0.7, 0.3), "size": 0.1, "color": OMNI_COLORS['green']}
        ]

        # Draw nodes
        for node in nodes:
            circle = plt.Circle(node["pos"], node["size"], color=node["color"], alpha=0.8)
            ax.add_patch(circle)
            ax.text(node["pos"][0], node["pos"][1], node["name"],
                   ha='center', va='center', color='white', fontweight='bold', fontsize=10)

        # Draw connections between nodes
        for i, node1 in enumerate(nodes):
            for j, node2 in enumerate(nodes):
                if i < j:  # Avoid duplicate connections
                    # Draw a curved connection
                    ax.plot([node1["pos"][0], node2["pos"][0]],
                           [node1["pos"][1], node2["pos"][1]],
                           color='white', alpha=0.5, linewidth=2)

                    # Add some "data flow" effects
                    mid_x = (node1["pos"][0] + node2["pos"][0]) / 2
                    mid_y = (node1["pos"][1] + node2["pos"][1]) / 2

                    # Add a small glow effect
                    glow = plt.Circle((mid_x, mid_y), 0.02, color='white', alpha=0.7)
                    ax.add_patch(glow)

        # Add title
        ax.text(0.5, 0.9, "OMNI Multi-Agent Trading System",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=16, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Add subtitle
        ax.text(0.5, 0.1, "Collaborative Intelligence for Optimal Trading Decisions",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=12, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add concept visualization
    concept_img_path = create_concept_viz()
    concept_img = RLImage(concept_img_path, width=4*inch, height=2.5*inch)

    # Create a table with text and image side by side
    intro_text = """OMNI-ALPHA VΩ∞∞ represents a breakthrough in trading technology. Unlike traditional trading systems
    that rely on fixed rules or simple algorithms, OMNI is a self-evolving, AI-governed trading intelligence that
    learns and improves with every trade.

    The system starts with minimal capital and employs sophisticated strategies to grow this capital exponentially
    over time. By combining quantum-inspired prediction algorithms, multi-agent collaboration, and zero-loss
    enforcement mechanisms, OMNI achieves consistent profitability while minimizing risk."""

    intro_para = Paragraph(intro_text, styles['BodyText'])

    # Create a table with text and image
    intro_table_data = [[intro_para, concept_img]]
    intro_table = Table(intro_table_data, colWidths=[3*inch, 4*inch])
    intro_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (1, 0), 'TOP'),
        ('RIGHTPADDING', (0, 0), (0, 0), 10),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
    ]))

    story.append(intro_table)
    story.append(Spacer(1, 0.3*inch))

    # Add key features section
    story.append(Paragraph("Key Features", styles['Heading2']))

    # Create bullet points for key features
    key_features = [
        "<b>Minimal Starting Capital:</b> Begin with minimal capital",
        "<b>Zero-Loss Protection:</b> Advanced mechanisms to prevent capital loss",
        "<b>Self-Learning:</b> Continuously improves from trading experience",
        "<b>Quantum-Inspired:</b> Uses quantum computing principles for prediction",
        "<b>Multi-Agent System:</b> Specialized AI agents working together",
        "<b>Fully Automated:</b> Operates 24/7 without human intervention"
    ]

    for feature in key_features:
        story.append(Paragraph("• " + feature, styles['BodyTextIndent']))

    # Add "Did You Know?" box
    did_you_know = """OMNI can execute hundreds of trades per day, with each trade carefully analyzed and validated
    before execution. This high-frequency approach allows for rapid capital growth even from a small starting amount."""

    story.extend(create_info_box("Did You Know?", did_you_know, colors.HexColor("#009933")))

    story.append(PageBreak())

    # Add "How OMNI Works" section
    story.append(Paragraph("How OMNI Works", styles['Heading1']))

    how_it_works_text = """OMNI operates through a sophisticated system of specialized AI agents, each with unique
    capabilities and responsibilities. These agents work together to analyze markets, identify opportunities,
    execute trades, and learn from results."""
    story.append(Paragraph(how_it_works_text, styles['BodyText']))

    # Add multi-agent ecosystem subsection
    story.append(Paragraph("The Multi-Agent Ecosystem", styles['Heading2']))

    # Create and add agent ecosystem visualization
    def create_agent_ecosystem_viz():
        """Create a visualization of the agent ecosystem"""
        img_path = os.path.join(IMAGE_DIR, 'agent_ecosystem.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Create a circular layout for agents
        n_agents = 5
        radius = 0.35
        center = (0.5, 0.5)

        # Define agents
        agents = [
            {"name": "Ghost Trader", "desc": "Simulates trades before execution", "color": OMNI_COLORS['light_blue']},
            {"name": "Memory Node", "desc": "Stores and learns from trading history", "color": OMNI_COLORS['dark_blue']},
            {"name": "Macro Sentinel", "desc": "Monitors global economic events", "color": OMNI_COLORS['gold']},
            {"name": "Quantum Predictor", "desc": "Forecasts price movements", "color": OMNI_COLORS['purple']},
            {"name": "Zero Loss Enforcer", "desc": "Ensures no trades result in capital loss", "color": OMNI_COLORS['green']}
        ]

        # Calculate positions on the circle
        for i, agent in enumerate(agents):
            angle = 2 * np.pi * i / n_agents
            x = center[0] + radius * np.cos(angle)
            y = center[1] + radius * np.sin(angle)
            agent["pos"] = (x, y)

        # Draw central hub
        central_circle = plt.Circle(center, 0.15, color=OMNI_COLORS['dark_blue'], alpha=0.8)
        ax.add_patch(central_circle)
        ax.text(center[0], center[1], "OMNI\nCore", ha='center', va='center',
               color='white', fontweight='bold', fontsize=12)

        # Draw agents and connections
        for agent in agents:
            # Draw agent circle
            agent_circle = plt.Circle(agent["pos"], 0.1, color=agent["color"], alpha=0.8)
            ax.add_patch(agent_circle)

            # Draw agent name
            ax.text(agent["pos"][0], agent["pos"][1], agent["name"], ha='center', va='center',
                   color='white', fontweight='bold', fontsize=10)

            # Draw description
            # Calculate position outside the circle
            angle = np.arctan2(agent["pos"][1] - center[1], agent["pos"][0] - center[0])
            desc_x = agent["pos"][0] + 0.15 * np.cos(angle)
            desc_y = agent["pos"][1] + 0.15 * np.sin(angle)

            ax.text(desc_x, desc_y, agent["desc"], ha='center', va='center',
                   color=agent["color"], fontsize=9, fontweight='bold',
                   bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

            # Draw connection to center
            ax.plot([center[0], agent["pos"][0]], [center[1], agent["pos"][1]],
                   color=agent["color"], alpha=0.6, linewidth=2)

            # Add some "data flow" effects
            for _ in range(3):
                # Random position along the connection line
                t = np.random.uniform(0.3, 0.7)
                flow_x = center[0] + t * (agent["pos"][0] - center[0])
                flow_y = center[1] + t * (agent["pos"][1] - center[1])

                # Add a small glow effect
                glow = plt.Circle((flow_x, flow_y), 0.02, color=agent["color"], alpha=0.7)
                ax.add_patch(glow)

        # Add title
        ax.text(0.5, 0.95, "OMNI Multi-Agent Ecosystem",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=16, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add agent ecosystem visualization
    agent_eco_img_path = create_agent_ecosystem_viz()
    agent_eco_img = RLImage(agent_eco_img_path, width=5*inch, height=3.75*inch)
    story.append(agent_eco_img)
    story.append(Paragraph("Figure 1: OMNI Multi-Agent Ecosystem", styles['Caption']))
    story.append(Spacer(1, 0.3*inch))

    # Add quantum-inspired intelligence subsection
    story.append(Paragraph("Quantum-Inspired Intelligence", styles['Heading2']))

    quantum_text = """While today's quantum computers are still in early stages, OMNI implements quantum-inspired
    algorithms that capture many of the advantages of quantum computing:"""
    story.append(Paragraph(quantum_text, styles['BodyText']))

    # Create bullet points for quantum features
    quantum_features = [
        "<b>Superposition:</b> Considering multiple possible market scenarios simultaneously",
        "<b>Entanglement:</b> Identifying correlations between different assets",
        "<b>Interference:</b> Amplifying profitable patterns and canceling noise",
        "<b>Hyperdimensional Computing:</b> Processing market data in 10,000+ dimensions"
    ]

    for feature in quantum_features:
        story.append(Paragraph("• " + feature, styles['BodyTextIndent']))

    # Create and add quantum prediction visualization
    def create_quantum_prediction_simple_viz():
        """Create a simplified visualization of quantum prediction for the overview"""
        img_path = os.path.join(IMAGE_DIR, 'quantum_prediction_simple.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 4), dpi=100)

        # Generate historical price data
        x_hist = np.arange(0, 50)
        y_hist = 50 + 10 * np.sin(x_hist / 10) + np.random.normal(0, 2, len(x_hist))

        # Generate prediction data
        x_pred = np.arange(50, 100)

        # Main prediction path
        y_pred_main = y_hist[-1] + 5 * np.sin((x_pred - 50) / 10) + (x_pred - 50) * 0.1

        # Alternative paths with different probabilities
        y_pred_alt1 = y_hist[-1] + 3 * np.sin((x_pred - 50) / 8) - (x_pred - 50) * 0.05
        y_pred_alt2 = y_hist[-1] + 7 * np.sin((x_pred - 50) / 12) + (x_pred - 50) * 0.2

        # Plot historical data
        ax.plot(x_hist, y_hist, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Historical Price')

        # Plot prediction paths
        ax.plot(x_pred, y_pred_main, color=OMNI_COLORS['green'], linewidth=2,
                label='Primary Path (60%)')
        ax.fill_between(x_pred, y_pred_main - 3, y_pred_main + 3,
                       color=OMNI_COLORS['green'], alpha=0.2)

        ax.plot(x_pred, y_pred_alt1, color=OMNI_COLORS['orange'], linewidth=2,
                label='Alternative Path 1 (30%)')
        ax.fill_between(x_pred, y_pred_alt1 - 4, y_pred_alt1 + 4,
                       color=OMNI_COLORS['orange'], alpha=0.2)

        ax.plot(x_pred, y_pred_alt2, color=OMNI_COLORS['red'], linewidth=2,
                label='Alternative Path 2 (10%)')
        ax.fill_between(x_pred, y_pred_alt2 - 5, y_pred_alt2 + 5,
                       color=OMNI_COLORS['red'], alpha=0.2)

        # Add vertical line separating history from prediction
        ax.axvline(x=50, color='black', linestyle='--', alpha=0.5, label='Present')

        # Add quantum effects
        for i in range(10):
            x = np.random.uniform(50, 100)
            y = np.random.uniform(30, 70)
            size = np.random.uniform(20, 100)
            alpha = np.random.uniform(0.05, 0.2)
            ax.add_patch(plt.Circle((x, y), size, color=OMNI_COLORS['purple'], alpha=alpha))

        # Add labels and legend
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Quantum-Inspired Price Prediction', fontsize=14)
        ax.legend(loc='upper left')
        ax.grid(True, alpha=0.3)

        # Add annotation for quantum superposition
        ax.annotate('Quantum Superposition\nof Possible Futures',
                   xy=(75, 65), xytext=(60, 80),
                   arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8, alpha=0.7))

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add quantum prediction visualization
    quantum_pred_simple_img_path = create_quantum_prediction_simple_viz()
    quantum_pred_simple_img = RLImage(quantum_pred_simple_img_path, width=6*inch, height=3*inch)
    story.append(quantum_pred_simple_img)
    story.append(Paragraph("Figure 2: Quantum-Inspired Price Prediction", styles['Caption']))

    # Add trading process subsection
    story.append(Paragraph("The Trading Process", styles['Heading2']))

    process_text = """OMNI follows a systematic process for each trade:"""
    story.append(Paragraph(process_text, styles['BodyText']))

    # Create numbered list for trading process
    trading_process = [
        "<b>Market Analysis:</b> Scanning all available assets for opportunities",
        "<b>Opportunity Identification:</b> Using quantum prediction to find high-probability setups",
        "<b>Risk Assessment:</b> Evaluating potential risks and rewards",
        "<b>Simulation:</b> Testing the trade in a virtual environment",
        "<b>Execution:</b> Placing the trade with precise entry, stop-loss, and take-profit levels",
        "<b>Monitoring:</b> Actively managing the trade to maximize profit",
        "<b>Learning:</b> Storing the trade outcome in memory for future improvement"
    ]

    for i, step in enumerate(trading_process):
        story.append(Paragraph(f"{i+1}. {step}", styles['BodyTextIndent']))

    # Add zero-loss protection box
    zero_loss_text = """OMNI's Zero-Loss Enforcer ensures that no trade results in a loss by implementing sophisticated
    risk management techniques, including dynamic stop-loss adjustment, break-even stop movement, and early exit
    when conditions change."""

    story.extend(create_info_box("Zero-Loss Protection", zero_loss_text, colors.HexColor("#0066CC")))

    story.append(PageBreak())

    # Add "Getting Started" section
    story.append(Paragraph("Getting Started with OMNI", styles['Heading1']))

    getting_started_text = """Starting with OMNI is remarkably simple. The system is designed to be accessible to
    traders of all experience levels, from beginners to professionals."""
    story.append(Paragraph(getting_started_text, styles['BodyText']))

    # Create and add getting started visualization
    def create_getting_started_viz():
        """Create a visualization of the getting started process"""
        img_path = os.path.join(IMAGE_DIR, 'getting_started.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 4), dpi=100)

        # Define steps
        steps = [
            {"name": "Setup", "desc": "Deploy OMNI on your server", "icon": "🔧"},
            {"name": "Connect", "desc": "Link to your exchange", "icon": "🔗"},
            {"name": "Fund", "desc": "Add minimal capital", "icon": "💰"},
            {"name": "Activate", "desc": "Start the system", "icon": "▶️"},
            {"name": "Monitor", "desc": "Watch it grow", "icon": "📈"}
        ]

        # Create a horizontal flow
        n_steps = len(steps)
        step_positions = np.linspace(0.1, 0.9, n_steps)

        # Draw flow
        ax.plot([0.05, 0.95], [0.5, 0.5], 'k-', linewidth=2, alpha=0.7)

        # Add arrow heads along the line
        for i in range(1, n_steps):
            pos = (step_positions[i-1] + step_positions[i]) / 2
            ax.annotate('', xy=(pos + 0.03, 0.5), xytext=(pos - 0.03, 0.5),
                       arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8, alpha=0.7))

        # Add steps
        for i, (pos, step) in enumerate(zip(step_positions, steps)):
            # Add step circle
            circle = plt.Circle((pos, 0.5), 0.08, color=OMNI_COLORS['dark_blue'], alpha=0.8)
            ax.add_patch(circle)

            # Add step number and icon
            ax.text(pos, 0.5, f"{i+1}\n{step['icon']}", ha='center', va='center',
                   color='white', fontweight='bold', fontsize=12)

            # Add step name
            ax.text(pos, 0.65, step["name"], ha='center', va='center',
                   color=OMNI_COLORS['dark_blue'], fontweight='bold', fontsize=12)

            # Add step description
            ax.text(pos, 0.35, step["desc"], ha='center', va='center',
                   color=OMNI_COLORS['dark_blue'], fontsize=10)

        # Add title
        ax.text(0.5, 0.9, "Getting Started with OMNI",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=16, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add getting started visualization
    getting_started_img_path = create_getting_started_viz()
    getting_started_img = RLImage(getting_started_img_path, width=6*inch, height=3*inch)
    story.append(getting_started_img)
    story.append(Paragraph("Figure 3: Simple 5-Step Process to Get Started", styles['Caption']))
    story.append(Spacer(1, 0.3*inch))

    # Add detailed steps
    story.append(Paragraph("Detailed Steps", styles['Heading2']))

    # Create detailed steps with descriptions
    detailed_steps = [
        {"step": "System Setup", "desc": """Deploy the OMNI system on your server or cloud instance. The system is
        designed to run 24/7 with minimal resource requirements."""},

        {"step": "Exchange Connection", "desc": """Connect OMNI to your preferred cryptocurrency exchange using API
        keys. The system supports major exchanges including Binance, Bybit, and others."""},

        {"step": "Capital Allocation", "desc": """Fund your exchange account with minimal capital. OMNI is designed
        to start with a small amount and grow it organically through intelligent trading."""},

        {"step": "System Activation", "desc": """Start the OMNI system and monitor its performance through the
        intuitive dashboard. The system will begin analyzing markets and executing trades automatically."""},

        {"step": "Growth Monitoring", "desc": """Watch as your capital grows exponentially over time. The system
        provides detailed analytics and performance metrics to track your progress."""}
    ]

    # Add detailed steps
    for step in detailed_steps:
        # Create a mini-header for the step
        step_header = Paragraph(step["step"], styles['Heading3'])
        step_desc = Paragraph(step["desc"], styles['BodyText'])

        # Add to story
        story.append(step_header)
        story.append(step_desc)
        story.append(Spacer(1, 0.1*inch))

    # Add "Start Small, Grow Big" box
    start_small_text = """OMNI is designed to start with minimal capital and grow it exponentially over time.
    The system's intelligent trading strategies and zero-loss protection mechanisms ensure that your capital
    is preserved and grown efficiently."""

    story.extend(create_info_box("Start Small, Grow Big", start_small_text, colors.HexColor("#009933")))

    # Add conclusion
    story.append(Paragraph("Conclusion", styles['Heading1']))

    conclusion_text = """OMNI-ALPHA VΩ∞∞ represents the future of automated trading. By combining artificial
    intelligence, quantum-inspired algorithms, and multi-agent collaboration, OMNI achieves a level of
    sophistication and performance that was previously impossible.

    With its ability to start with minimal capital and grow it exponentially over time, OMNI makes profitable
    trading accessible to everyone. The system's self-evolving nature ensures that it will continue to improve
    and adapt to changing market conditions, providing consistent returns for years to come.

    Join the OMNI revolution today and experience the power of next-generation trading technology."""

    story.append(Paragraph(conclusion_text, styles['BodyText']))

    # Create and add final visualization
    def create_final_viz():
        """Create a final visualization for the conclusion"""
        img_path = os.path.join(IMAGE_DIR, 'omni_final.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 4), dpi=100)

        # Create a gradient background
        x = np.linspace(0, 1, 100)
        y = np.linspace(0, 1, 100)
        X, Y = np.meshgrid(x, y)

        # Create a radial gradient
        center_x, center_y = 0.5, 0.5
        R = np.sqrt((X - center_x)**2 + (Y - center_y)**2)
        Z = 1 - R  # Gradient from center outward

        # Plot with custom colormap
        colors_bg = [(0.9, 0.95, 1), (0.7, 0.85, 1), (0.5, 0.7, 0.9)]
        cmap_bg = matplotlib.colors.LinearSegmentedColormap.from_list("OmniFinal", colors_bg)
        ax.pcolormesh(X, Y, Z, cmap=cmap_bg, shading='auto')

        # Add OMNI logo in center
        logo_circle = plt.Circle((0.5, 0.5), 0.2, color=OMNI_COLORS['dark_blue'], alpha=0.8)
        ax.add_patch(logo_circle)

        # Add text in logo
        ax.text(0.5, 0.5, "OMNI\nVΩ∞∞", ha='center', va='center',
               color='white', fontweight='bold', fontsize=16)

        # Add glowing effects around the logo
        for i in range(20):
            radius = 0.2 + np.random.uniform(0.05, 0.3)
            alpha = 0.5 * (1 - (radius - 0.2) / 0.3)  # Fade out with distance
            glow = plt.Circle((0.5, 0.5), radius, color=OMNI_COLORS['light_blue'], alpha=alpha)
            ax.add_patch(glow)

        # Add tagline
        ax.text(0.5, 0.15, "The Future of Intelligent Trading",
               ha='center', va='center', color=OMNI_COLORS['dark_blue'],
               fontsize=14, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add final visualization
    final_img_path = create_final_viz()
    final_img = RLImage(final_img_path, width=5*inch, height=2.5*inch)
    story.append(Spacer(1, 0.3*inch))
    story.append(final_img)
    story.append(Spacer(1, 0.3*inch))

    # Add contact information
    contact_text = """For more information about OMNI-ALPHA VΩ∞∞, please contact us or visit our website."""
    story.append(Paragraph(contact_text, styles['BodyText']))

    # Build the document
    doc.build(story)
    print("  Overview saved as omni_overview.pdf")

    # Move the file to the docs directory
    os.rename("omni_overview.pdf", os.path.join(os.path.dirname(os.path.abspath(__file__)), "omni_overview.pdf"))

# Function to generate the whitepaper
def generate_whitepaper(logo_path, bg_path, agent_network_path):
    """Generate the comprehensive whitepaper with LaTeX equations and visuals"""
    print("  Creating whitepaper PDF...")

    # Create the document
    doc = SimpleDocTemplate(
        "omni_whitepaper.pdf",
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Add custom styles
    # Check if styles already exist before adding them
    if 'Heading0' not in styles:
        styles.add(ParagraphStyle(
            name='Heading0',
            parent=styles['Heading1'],
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=20
        ))

    if 'BodyText' not in styles:
        styles.add(ParagraphStyle(
            name='BodyText',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            alignment=TA_JUSTIFY
        ))

    if 'BodyTextIndent' not in styles:
        styles.add(ParagraphStyle(
            name='BodyTextIndent',
            parent=styles['BodyText'],
            leftIndent=20
        ))

    if 'Caption' not in styles:
        styles.add(ParagraphStyle(
            name='Caption',
            parent=styles['BodyText'],
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        ))

    # Create story (content)
    story = []

    # Add logo
    logo = RLImage(logo_path, width=2*inch, height=2*inch)
    story.append(logo)

    # Add title
    story.append(Paragraph("OMNI-ALPHA VΩ∞∞", styles['Heading0']))
    story.append(Paragraph("A Self-Evolving, AI-Governed, Sovereign Trading Intelligence System", styles['Heading2']))
    story.append(Paragraph("Technical Whitepaper", styles['Heading3']))
    story.append(Spacer(1, 0.5*inch))

    # Add abstract
    story.append(Paragraph("Abstract", styles['Heading1']))
    abstract = """The OMNI-ALPHA VΩ∞∞ Trading System represents a paradigm shift in automated trading technology,
    combining quantum-inspired algorithms, multi-agent AI systems, and zero-loss enforcement mechanisms.
    This whitepaper presents a comprehensive technical overview of the system's architecture, components,
    and innovative approaches to capital growth. Starting with minimal capital, OMNI employs sophisticated
    quantum prediction, hyperdimensional computing, and agent-based decision making to achieve consistent
    profitability while minimizing risk. The system's self-evolving nature allows it to adapt to changing
    market conditions, learn from past trades, and continuously improve its performance over time."""

    story.append(Paragraph(abstract, styles['BodyText']))
    story.append(Spacer(1, 0.5*inch))

    # Add table of contents placeholder
    story.append(Paragraph("Table of Contents", styles['Heading1']))
    story.append(Paragraph("(Table of contents will be generated automatically)", styles['BodyText']))
    story.append(PageBreak())

    # Add introduction section
    story.append(Paragraph("1. Introduction", styles['Heading1']))

    # Add vision and philosophy subsection
    story.append(Paragraph("1.1 Vision and Philosophy", styles['Heading2']))
    vision_text = """The OMNI-ALPHA VΩ∞∞ Trading System was conceived as a capital-autonomous, self-evolving trading
    intelligence that operates beyond the constraints of traditional algorithmic trading systems. At its core,
    OMNI embodies three fundamental principles:"""
    story.append(Paragraph(vision_text, styles['BodyText']))

    # Add principles as bullet points
    principles = [
        "<b>Zero-Loss Enforcement:</b> A systematic approach to risk management that prioritizes capital preservation above all else.",
        "<b>Recursive Intelligence:</b> The ability to learn from each trade and improve over time through sophisticated memory systems.",
        "<b>Quantum-Inspired Prediction:</b> Leveraging principles from quantum computing to model market uncertainty and identify high-probability trading opportunities."
    ]

    for principle in principles:
        story.append(Paragraph("• " + principle, styles['BodyTextIndent']))

    story.append(Spacer(1, 0.2*inch))

    multi_agent_text = """Unlike conventional trading systems that rely on static rules or simple machine learning models,
    OMNI operates as a complex ecosystem of specialized agents, each contributing unique capabilities to the
    collective intelligence. This multi-agent approach enables sophisticated decision-making that adapts to
    changing market conditions and evolves through experience."""
    story.append(Paragraph(multi_agent_text, styles['BodyText']))

    # Add agent network diagram
    story.append(Spacer(1, 0.3*inch))
    agent_img = RLImage(agent_network_path, width=6*inch, height=4.8*inch)
    story.append(agent_img)
    story.append(Paragraph("Figure 1: OMNI Multi-Agent Network Architecture", styles['Caption']))
    story.append(Spacer(1, 0.3*inch))

    # Add capital genesis logic subsection
    story.append(Paragraph("1.2 Capital Genesis Logic", styles['Heading2']))
    capital_text = """OMNI begins with minimal capital and employs a capital growth strategy designed to achieve
    exponential returns while maintaining strict risk controls. The system aims to grow capital organically,
    without requiring large initial investments or external funding."""
    story.append(Paragraph(capital_text, styles['BodyText']))

    # Add mathematical representation of capital growth
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The capital growth model can be expressed mathematically as:", styles['BodyText']))

    # Add LaTeX equation for capital growth
    capital_growth_eq = r"C_t = C_0 \cdot (1 + r)^t \cdot \prod_{i=1}^{t} (1 - L_i)"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("C<sub>t</sub> = C<sub>0</sub> · (1 + r)<sup>t</sup> · ∏<sub>i=1</sub><sup>t</sup> (1 - L<sub>i</sub>)", styles['BodyText']))
    story.append(Spacer(1, 0.1*inch))

    equation_explanation = """Where:
    • C<sub>t</sub> is the capital at time t
    • C<sub>0</sub> is the initial capital
    • r is the average return per trade
    • t is the number of trades
    • L<sub>i</sub> is the loss factor for trade i (zero under ideal conditions)"""
    story.append(Paragraph(equation_explanation, styles['BodyTextIndent']))

    story.append(Spacer(1, 0.2*inch))
    zero_loss_text = """The Zero-Loss Enforcement mechanism ensures that L<sub>i</sub> approaches zero, maximizing
    the compounding effect of successful trades while preventing drawdowns that would otherwise erode capital."""
    story.append(Paragraph(zero_loss_text, styles['BodyText']))
    story.append(PageBreak())

    # Add system architecture section
    story.append(Paragraph("2. System Architecture", styles['Heading1']))

    # Add high-level overview subsection
    story.append(Paragraph("2.1 High-Level Overview", styles['Heading2']))
    arch_text = """The OMNI-ALPHA VΩ∞∞ system is structured as a hierarchical multi-agent architecture with specialized
    components for different aspects of the trading process. At the highest level, the system consists of:"""
    story.append(Paragraph(arch_text, styles['BodyText']))

    # Add components as bullet points
    components = [
        "<b>Core Components:</b> The fundamental building blocks that manage system state, communication, and decision-making.",
        "<b>Quantum Components:</b> Specialized modules that implement quantum-inspired algorithms for prediction and pattern recognition.",
        "<b>Agent Network:</b> A collaborative network of specialized agents that perform specific functions within the system.",
        "<b>Exchange Interface:</b> Components that handle communication with cryptocurrency exchanges.",
        "<b>User Interface:</b> Visualization and control systems for monitoring and managing the system."
    ]

    for component in components:
        story.append(Paragraph("• " + component, styles['BodyTextIndent']))

    # Add system architecture diagram
    story.append(Spacer(1, 0.3*inch))

    # Create a simple architecture diagram using ReportLab
    def create_architecture_diagram():
        """Create a system architecture diagram"""
        img_path = os.path.join(IMAGE_DIR, 'system_architecture.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)
        fig.patch.set_alpha(0.0)

        # Define component boxes
        components = [
            {"name": "Core System", "pos": (0.5, 0.8), "size": (0.4, 0.15), "color": OMNI_COLORS['dark_blue']},
            {"name": "Agent Network", "pos": (0.25, 0.5), "size": (0.3, 0.15), "color": OMNI_COLORS['light_blue']},
            {"name": "Quantum Components", "pos": (0.75, 0.5), "size": (0.3, 0.15), "color": OMNI_COLORS['purple']},
            {"name": "Trading Logic", "pos": (0.25, 0.2), "size": (0.3, 0.15), "color": OMNI_COLORS['green']},
            {"name": "Exchange Interface", "pos": (0.75, 0.2), "size": (0.3, 0.15), "color": OMNI_COLORS['red']}
        ]

        # Draw component boxes
        for comp in components:
            rect = Rectangle(
                (comp["pos"][0] - comp["size"][0]/2, comp["pos"][1] - comp["size"][1]/2),
                comp["size"][0], comp["size"][1],
                facecolor=comp["color"], alpha=0.8, edgecolor='black', linewidth=1
            )
            ax.add_patch(rect)
            ax.text(comp["pos"][0], comp["pos"][1], comp["name"],
                   ha='center', va='center', color='white', fontweight='bold')

        # Draw connections
        connections = [
            (components[0], components[1]),  # Core to Agent Network
            (components[0], components[2]),  # Core to Quantum Components
            (components[1], components[3]),  # Agent Network to Trading Logic
            (components[2], components[3]),  # Quantum Components to Trading Logic
            (components[3], components[4]),  # Trading Logic to Exchange Interface
            (components[0], components[4])   # Core to Exchange Interface
        ]

        for start, end in connections:
            ax.annotate("",
                       xy=(end["pos"][0], end["pos"][1]),
                       xytext=(start["pos"][0], start["pos"][1]),
                       arrowprops=dict(arrowstyle="->", color='gray', linewidth=1.5))

        # Set limits and remove axes
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight', pad_inches=0.1)
        plt.close()

        return img_path

    # Generate and add the architecture diagram
    arch_diagram_path = create_architecture_diagram()
    arch_img = RLImage(arch_diagram_path, width=6*inch, height=4.5*inch)
    story.append(arch_img)
    story.append(Paragraph("Figure 2: OMNI System Architecture", styles['Caption']))
    story.append(Spacer(1, 0.3*inch))

    # Add component interaction subsection
    story.append(Paragraph("2.2 Component Interaction", styles['Heading2']))
    interaction_text = """The components interact through a sophisticated message bus that enables asynchronous
    communication and coordination. This architecture allows for:"""
    story.append(Paragraph(interaction_text, styles['BodyText']))

    # Add interaction features as bullet points
    interactions = [
        "Parallel processing of different trading tasks",
        "Decentralized decision-making with centralized coordination",
        "Fault tolerance through redundancy and isolation",
        "Scalability through modular design"
    ]

    for interaction in interactions:
        story.append(Paragraph("• " + interaction, styles['BodyTextIndent']))

    # Add message bus description
    story.append(Spacer(1, 0.2*inch))
    message_bus_text = """The message bus implements a publish-subscribe pattern where components can publish messages
    to specific topics and subscribe to topics of interest. This decouples the components and allows for flexible
    communication patterns."""
    story.append(Paragraph(message_bus_text, styles['BodyText']))

    # Add mathematical representation of the message routing
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The message routing can be represented as a directed graph:", styles['BodyText']))

    # Add LaTeX equation for message routing
    message_routing_eq = r"G = (V, E) \text{ where } V = \{v_1, v_2, ..., v_n\} \text{ and } E = \{(v_i, v_j) | v_i \text{ can send messages to } v_j\}"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("G = (V, E) where V = {v<sub>1</sub>, v<sub>2</sub>, ..., v<sub>n</sub>} and E = {(v<sub>i</sub>, v<sub>j</sub>) | v<sub>i</sub> can send messages to v<sub>j</sub>}", styles['BodyText']))

    story.append(PageBreak())

    # Add quantum computing components section
    story.append(Paragraph("3. Quantum Computing Components", styles['Heading1']))

    quantum_intro = """The OMNI system incorporates several quantum-inspired components that enhance its predictive
    capabilities and decision-making processes. These components leverage principles from quantum computing
    to model market uncertainty, identify patterns, and make probabilistic predictions."""
    story.append(Paragraph(quantum_intro, styles['BodyText']))

    # Add quantum predictor subsection
    story.append(Paragraph("3.1 Quantum Predictor", styles['Heading2']))

    quantum_predictor_text = """The Quantum Predictor implements quantum-inspired algorithms to forecast price movements
    with probabilistic confidence intervals. Unlike traditional forecasting methods that produce point estimates,
    the Quantum Predictor generates a superposition of possible future states, each with an associated probability
    amplitude."""
    story.append(Paragraph(quantum_predictor_text, styles['BodyText']))

    # Add key features of quantum predictor
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Key features of the Quantum Predictor include:", styles['BodyText']))

    quantum_features = [
        "<b>Quantum state representation of price movements:</b> Prices are represented as quantum states in a Hilbert space, allowing for superposition of multiple potential future states.",
        "<b>Probability amplitude calculations:</b> Each potential price movement is assigned a probability amplitude based on historical patterns and current market conditions.",
        "<b>Quantum entropy measurement:</b> Uncertainty is quantified using quantum entropy measures, providing a more nuanced understanding of market volatility.",
        "<b>Quantum coherence analysis:</b> Pattern stability is assessed through quantum coherence metrics, identifying when market conditions are more predictable."
    ]

    for feature in quantum_features:
        story.append(Paragraph("• " + feature, styles['BodyTextIndent']))

    # Create and add quantum prediction visualization
    def create_quantum_prediction_viz():
        """Create a visualization of quantum prediction"""
        img_path = os.path.join(IMAGE_DIR, 'quantum_prediction.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 5), dpi=100)

        # Generate historical price data
        x_hist = np.arange(0, 50)
        y_hist = 50 + 10 * np.sin(x_hist / 10) + np.random.normal(0, 2, len(x_hist))

        # Generate prediction data
        x_pred = np.arange(50, 100)

        # Main prediction path
        y_pred_main = y_hist[-1] + 5 * np.sin((x_pred - 50) / 10) + (x_pred - 50) * 0.1

        # Alternative paths with different probabilities
        y_pred_alt1 = y_hist[-1] + 3 * np.sin((x_pred - 50) / 8) - (x_pred - 50) * 0.05
        y_pred_alt2 = y_hist[-1] + 7 * np.sin((x_pred - 50) / 12) + (x_pred - 50) * 0.2

        # Plot historical data
        ax.plot(x_hist, y_hist, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Historical Price')

        # Plot prediction paths
        ax.plot(x_pred, y_pred_main, color=OMNI_COLORS['green'], linewidth=2,
                label='Primary Path (60%)')
        ax.fill_between(x_pred, y_pred_main - 3, y_pred_main + 3,
                       color=OMNI_COLORS['green'], alpha=0.2)

        ax.plot(x_pred, y_pred_alt1, color=OMNI_COLORS['orange'], linewidth=2,
                label='Alternative Path 1 (30%)')
        ax.fill_between(x_pred, y_pred_alt1 - 4, y_pred_alt1 + 4,
                       color=OMNI_COLORS['orange'], alpha=0.2)

        ax.plot(x_pred, y_pred_alt2, color=OMNI_COLORS['red'], linewidth=2,
                label='Alternative Path 2 (10%)')
        ax.fill_between(x_pred, y_pred_alt2 - 5, y_pred_alt2 + 5,
                       color=OMNI_COLORS['red'], alpha=0.2)

        # Add vertical line separating history from prediction
        ax.axvline(x=50, color='black', linestyle='--', alpha=0.5, label='Present')

        # Add quantum effects
        for i in range(20):
            x = np.random.uniform(50, 100)
            y = np.random.uniform(30, 70)
            size = np.random.uniform(20, 100)
            alpha = np.random.uniform(0.05, 0.2)
            ax.add_patch(plt.Circle((x, y), size, color=OMNI_COLORS['light_blue'], alpha=alpha))

        # Add labels and legend
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Quantum-Inspired Price Prediction', fontsize=14)
        ax.legend(loc='upper left')
        ax.grid(True, alpha=0.3)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add quantum prediction visualization
    story.append(Spacer(1, 0.3*inch))
    quantum_pred_img_path = create_quantum_prediction_viz()
    quantum_pred_img = RLImage(quantum_pred_img_path, width=6*inch, height=3.75*inch)
    story.append(quantum_pred_img)
    story.append(Paragraph("Figure 3: Quantum-Inspired Price Prediction with Probability Amplitudes", styles['Caption']))

    # Add mathematical representation of quantum prediction
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("The quantum state representation of price can be expressed as:", styles['BodyText']))

    # Add LaTeX equation for quantum state
    quantum_state_eq = r"|\psi\rangle = \sum_{i=0}^{n-1} \alpha_i |i\rangle"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("|ψ⟩ = ∑<sub>i=0</sub><sup>n-1</sup> α<sub>i</sub> |i⟩", styles['BodyText']))
    story.append(Spacer(1, 0.1*inch))

    quantum_eq_explanation = """Where:
    • |ψ⟩ represents the quantum state of the market
    • α<sub>i</sub> are complex probability amplitudes
    • |i⟩ are basis states representing different market scenarios"""
    story.append(Paragraph(quantum_eq_explanation, styles['BodyTextIndent']))

    # Add quantum entanglement subsection
    story.append(Paragraph("3.2 Quantum Entanglement", styles['Heading2']))

    quantum_entanglement_text = """The Quantum Entanglement module identifies and exploits correlations between different
    assets, allowing the system to detect arbitrage opportunities and hedge positions effectively. This component
    implements Bell state analysis for correlated assets, entanglement strength measurement, phase difference
    calculation, and arbitrage opportunity scoring."""
    story.append(Paragraph(quantum_entanglement_text, styles['BodyText']))

    # Add mathematical representation of entanglement
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The entanglement between two assets can be quantified using the correlation density matrix:", styles['BodyText']))

    # Add LaTeX equation for entanglement
    entanglement_eq = r"\rho_{AB} = \sum_{i,j} p_{ij} |\psi_i\rangle\langle\psi_i| \otimes |\phi_j\rangle\langle\phi_j|"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("ρ<sub>AB</sub> = ∑<sub>i,j</sub> p<sub>ij</sub> |ψ<sub>i</sub>⟩⟨ψ<sub>i</sub>| ⊗ |φ<sub>j</sub>⟩⟨φ<sub>j</sub>|", styles['BodyText']))

    # Create and add entanglement visualization
    def create_entanglement_viz():
        """Create a visualization of quantum entanglement between assets"""
        img_path = os.path.join(IMAGE_DIR, 'quantum_entanglement.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 5), dpi=100)

        # Generate correlated price data
        np.random.seed(42)  # For reproducibility
        n_points = 100

        # Base trend
        t = np.linspace(0, 10, n_points)
        base_trend = 2 * np.sin(t) + 0.2 * t

        # Asset 1 - BTC
        btc_price = 30000 + 5000 * base_trend + np.random.normal(0, 500, n_points)

        # Asset 2 - ETH (correlated with BTC)
        eth_price = 2000 + 300 * base_trend + np.random.normal(0, 50, n_points)

        # Asset 3 - Gold (anti-correlated with crypto)
        gold_price = 2000 - 100 * base_trend + np.random.normal(0, 30, n_points)

        # Normalize prices for visualization
        btc_norm = (btc_price - btc_price.min()) / (btc_price.max() - btc_price.min())
        eth_norm = (eth_price - eth_price.min()) / (eth_price.max() - eth_price.min())
        gold_norm = (gold_price - gold_price.min()) / (gold_price.max() - gold_price.min())

        # Plot normalized prices
        ax.plot(t, btc_norm, color=OMNI_COLORS['orange'], linewidth=2, label='BTC')
        ax.plot(t, eth_norm, color=OMNI_COLORS['light_blue'], linewidth=2, label='ETH')
        ax.plot(t, gold_norm, color=OMNI_COLORS['gold'], linewidth=2, label='GOLD')

        # Add entanglement visualization
        for i in range(0, n_points, 5):
            # BTC-ETH positive correlation
            ax.plot([t[i], t[i]], [btc_norm[i], eth_norm[i]],
                   color=OMNI_COLORS['purple'], alpha=0.3, linewidth=1)

            # BTC-GOLD negative correlation
            ax.plot([t[i], t[i]], [btc_norm[i], gold_norm[i]],
                   color=OMNI_COLORS['red'], alpha=0.3, linewidth=1)

        # Add quantum-inspired effects
        for i in range(10):
            x = np.random.uniform(0, 10)
            y = np.random.uniform(0, 1)
            size = np.random.uniform(0.1, 0.3)
            ax.add_patch(plt.Circle((x, y), size, color=OMNI_COLORS['purple'], alpha=0.2))

        # Add labels and legend
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Normalized Price', fontsize=12)
        ax.set_title('Quantum Entanglement Between Assets', fontsize=14)
        ax.legend(loc='upper right')
        ax.grid(True, alpha=0.3)

        # Add correlation indicators
        ax.text(0.5, 1.05, "BTC-ETH: Strong Positive Entanglement",
               transform=ax.transAxes, ha='center', color=OMNI_COLORS['purple'])
        ax.text(0.5, 1.1, "BTC-GOLD: Strong Negative Entanglement",
               transform=ax.transAxes, ha='center', color=OMNI_COLORS['red'])

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add entanglement visualization
    story.append(Spacer(1, 0.3*inch))
    entanglement_img_path = create_entanglement_viz()
    entanglement_img = RLImage(entanglement_img_path, width=6*inch, height=3.75*inch)
    story.append(entanglement_img)
    story.append(Paragraph("Figure 4: Quantum Entanglement Between Different Assets", styles['Caption']))

    # Add hyperdimensional computing subsection
    story.append(Paragraph("3.3 Hyperdimensional Computing", styles['Heading2']))

    hd_text = """The Hyperdimensional Computing module enables high-dimensional pattern recognition and symbolic
    reasoning, allowing OMNI to identify complex market patterns that would be invisible to traditional analysis
    methods. This approach is inspired by the brain's ability to process information in high-dimensional spaces."""
    story.append(Paragraph(hd_text, styles['BodyText']))

    # Add key capabilities
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Key capabilities include:", styles['BodyText']))

    hd_capabilities = [
        "<b>10,000-dimensional vector representations:</b> Market states are encoded as high-dimensional vectors, capturing subtle relationships and patterns.",
        "<b>Binding and unbinding operations:</b> Complex relationships between market factors are represented through mathematical operations in high-dimensional space.",
        "<b>Similarity search in hyperdimensional space:</b> Historical patterns similar to current market conditions are efficiently identified.",
        "<b>Pattern classification and recognition:</b> Market regimes and conditions are classified based on their hyperdimensional representations."
    ]

    for capability in hd_capabilities:
        story.append(Paragraph("• " + capability, styles['BodyTextIndent']))

    # Add mathematical representation of hyperdimensional computing
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The similarity between two market states in hyperdimensional space can be calculated as:", styles['BodyText']))

    # Add LaTeX equation for hyperdimensional similarity
    hd_similarity_eq = r"\text{similarity}(A, B) = \frac{A \cdot B}{|A||B|}"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("similarity(A, B) = (A · B) / (|A|·|B|)", styles['BodyText']))

    # Create and add hyperdimensional computing visualization
    def create_hd_computing_viz():
        """Create a visualization of hyperdimensional computing"""
        img_path = os.path.join(IMAGE_DIR, 'hyperdimensional_computing.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Create a 3D projection (representing higher dimensions)
        ax = fig.add_subplot(111, projection='3d')

        # Generate random points in 3D space
        np.random.seed(42)  # For reproducibility
        n_points = 100

        # Create several clusters representing different market regimes
        centers = [
            (1, 1, 1),    # Bullish regime
            (-1, -1, -1),  # Bearish regime
            (1, -1, 1),    # Volatile regime
            (-1, 1, -1)    # Ranging regime
        ]

        colors = [
            OMNI_COLORS['green'],   # Bullish
            OMNI_COLORS['red'],     # Bearish
            OMNI_COLORS['orange'],  # Volatile
            OMNI_COLORS['light_blue']  # Ranging
        ]

        labels = ['Bullish Regime', 'Bearish Regime', 'Volatile Regime', 'Ranging Regime']

        # Plot each cluster
        for i, (center, color, label) in enumerate(zip(centers, colors, labels)):
            # Generate points around center
            x = np.random.normal(center[0], 0.2, n_points // 4)
            y = np.random.normal(center[1], 0.2, n_points // 4)
            z = np.random.normal(center[2], 0.2, n_points // 4)

            # Plot points
            ax.scatter(x, y, z, color=color, alpha=0.6, label=label)

        # Add a "current market state" point
        current_state = (0.8, 0.9, 1.1)  # Close to bullish regime
        ax.scatter([current_state[0]], [current_state[1]], [current_state[2]],
                  color='black', s=100, marker='*', label='Current Market State')

        # Add similarity lines from current state to nearest points in each cluster
        for center, color in zip(centers, colors):
            ax.plot([current_state[0], center[0]],
                   [current_state[1], center[1]],
                   [current_state[2], center[2]],
                   color=color, alpha=0.5, linestyle='--')

        # Add labels
        ax.set_xlabel('Dimension 1', fontsize=10)
        ax.set_ylabel('Dimension 2', fontsize=10)
        ax.set_zlabel('Dimension 3', fontsize=10)
        ax.set_title('Hyperdimensional Computing (3D Projection of 10,000D Space)', fontsize=12)

        # Add legend
        ax.legend(loc='upper right', fontsize=8)

        # Add note about dimensionality
        fig.text(0.5, 0.01, "Note: This is a 3D projection of a 10,000-dimensional space",
                ha='center', fontsize=8, style='italic')

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add hyperdimensional computing visualization
    story.append(Spacer(1, 0.3*inch))
    hd_img_path = create_hd_computing_viz()
    hd_img = RLImage(hd_img_path, width=6*inch, height=4.5*inch)
    story.append(hd_img)
    story.append(Paragraph("Figure 5: Hyperdimensional Computing for Market Regime Classification", styles['Caption']))

    # Add spectral tree engine subsection
    story.append(Paragraph("3.4 Spectral Tree Engine", styles['Heading2']))

    spectral_text = """The Spectral Tree Engine simulates multiple possible price paths to identify optimal entry and
    exit points with entropy-based confidence scoring. This component generates stochastic price paths using
    advanced simulation techniques, calculates entropy measures to quantify uncertainty, identifies optimal entry
    and exit points across multiple scenarios, and provides confidence scores for trading decisions."""
    story.append(Paragraph(spectral_text, styles['BodyText']))

    # Create and add spectral tree visualization
    def create_spectral_tree_viz():
        """Create a visualization of the spectral tree engine"""
        img_path = os.path.join(IMAGE_DIR, 'spectral_tree.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Starting point
        start_price = 100

        # Create a binary tree structure
        levels = 5

        # Function to calculate positions
        def get_positions(level, branch, levels):
            x = level
            width = 2**(levels-1)
            y = start_price + branch * (level * 2)
            return x, y

        # Plot the tree
        for level in range(levels+1):
            for branch in range(-2**level + 1, 2**level, 2):
                x, y = get_positions(level, branch, levels)

                # Determine color based on whether price is above or below starting point
                if y > start_price:
                    color = OMNI_COLORS['green']
                    alpha = min(0.6 + 0.3 * (y - start_price) / (2**levels), 0.9)
                else:
                    color = OMNI_COLORS['red']
                    alpha = min(0.6 + 0.3 * (start_price - y) / (2**levels), 0.9)

                # Plot point
                ax.scatter(x, y, color=color, alpha=alpha, s=30)

                # Connect to parent nodes if not root
                if level > 0:
                    parent_branch = branch // 2
                    parent_x, parent_y = get_positions(level-1, parent_branch, levels)
                    ax.plot([parent_x, x], [parent_y, y], color=color, alpha=0.3, linewidth=1)

        # Add optimal entry and exit points
        entry_level = 1
        entry_branch = 1
        entry_x, entry_y = get_positions(entry_level, entry_branch, levels)

        exit_level = 3
        exit_branch = 3
        exit_x, exit_y = get_positions(exit_level, exit_branch, levels)

        ax.scatter(entry_x, entry_y, color='blue', s=100, marker='^', label='Optimal Entry')
        ax.scatter(exit_x, exit_y, color='purple', s=100, marker='v', label='Optimal Exit')

        # Add entropy heatmap
        for level in range(1, levels+1):
            for branch in range(-2**level + 1, 2**level, 2):
                x, y = get_positions(level, branch, levels)

                # Calculate entropy (higher at deeper levels)
                entropy = level / levels

                # Plot entropy circle
                ax.add_patch(plt.Circle((x, y), 0.2 + 0.3 * entropy,
                                      color=OMNI_COLORS['purple'], alpha=0.2 * entropy))

        # Add labels
        ax.set_xlabel('Time Steps', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Spectral Tree Engine: Price Path Simulation', fontsize=14)
        ax.legend(loc='upper right')

        # Add entropy scale
        sm = plt.cm.ScalarMappable(cmap=plt.cm.Purples,
                                  norm=plt.Normalize(0, 1))
        sm.set_array([])
        cbar = plt.colorbar(sm, ax=ax, orientation='vertical', pad=0.05)
        cbar.set_label('Entropy (Uncertainty)', fontsize=10)

        # Set limits
        ax.set_xlim(-0.5, levels + 0.5)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add spectral tree visualization
    story.append(Spacer(1, 0.3*inch))
    spectral_img_path = create_spectral_tree_viz()
    spectral_img = RLImage(spectral_img_path, width=6*inch, height=4.5*inch)
    story.append(spectral_img)
    story.append(Paragraph("Figure 6: Spectral Tree Engine for Optimal Entry/Exit Point Identification", styles['Caption']))

    story.append(PageBreak())

    # Add agent personalities section
    story.append(Paragraph("4. Agent Personalities", styles['Heading1']))

    agent_intro = """The OMNI system employs a diverse set of specialized agents, each with unique capabilities and
    responsibilities. These agents work together as a collaborative network, sharing information and insights
    to make optimal trading decisions."""
    story.append(Paragraph(agent_intro, styles['BodyText']))

    # Add ghost trader subsection
    story.append(Paragraph("4.1 Ghost Trader", styles['Heading2']))

    ghost_trader_text = """The Ghost Trader simulates trades before real execution to validate profitability and identify
    potential risks. This agent runs virtual trades in parallel with real market data, analyzes risk/reward profiles
    of potential trades, recommends adjustments to trade parameters, and provides confidence scores for trade execution."""
    story.append(Paragraph(ghost_trader_text, styles['BodyText']))

    # Create and add ghost trader visualization
    def create_ghost_trader_viz():
        """Create a visualization of the Ghost Trader agent"""
        img_path = os.path.join(IMAGE_DIR, 'ghost_trader.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Generate price data
        np.random.seed(42)  # For reproducibility
        n_points = 100

        # Create price data
        t = np.linspace(0, 10, n_points)
        price = 100 + 10 * np.sin(t) + np.cumsum(np.random.normal(0, 0.5, n_points))

        # Plot actual price
        ax.plot(t, price, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Actual Price')

        # Add ghost simulations
        n_sims = 10
        for i in range(n_sims):
            # Generate a simulated path
            sim_price = price + np.cumsum(np.random.normal(0, 0.5, n_points))

            # Plot with low opacity
            ax.plot(t, sim_price, color=OMNI_COLORS['light_blue'], alpha=0.2, linewidth=1)

        # Add a "ghost" simulation with higher opacity
        ghost_sim = price + np.cumsum(np.random.normal(0, 0.5, n_points))
        ax.plot(t, ghost_sim, color=OMNI_COLORS['light_blue'], alpha=0.7, linewidth=1.5,
               label='Ghost Simulation')

        # Add entry and exit points
        entry_idx = 30
        exit_idx = 70

        ax.scatter(t[entry_idx], price[entry_idx], color=OMNI_COLORS['green'], s=100, marker='^',
                  label='Entry Point')
        ax.scatter(t[exit_idx], price[exit_idx], color=OMNI_COLORS['red'], s=100, marker='v',
                  label='Exit Point')

        # Add risk/reward visualization
        ax.axhline(y=price[entry_idx], color='gray', linestyle='--', alpha=0.5)
        ax.axhline(y=price[entry_idx] - 2, color=OMNI_COLORS['red'], linestyle='--', alpha=0.5,
                  label='Stop Loss')
        ax.axhline(y=price[entry_idx] + 5, color=OMNI_COLORS['green'], linestyle='--', alpha=0.5,
                  label='Take Profit')

        # Add confidence score
        ax.text(t[entry_idx] + 1, price[entry_idx] + 7, "Confidence Score: 87%",
               fontsize=12, color=OMNI_COLORS['purple'], fontweight='bold')

        # Add labels
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Ghost Trader: Trade Simulation and Validation', fontsize=14)
        ax.legend(loc='upper left')
        ax.grid(True, alpha=0.3)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add ghost trader visualization
    story.append(Spacer(1, 0.3*inch))
    ghost_img_path = create_ghost_trader_viz()
    ghost_img = RLImage(ghost_img_path, width=6*inch, height=4.5*inch)
    story.append(ghost_img)
    story.append(Paragraph("Figure 7: Ghost Trader Simulation and Risk/Reward Analysis", styles['Caption']))

    # Add memory node subsection
    story.append(Paragraph("4.2 Memory Node", styles['Heading2']))

    memory_node_text = """The Memory Node stores and manages long-term trade vector memory, allowing the system to learn
    from past experiences and improve over time. Key functions include trade memory storage and retrieval, pattern
    memory formation and recognition, memory reinforcement and decay mechanisms, and similarity-based memory search."""
    story.append(Paragraph(memory_node_text, styles['BodyText']))

    # Create and add memory node visualization
    def create_memory_node_viz():
        """Create a visualization of the Memory Node agent"""
        img_path = os.path.join(IMAGE_DIR, 'memory_node.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Create a graph structure for memory
        G = nx.DiGraph()

        # Add nodes for different memory types
        memory_types = {
            "Trade Memory": {"pos": (0.5, 0.8), "size": 1500, "color": OMNI_COLORS['dark_blue']},
            "Pattern Memory": {"pos": (0.2, 0.5), "size": 1200, "color": OMNI_COLORS['light_blue']},
            "Market Regime Memory": {"pos": (0.8, 0.5), "size": 1200, "color": OMNI_COLORS['purple']},
            "Success Memory": {"pos": (0.3, 0.2), "size": 1000, "color": OMNI_COLORS['green']},
            "Failure Memory": {"pos": (0.7, 0.2), "size": 1000, "color": OMNI_COLORS['red']}
        }

        # Add nodes
        for name, attrs in memory_types.items():
            G.add_node(name, **attrs)

        # Add edges
        G.add_edge("Trade Memory", "Pattern Memory")
        G.add_edge("Trade Memory", "Market Regime Memory")
        G.add_edge("Pattern Memory", "Success Memory")
        G.add_edge("Pattern Memory", "Failure Memory")
        G.add_edge("Market Regime Memory", "Success Memory")
        G.add_edge("Market Regime Memory", "Failure Memory")
        G.add_edge("Success Memory", "Trade Memory")
        G.add_edge("Failure Memory", "Trade Memory")

        # Get positions
        pos = nx.spring_layout(G, pos={n: data["pos"] for n, data in memory_types.items()}, fixed=memory_types.keys())

        # Draw the graph
        node_colors = [data["color"] for name, data in memory_types.items()]
        node_sizes = [data["size"] for name, data in memory_types.items()]

        nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes, alpha=0.8)
        nx.draw_networkx_edges(G, pos, width=2, alpha=0.6, edge_color='gray',
                              arrows=True, arrowsize=15, connectionstyle='arc3,rad=0.1')
        nx.draw_networkx_labels(G, pos, font_size=10, font_color='white', font_weight='bold')

        # Add memory items as small nodes
        memory_items = [
            {"name": "BTC Long 2023-06-15", "parent": "Trade Memory", "success": True},
            {"name": "ETH Short 2023-06-18", "parent": "Trade Memory", "success": False},
            {"name": "SOL Long 2023-06-20", "parent": "Trade Memory", "success": True},
            {"name": "Double Bottom", "parent": "Pattern Memory", "success": None},
            {"name": "Head and Shoulders", "parent": "Pattern Memory", "success": None},
            {"name": "Bull Market", "parent": "Market Regime Memory", "success": None},
            {"name": "Bear Market", "parent": "Market Regime Memory", "success": None},
            {"name": "BTC Breakout Trade", "parent": "Success Memory", "success": True},
            {"name": "ETH Reversal Failure", "parent": "Failure Memory", "success": False}
        ]

        # Add memory items
        for i, item in enumerate(memory_items):
            parent_pos = pos[item["parent"]]
            # Add some random offset
            offset_x = np.random.uniform(-0.1, 0.1)
            offset_y = np.random.uniform(-0.1, 0.1)
            item_pos = (parent_pos[0] + offset_x, parent_pos[1] + offset_y)

            # Determine color based on success
            if item["success"] is True:
                color = OMNI_COLORS['green']
            elif item["success"] is False:
                color = OMNI_COLORS['red']
            else:
                color = OMNI_COLORS['light_blue']

            # Draw small node
            ax.scatter(item_pos[0], item_pos[1], color=color, s=100, alpha=0.7)

            # Add label with small font
            ax.text(item_pos[0], item_pos[1] - 0.03, item["name"],
                   fontsize=6, ha='center', va='top', color='black',
                   bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.1'))

        # Add title
        ax.text(0.5, 0.95, "Memory Node: Trade and Pattern Memory Network",
               fontsize=14, ha='center', va='center', transform=ax.transAxes,
               bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add memory node visualization
    story.append(Spacer(1, 0.3*inch))
    memory_img_path = create_memory_node_viz()
    memory_img = RLImage(memory_img_path, width=6*inch, height=4.5*inch)
    story.append(memory_img)
    story.append(Paragraph("Figure 8: Memory Node Network with Trade and Pattern Memory", styles['Caption']))

    # Add macro sentinel subsection
    story.append(Paragraph("4.3 Macro Sentinel", styles['Heading2']))

    macro_sentinel_text = """The Macro Sentinel monitors global economic events, tariffs, and major market events that
    could significantly impact trading conditions. This agent tracks economic calendar events, monitors news sources
    for significant announcements, issues warnings about potential market disruptions, and adjusts risk parameters
    based on macro conditions."""
    story.append(Paragraph(macro_sentinel_text, styles['BodyText']))

    # Create and add macro sentinel visualization
    def create_macro_sentinel_viz():
        """Create a visualization of the Macro Sentinel agent"""
        img_path = os.path.join(IMAGE_DIR, 'macro_sentinel.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Generate price data
        np.random.seed(42)  # For reproducibility
        n_points = 200

        # Create price data
        t = np.linspace(0, 10, n_points)
        price = 100 + 5 * np.sin(t) + np.cumsum(np.random.normal(0, 0.2, n_points))

        # Plot price
        ax.plot(t, price, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Asset Price')

        # Add macro events
        macro_events = [
            {"time": 2.5, "name": "Fed Rate Hike", "impact": -3, "risk": "high"},
            {"time": 4.2, "name": "Positive GDP Report", "impact": 2, "risk": "medium"},
            {"time": 6.8, "name": "Geopolitical Tension", "impact": -2, "risk": "medium"},
            {"time": 8.5, "name": "Tech Earnings Beat", "impact": 3, "risk": "high"}
        ]

        # Plot macro events
        for event in macro_events:
            # Determine color based on impact
            if event["impact"] > 0:
                color = OMNI_COLORS['green']
                marker = '^'
            else:
                color = OMNI_COLORS['red']
                marker = 'v'

            # Determine size based on risk
            if event["risk"] == "high":
                size = 150
            else:
                size = 100

            # Find closest time index
            time_idx = np.argmin(np.abs(t - event["time"]))

            # Plot event
            ax.scatter(event["time"], price[time_idx], color=color, s=size, marker=marker)

            # Add label
            ax.text(event["time"], price[time_idx] + 2, event["name"],
                   fontsize=8, ha='center', va='bottom', rotation=45,
                   bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.1'))

            # Add risk zone
            if event["risk"] == "high":
                ax.axvspan(event["time"] - 0.2, event["time"] + 0.2,
                          color=color, alpha=0.2)

        # Add risk adjustment periods
        risk_periods = [
            {"start": 2.3, "end": 3.0, "level": "Reduced Exposure", "color": OMNI_COLORS['red']},
            {"start": 6.5, "end": 7.2, "level": "Reduced Exposure", "color": OMNI_COLORS['red']},
            {"start": 4.0, "end": 4.5, "level": "Increased Exposure", "color": OMNI_COLORS['green']},
            {"start": 8.3, "end": 9.0, "level": "Increased Exposure", "color": OMNI_COLORS['green']}
        ]

        # Plot risk adjustment periods
        for period in risk_periods:
            ax.axvspan(period["start"], period["end"], color=period["color"], alpha=0.1)
            ax.text((period["start"] + period["end"]) / 2, 90, period["level"],
                   fontsize=8, ha='center', va='center', color=period["color"],
                   bbox=dict(facecolor='white', alpha=0.7, boxstyle='round,pad=0.1'))

        # Add labels
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Macro Sentinel: Economic Event Monitoring and Risk Adjustment', fontsize=14)

        # Add legend
        legend_elements = [
            plt.Line2D([0], [0], color=OMNI_COLORS['dark_blue'], lw=2, label='Asset Price'),
            plt.Line2D([0], [0], marker='^', color='w', markerfacecolor=OMNI_COLORS['green'],
                      markersize=10, label='Positive Event'),
            plt.Line2D([0], [0], marker='v', color='w', markerfacecolor=OMNI_COLORS['red'],
                      markersize=10, label='Negative Event'),
            plt.Rectangle((0,0), 1, 1, fc=OMNI_COLORS['green'], alpha=0.1, label='Increased Exposure'),
            plt.Rectangle((0,0), 1, 1, fc=OMNI_COLORS['red'], alpha=0.1, label='Reduced Exposure')
        ]
        ax.legend(handles=legend_elements, loc='upper left')

        ax.grid(True, alpha=0.3)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add macro sentinel visualization
    story.append(Spacer(1, 0.3*inch))
    macro_img_path = create_macro_sentinel_viz()
    macro_img = RLImage(macro_img_path, width=6*inch, height=4.5*inch)
    story.append(macro_img)
    story.append(Paragraph("Figure 9: Macro Sentinel Monitoring Economic Events and Adjusting Risk", styles['Caption']))

    story.append(PageBreak())

    # Add trading strategy section
    story.append(Paragraph("5. Trading Strategy", styles['Heading1']))

    strategy_intro = """OMNI employs a sophisticated trading strategy that combines multiple approaches to achieve
    consistent profitability while minimizing risk. The strategy is adaptive and evolves over time based on
    market conditions and past performance."""
    story.append(Paragraph(strategy_intro, styles['BodyText']))

    # Add zero-loss enforcement subsection
    story.append(Paragraph("5.1 Zero-Loss Enforcement", styles['Heading2']))

    zero_loss_text = """The Zero-Loss Enforcement mechanism ensures that the system maintains strict risk controls
    to prevent capital loss. This includes dynamic stop-loss adjustment, break-even stop movement after partial
    profits, position sizing based on risk parameters, and trade abandonment when risk exceeds reward."""
    story.append(Paragraph(zero_loss_text, styles['BodyText']))

    # Create and add zero-loss visualization
    def create_zero_loss_viz():
        """Create a visualization of the Zero-Loss Enforcement mechanism"""
        img_path = os.path.join(IMAGE_DIR, 'zero_loss.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=100)

        # Generate price data
        np.random.seed(42)  # For reproducibility
        n_points = 100

        # Create price data with a trend
        t = np.linspace(0, 10, n_points)
        price = 100 + np.cumsum(np.random.normal(0.05, 0.2, n_points))

        # Plot price
        ax.plot(t, price, color=OMNI_COLORS['dark_blue'], linewidth=2, label='Asset Price')

        # Add entry point
        entry_idx = 10
        entry_price = price[entry_idx]
        ax.scatter(t[entry_idx], entry_price, color=OMNI_COLORS['green'], s=100, marker='^',
                  label='Entry Point')

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
                ax.text(t[phase["start_idx"]+5], phase["level"]-0.5,
                       "Trailing Stop", color=OMNI_COLORS['red'], fontsize=8)

        # Add partial profit taking points
        profit_points = [
            {"idx": entry_idx+25, "amount": "25%"},
            {"idx": entry_idx+45, "amount": "25%"},
            {"idx": entry_idx+65, "amount": "25%"}
        ]

        for point in profit_points:
            ax.scatter(t[point["idx"]], price[point["idx"]], color=OMNI_COLORS['gold'], s=80, marker='d')
            ax.text(t[point["idx"]], price[point["idx"]]+1,
                   f"Take {point['amount']} Profit", color=OMNI_COLORS['gold'], fontsize=8,
                   ha='center', va='bottom')

        # Add final exit
        exit_idx = n_points - 10
        ax.scatter(t[exit_idx], price[exit_idx], color=OMNI_COLORS['red'], s=100, marker='v',
                  label='Final Exit (25%)')

        # Add annotations
        ax.annotate("Break-Even Point",
                   xy=(t[entry_idx+30], entry_price),
                   xytext=(t[entry_idx+30]-1, entry_price-3),
                   arrowprops=dict(facecolor=OMNI_COLORS['green'], shrink=0.05, width=1.5),
                   color=OMNI_COLORS['green'], fontsize=8)

        ax.annotate("Risk Eliminated",
                   xy=(t[entry_idx+40], entry_price),
                   xytext=(t[entry_idx+40]+1, entry_price-3),
                   arrowprops=dict(facecolor=OMNI_COLORS['green'], shrink=0.05, width=1.5),
                   color=OMNI_COLORS['green'], fontsize=8)

        # Add labels
        ax.set_xlabel('Time', fontsize=12)
        ax.set_ylabel('Price', fontsize=12)
        ax.set_title('Zero-Loss Enforcement: Dynamic Stop-Loss and Partial Profit Taking', fontsize=14)
        ax.legend(loc='upper left')
        ax.grid(True, alpha=0.3)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add zero-loss visualization
    story.append(Spacer(1, 0.3*inch))
    zero_loss_img_path = create_zero_loss_viz()
    zero_loss_img = RLImage(zero_loss_img_path, width=6*inch, height=4.5*inch)
    story.append(zero_loss_img)
    story.append(Paragraph("Figure 10: Zero-Loss Enforcement with Dynamic Stop-Loss and Partial Profit Taking", styles['Caption']))

    # Add position sizing subsection
    story.append(Paragraph("5.2 Position Sizing", styles['Heading2']))

    position_sizing_text = """OMNI employs sophisticated position sizing algorithms that balance risk and reward to
    optimize capital growth. The system uses a combination of fixed-fractional position sizing, volatility-adjusted
    position sizing, and confidence-based position sizing to determine the optimal trade size."""
    story.append(Paragraph(position_sizing_text, styles['BodyText']))

    # Add mathematical representation of position sizing
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("The position size for a trade is calculated using the following formula:", styles['BodyText']))

    # Add LaTeX equation for position sizing
    position_sizing_eq = r"Position Size = \frac{Capital \times Risk\% \times Confidence}{ATR \times ATR Multiplier}"
    # Note: We'll implement the LaTeX rendering in a later step
    story.append(Paragraph("Position Size = (Capital × Risk% × Confidence) / (ATR × ATR Multiplier)", styles['BodyText']))
    story.append(Spacer(1, 0.1*inch))

    position_eq_explanation = """Where:
    • Capital is the current account balance
    • Risk% is the percentage of capital risked per trade (typically 1-2%)
    • Confidence is the confidence score from the Quantum Predictor (0.5-1.0)
    • ATR is the Average True Range, a measure of volatility
    • ATR Multiplier is a scaling factor based on market conditions"""
    story.append(Paragraph(position_eq_explanation, styles['BodyTextIndent']))

    # Create and add position sizing visualization
    def create_position_sizing_viz():
        """Create a visualization of position sizing strategies"""
        img_path = os.path.join(IMAGE_DIR, 'position_sizing.png')

        # Create figure with 2x2 subplots
        fig, axs = plt.subplots(2, 2, figsize=(10, 8))

        # 1. Fixed Fractional Position Sizing
        ax = axs[0, 0]

        # Generate capital growth data
        capital = np.linspace(100, 1000, 10)
        risk_pct = 0.02  # 2% risk

        # Calculate position sizes
        position_sizes = capital * risk_pct

        # Plot
        ax.bar(capital, position_sizes, color=OMNI_COLORS['light_blue'], alpha=0.7)
        ax.set_xlabel('Account Capital', fontsize=10)
        ax.set_ylabel('Position Size', fontsize=10)
        ax.set_title('Fixed Fractional (2% Risk)', fontsize=12)
        ax.grid(True, alpha=0.3)

        # 2. Volatility-Adjusted Position Sizing
        ax = axs[0, 1]

        # Generate volatility data
        volatility = np.linspace(0.5, 5, 10)  # ATR values
        capital = 1000
        risk_pct = 0.02

        # Calculate position sizes
        position_sizes = (capital * risk_pct) / volatility

        # Plot
        ax.bar(volatility, position_sizes, color=OMNI_COLORS['purple'], alpha=0.7)
        ax.set_xlabel('Volatility (ATR)', fontsize=10)
        ax.set_ylabel('Position Size', fontsize=10)
        ax.set_title('Volatility-Adjusted Sizing', fontsize=12)
        ax.grid(True, alpha=0.3)

        # 3. Confidence-Based Position Sizing
        ax = axs[1, 0]

        # Generate confidence data
        confidence = np.linspace(0.5, 1.0, 10)
        capital = 1000
        risk_pct = 0.02
        volatility = 2

        # Calculate position sizes
        position_sizes = (capital * risk_pct * confidence) / volatility

        # Plot
        ax.bar(confidence, position_sizes, color=OMNI_COLORS['green'], alpha=0.7)
        ax.set_xlabel('Confidence Score', fontsize=10)
        ax.set_ylabel('Position Size', fontsize=10)
        ax.set_title('Confidence-Based Sizing', fontsize=12)
        ax.grid(True, alpha=0.3)

        # 4. Combined Approach
        ax = axs[1, 1]

        # Generate sample trades
        trades = [
            {"capital": 500, "volatility": 1.0, "confidence": 0.9, "label": "Trade 1"},
            {"capital": 600, "volatility": 2.0, "confidence": 0.8, "label": "Trade 2"},
            {"capital": 700, "volatility": 1.5, "confidence": 0.7, "label": "Trade 3"},
            {"capital": 800, "volatility": 3.0, "confidence": 0.9, "label": "Trade 4"},
            {"capital": 900, "volatility": 2.5, "confidence": 0.6, "label": "Trade 5"},
            {"capital": 1000, "volatility": 1.0, "confidence": 0.95, "label": "Trade 6"}
        ]

        # Calculate position sizes
        risk_pct = 0.02
        for trade in trades:
            trade["position_size"] = (trade["capital"] * risk_pct * trade["confidence"]) / trade["volatility"]

        # Plot
        labels = [trade["label"] for trade in trades]
        position_sizes = [trade["position_size"] for trade in trades]

        bars = ax.bar(labels, position_sizes, color=OMNI_COLORS['gold'], alpha=0.7)

        # Add data labels
        for i, bar in enumerate(bars):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                   f'C:{trades[i]["confidence"]:.1f}, V:{trades[i]["volatility"]:.1f}',
                   ha='center', va='bottom', fontsize=8, rotation=90)

        ax.set_xlabel('Sample Trades', fontsize=10)
        ax.set_ylabel('Position Size', fontsize=10)
        ax.set_title('Combined Position Sizing Approach', fontsize=12)
        ax.grid(True, alpha=0.3)

        # Adjust layout
        plt.tight_layout()

        # Add overall title
        fig.suptitle('OMNI Position Sizing Strategies', fontsize=16, y=1.02)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add position sizing visualization
    story.append(Spacer(1, 0.3*inch))
    position_sizing_img_path = create_position_sizing_viz()
    position_sizing_img = RLImage(position_sizing_img_path, width=6*inch, height=4.8*inch)
    story.append(position_sizing_img)
    story.append(Paragraph("Figure 11: OMNI Position Sizing Strategies", styles['Caption']))

    story.append(PageBreak())

    # Add conclusion section
    story.append(Paragraph("6. Conclusion", styles['Heading1']))

    conclusion_text = """The OMNI-ALPHA VΩ∞∞ Trading System represents a significant advancement in automated trading
    technology, combining quantum-inspired algorithms, multi-agent AI systems, and sophisticated risk management
    to achieve consistent profitability with minimal starting capital. By starting with minimal capital and
    employing its zero-loss enforcement mechanisms, OMNI demonstrates that profitable trading is possible without
    large initial investments.

    The system's self-evolving nature ensures that it will continue to improve over time, adapting to changing
    market conditions and learning from each trade. As quantum computing technology advances, OMNI is well-positioned
    to incorporate true quantum algorithms, further enhancing its predictive capabilities and trading performance.

    The multi-agent architecture provides redundancy, specialization, and collaborative decision-making that
    surpasses the capabilities of traditional algorithmic trading systems. By leveraging principles from quantum
    computing, hyperdimensional computing, and advanced risk management, OMNI achieves a level of sophistication
    and adaptability that represents the future of automated trading."""
    story.append(Paragraph(conclusion_text, styles['BodyText']))

    # Create and add future roadmap visualization
    def create_roadmap_viz():
        """Create a visualization of the OMNI future roadmap"""
        img_path = os.path.join(IMAGE_DIR, 'roadmap.png')

        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6), dpi=100)

        # Define roadmap milestones
        milestones = [
            {"phase": "Current", "features": [
                "Multi-Agent Architecture",
                "Quantum-Inspired Prediction",
                "Zero-Loss Enforcement",
                "Hyperdimensional Computing"
            ]},
            {"phase": "Phase 2", "features": [
                "Advanced Pattern Recognition",
                "Enhanced Memory Systems",
                "Multi-Exchange Support",
                "Improved Risk Management"
            ]},
            {"phase": "Phase 3", "features": [
                "True Quantum Computing Integration",
                "Cross-Asset Correlation Analysis",
                "Adaptive Learning Algorithms",
                "Institutional-Grade Infrastructure"
            ]},
            {"phase": "Vision", "features": [
                "Autonomous Financial Intelligence",
                "Quantum Advantage Trading",
                "Global Market Integration",
                "Self-Evolving Trading Strategies"
            ]}
        ]

        # Define colors for each phase
        colors = [
            OMNI_COLORS['dark_blue'],
            OMNI_COLORS['light_blue'],
            OMNI_COLORS['purple'],
            OMNI_COLORS['gold']
        ]

        # Create a horizontal timeline
        n_phases = len(milestones)
        phase_positions = np.linspace(0.1, 0.9, n_phases)

        # Draw timeline
        ax.plot([0.05, 0.95], [0.5, 0.5], 'k-', linewidth=2, alpha=0.7)

        # Add milestones
        for i, (pos, milestone, color) in enumerate(zip(phase_positions, milestones, colors)):
            # Add milestone circle
            circle = plt.Circle((pos, 0.5), 0.03, color=color, alpha=0.8)
            ax.add_patch(circle)

            # Add phase label
            ax.text(pos, 0.6, milestone["phase"], ha='center', va='bottom',
                   fontsize=12, fontweight='bold', color=color)

            # Add features above or below the timeline
            if i % 2 == 0:  # Even indices go above
                y_start = 0.65
                y_step = 0.07
                alignment = 'bottom'
            else:  # Odd indices go below
                y_start = 0.35
                y_step = -0.07
                alignment = 'top'

            # Add feature box
            feature_box = plt.Rectangle((pos-0.1, y_start), 0.2, len(milestone["features"]) * abs(y_step),
                                      color=color, alpha=0.1)
            ax.add_patch(feature_box)

            # Add features
            for j, feature in enumerate(milestone["features"]):
                y_pos = y_start + j * y_step
                ax.text(pos, y_pos, feature, ha='center', va=alignment,
                       fontsize=10, color='black')

        # Add title
        ax.text(0.5, 0.9, "OMNI-ALPHA VΩ∞∞ Future Roadmap",
               ha='center', va='center', fontsize=16, fontweight='bold',
               bbox=dict(facecolor='white', alpha=0.8, boxstyle='round,pad=0.2'))

        # Remove axes
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        # Save the figure
        plt.savefig(img_path, dpi=100, bbox_inches='tight')
        plt.close()

        return img_path

    # Add roadmap visualization
    story.append(Spacer(1, 0.3*inch))
    roadmap_img_path = create_roadmap_viz()
    roadmap_img = RLImage(roadmap_img_path, width=6*inch, height=3.6*inch)
    story.append(roadmap_img)
    story.append(Paragraph("Figure 12: OMNI-ALPHA VΩ∞∞ Future Roadmap", styles['Caption']))

    # Build the document
    doc.build(story)
    print("  Whitepaper saved as omni_whitepaper.pdf")

    # Move the file to the docs directory
    os.rename("omni_whitepaper.pdf", os.path.join(os.path.dirname(os.path.abspath(__file__)), "omni_whitepaper.pdf"))

# Main function to generate all documents
def generate_all_documents():
    """Generate all OMNI documentation"""
    # Generate common images
    print("Generating common images...")
    logo_path = generate_omni_logo('omni_logo.png')
    bg_path = generate_quantum_background('quantum_bg.png')
    agent_network_path = generate_agent_network('agent_network.png')

    # Generate whitepaper
    print("Generating whitepaper...")
    generate_whitepaper(logo_path, bg_path, agent_network_path)

    # Generate overview
    print("Generating overview...")
    generate_overview(logo_path, bg_path, agent_network_path)

    # Generate mindmap
    print("Generating mindmap...")
    generate_mindmap(logo_path, bg_path)

    print("All documents generated successfully!")

if __name__ == "__main__":
    # Install required packages if not already installed
    try:
        import matplotlib
        import numpy
        import networkx
        import reportlab
        import PIL
    except ImportError:
        print("Installing required packages...")
        os.system("pip install matplotlib numpy networkx reportlab pillow")

    # Generate all documents
    generate_all_documents()
