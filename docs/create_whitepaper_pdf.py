#!/usr/bin/env python3
"""
Create PDF whitepaper using ReportLab
"""

import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

def create_whitepaper_pdf(md_file, pdf_file):
    """Create PDF whitepaper from Markdown file"""
    print(f"Creating PDF whitepaper from {md_file}...")

    # Read Markdown file
    with open(md_file, 'r') as f:
        md_content = f.read()

    # Create the document
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Update existing styles
    styles['Title'].fontSize = 24
    styles['Title'].leading = 28
    styles['Title'].alignment = TA_CENTER
    styles['Title'].spaceAfter = 20
    styles['Title'].textColor = colors.Color(51/255, 0/255, 102/255)  # dark purple

    styles['Heading1'].fontSize = 16
    styles['Heading1'].leading = 20
    styles['Heading1'].textColor = colors.Color(51/255, 0/255, 102/255)  # dark purple

    styles['Heading2'].fontSize = 14
    styles['Heading2'].leading = 18
    styles['Heading2'].textColor = colors.Color(0/255, 51/255, 102/255)  # dark blue

    styles['Heading3'].fontSize = 12
    styles['Heading3'].leading = 16
    styles['Heading3'].textColor = colors.Color(0/255, 51/255, 102/255)  # dark blue

    # Create new styles
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.Color(0/255, 51/255, 102/255)  # dark blue
    ))

    # Update existing BodyText style
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].fontSize = 11
    styles['BodyText'].leading = 14

    styles.add(ParagraphStyle(
        name='BodyTextIndent',
        parent=styles['BodyText'],
        leftIndent=20
    ))

    styles.add(ParagraphStyle(
        name='CodeBlock',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Courier',
        leftIndent=20,
        rightIndent=20
    ))

    styles.add(ParagraphStyle(
        name='Abstract',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        leftIndent=30,
        rightIndent=30
    ))

    # Create story (content)
    story = []

    # Parse Markdown content
    lines = md_content.split('\n')
    i = 0
    in_code_block = False
    code_block_content = []

    while i < len(lines):
        line = lines[i]

        # Title (# Heading)
        if line.startswith('# '):
            story.append(Paragraph(line[2:], styles['Title']))

        # Subtitle (## Heading)
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], styles['Subtitle']))

        # Heading 1 (### Heading)
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], styles['Heading1']))

        # Heading 2 (#### Heading)
        elif line.startswith('#### '):
            story.append(Paragraph(line[5:], styles['Heading2']))

        # Heading 3 (##### Heading)
        elif line.startswith('##### '):
            story.append(Paragraph(line[6:], styles['Heading3']))

        # Horizontal rule
        elif line.startswith('---'):
            story.append(Spacer(1, 0.2*inch))

        # Code block
        elif line.startswith('```'):
            if in_code_block:
                # End of code block
                in_code_block = False
                code_text = '\n'.join(code_block_content)
                story.append(Paragraph(code_text, styles['CodeBlock']))
                code_block_content = []
            else:
                # Start of code block
                in_code_block = True

        elif in_code_block:
            # Add line to code block
            code_block_content.append(line)

        # Bullet point
        elif line.startswith('- '):
            story.append(Paragraph('• ' + line[2:], styles['BodyTextIndent']))

        # Numbered list
        elif re.match(r'^\d+\. ', line):
            story.append(Paragraph(line, styles['BodyTextIndent']))

        # Regular paragraph
        elif line.strip() != '':
            # Check if this is part of the abstract
            if i > 0 and lines[i-1].startswith('## Abstract'):
                story.append(Paragraph(line, styles['Abstract']))
            else:
                # Check if this is a bold heading (e.g., **Primary Function:**)
                if line.startswith('**') and ':**' in line:
                    parts = line.split(':**', 1)
                    heading = parts[0][2:] + ':'
                    content = parts[1] if len(parts) > 1 else ''
                    story.append(Paragraph(f"<b>{heading}</b>{content}", styles['BodyText']))
                else:
                    story.append(Paragraph(line, styles['BodyText']))

        # Empty line
        elif i > 0 and lines[i-1].strip() != '':
            story.append(Spacer(1, 0.1*inch))

        i += 1

    # Build the document
    doc.build(story)
    print(f"PDF whitepaper saved as {pdf_file}")

if __name__ == "__main__":
    md_file = "/home/ubuntu/Sandeep/projects/omni/docs/ultimate_whitepaper.md"
    pdf_file = "/home/ubuntu/Sandeep/projects/omni/docs/OMNI-ALPHA_Whitepaper.pdf"
    create_whitepaper_pdf(md_file, pdf_file)
