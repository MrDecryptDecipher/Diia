#!/usr/bin/env python3
"""
Convert Markdown whitepaper to PDF
"""

import os
import markdown
import pdfkit
from bs4 import BeautifulSoup

def convert_md_to_pdf(md_file, pdf_file):
    """Convert Markdown file to PDF"""
    print(f"Converting {md_file} to {pdf_file}...")
    
    # Read Markdown file
    with open(md_file, 'r') as f:
        md_content = f.read()
    
    # Convert Markdown to HTML
    html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'codehilite'])
    
    # Add CSS styling
    html_styled = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>OMNI-ALPHA VΩ∞∞ Whitepaper</title>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1, h2, h3, h4, h5, h6 {{
                color: #003366;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
            }}
            h1 {{
                font-size: 24px;
                text-align: center;
                color: #330066;
            }}
            h2 {{
                font-size: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }}
            h3 {{
                font-size: 18px;
            }}
            p {{
                margin-bottom: 1em;
                text-align: justify;
            }}
            code {{
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }}
            pre {{
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                font-family: 'Courier New', monospace;
            }}
            blockquote {{
                border-left: 4px solid #ddd;
                padding-left: 10px;
                color: #666;
                margin-left: 0;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
            }}
            hr {{
                border: 0;
                height: 1px;
                background-color: #ddd;
                margin: 2em 0;
            }}
            .title {{
                text-align: center;
                margin-bottom: 2em;
            }}
            .subtitle {{
                text-align: center;
                font-size: 18px;
                color: #666;
                margin-top: -1em;
                margin-bottom: 2em;
            }}
            .abstract {{
                font-style: italic;
                margin: 2em 3em;
            }}
            .toc {{
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 2em;
            }}
            .toc ul {{
                list-style-type: none;
                padding-left: 20px;
            }}
            .toc li {{
                margin-bottom: 5px;
            }}
            .math {{
                font-family: 'Times New Roman', serif;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Create a temporary HTML file
    html_file = md_file.replace('.md', '.html')
    with open(html_file, 'w') as f:
        f.write(html_styled)
    
    # Convert HTML to PDF
    options = {
        'page-size': 'Letter',
        'margin-top': '20mm',
        'margin-right': '20mm',
        'margin-bottom': '20mm',
        'margin-left': '20mm',
        'encoding': 'UTF-8',
        'custom-header': [
            ('Accept-Encoding', 'gzip')
        ],
        'no-outline': None,
        'enable-local-file-access': None
    }
    
    try:
        pdfkit.from_file(html_file, pdf_file, options=options)
        print(f"Successfully converted to {pdf_file}")
    except Exception as e:
        print(f"Error converting to PDF: {e}")
        # If pdfkit fails, try using wkhtmltopdf directly
        try:
            os.system(f"wkhtmltopdf {html_file} {pdf_file}")
            print(f"Successfully converted to {pdf_file} using wkhtmltopdf directly")
        except Exception as e2:
            print(f"Error using wkhtmltopdf directly: {e2}")
    
    # Clean up temporary HTML file
    os.remove(html_file)

if __name__ == "__main__":
    md_file = "/home/ubuntu/Sandeep/projects/omni/docs/ultimate_whitepaper.md"
    pdf_file = "/home/ubuntu/Sandeep/projects/omni/docs/OMNI-ALPHA_Whitepaper.pdf"
    convert_md_to_pdf(md_file, pdf_file)
