#!/bin/bash

# Script to compile LaTeX document into PDF

echo "Compiling LaTeX document into PDF..."

# Change to the docs directory
cd /home/ubuntu/Sandeep/projects/omni/docs

# Run pdflatex twice to ensure references are properly resolved
pdflatex -interaction=nonstopmode whitepaper_latex.tex
pdflatex -interaction=nonstopmode whitepaper_latex.tex

# Check if compilation was successful
if [ -f whitepaper_latex.pdf ]; then
    echo "PDF successfully generated: whitepaper_latex.pdf"
    # Rename the file to a more appropriate name
    mv whitepaper_latex.pdf omni_whitepaper_advanced.pdf
    echo "Renamed to: omni_whitepaper_advanced.pdf"
else
    echo "Error: PDF generation failed."
    exit 1
fi

# Clean up auxiliary files
echo "Cleaning up auxiliary files..."
rm -f whitepaper_latex.aux whitepaper_latex.log whitepaper_latex.out whitepaper_latex.toc

echo "Done!"
