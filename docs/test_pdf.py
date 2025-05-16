#!/usr/bin/env python3
"""
Test PDF generation
"""

import os
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.units import inch

# Directory for storing generated images
IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
os.makedirs(IMAGE_DIR, exist_ok=True)

def generate_test_image():
    """Generate a test image"""
    img_path = os.path.join(IMAGE_DIR, 'test_image.png')
    
    # Create figure
    fig, ax = plt.subplots(figsize=(8, 6), dpi=100)
    
    # Generate some data
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    
    # Plot data
    ax.plot(x, y, 'b-')
    
    # Add labels
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_title('Test Plot')
    
    # Save the figure
    plt.savefig(img_path, dpi=100, bbox_inches='tight')
    plt.close()
    
    return img_path

def generate_test_pdf():
    """Generate a test PDF"""
    print("Generating test PDF...")
    
    # Generate test image
    img_path = generate_test_image()
    
    # Create the document
    doc = SimpleDocTemplate(
        "test.pdf",
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create story (content)
    story = []
    
    # Add title
    story.append(Paragraph("Test PDF", styles['Title']))
    story.append(Spacer(1, 0.5*inch))
    
    # Add some text
    story.append(Paragraph("This is a test PDF document.", styles['Normal']))
    story.append(Spacer(1, 0.5*inch))
    
    # Add image
    img = Image(img_path, width=6*inch, height=4.5*inch)
    story.append(img)
    
    # Build the document
    doc.build(story)
    print("Test PDF generated successfully!")

if __name__ == "__main__":
    generate_test_pdf()
