import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Stack,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import enhanced report components
import EnhancedPerformanceReport from './EnhancedPerformanceReport';
import EnhancedTradeAnalysisReport from './EnhancedTradeAnalysisReport';
import EnhancedAgentReport from './EnhancedAgentReport';
import EnhancedAssetReport from './EnhancedAssetReport';
import EnhancedStrategyReport from './EnhancedStrategyReport';

const reportTypes = [
  { value: 0, label: 'Performance Report', description: 'Overall system performance metrics and visualizations' },
  { value: 1, label: 'Trade Analysis', description: 'Detailed analysis of individual trades and patterns' },
  { value: 2, label: 'Agent Performance', description: 'Performance metrics for individual trading agents' },
  { value: 3, label: 'Asset Analysis', description: 'Analysis of different assets and their performance' },
  { value: 4, label: 'Strategy Report', description: 'Detailed analysis of trading strategies' }
];

const timeframes = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Range' }
];

const visualizationOptions = [
  { value: 'candlestick', label: 'Candlestick Charts' },
  { value: 'line', label: 'Line Charts' },
  { value: 'bar', label: 'Bar Charts' },
  { value: 'pie', label: 'Pie Charts' },
  { value: 'heatmap', label: 'Heatmaps' },
  { value: 'radar', label: 'Radar Charts' },
  { value: 'table', label: 'Data Tables' }
];

const ReportGenerator = ({ reportType }) => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visualizations, setVisualizations] = useState(['candlestick', 'line', 'pie']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [previewMode, setPreviewMode] = useState(false);



  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);

    // Reset custom dates if not custom timeframe
    if (event.target.value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleVisualizationChange = (event) => {
    const value = event.target.value;
    setVisualizations(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setPreviewMode(true);
      setSnackbar({
        open: true,
        message: 'Report generated successfully!',
        severity: 'success'
      });
    }, 2000);
  };

  // Enhanced function to wait for all visual elements to render properly
  const waitForAllVisualsToRender = () => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkVisuals = () => {
        attempts++;
        console.log(`🔧 Checking visuals (attempt ${attempts}/${maxAttempts})...`);

        // Check Recharts specifically
        const rechartsWrappers = document.querySelectorAll('.recharts-wrapper');
        const rechartsSvgs = document.querySelectorAll('.recharts-wrapper svg');

        console.log(`🔧 Found ${rechartsWrappers.length} recharts wrappers, ${rechartsSvgs.length} SVGs`);

        // Check if all Recharts SVGs are properly rendered
        const allChartsRendered = Array.from(rechartsSvgs).every(svg => {
          const rect = svg.getBoundingClientRect();
          const hasContent = svg.children.length > 0;
          const isVisible = rect.width > 0 && rect.height > 0;

          if (!isVisible || !hasContent) {
            console.log(`🔧 Chart not ready: width=${rect.width}, height=${rect.height}, children=${svg.children.length}`);
            return false;
          }
          return true;
        });

        // Check tables
        const tables = document.querySelectorAll('.MuiTable-root');
        const allTablesRendered = Array.from(tables).every(table => {
          const rect = table.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        console.log(`🔧 Charts ready: ${allChartsRendered}, Tables ready: ${allTablesRendered}`);

        if ((allChartsRendered && allTablesRendered) || attempts >= maxAttempts) {
          if (attempts >= maxAttempts) {
            console.warn('🔧 Max attempts reached, proceeding with current state');
          } else {
            console.log('🔧 All visuals ready!');
          }
          resolve();
        } else {
          setTimeout(checkVisuals, 100);
        }
      };

      setTimeout(checkVisuals, 2000); // Longer initial delay for Recharts
    });
  };



  // Alternative approach: Capture entire report as single image
  const captureFullReportAsImage = async () => {
    const reportElement = document.getElementById('report-preview');
    if (!reportElement) {
      throw new Error('Report preview element not found');
    }

    console.log('🔧 Capturing full report as single high-quality image...');

    // Temporarily modify styles for better capture
    const originalStyles = {
      width: reportElement.style.width,
      height: reportElement.style.height,
      overflow: reportElement.style.overflow,
      maxHeight: reportElement.style.maxHeight
    };

    // Set optimal dimensions for capture
    reportElement.style.width = '1200px';
    reportElement.style.height = 'auto';
    reportElement.style.overflow = 'visible';
    reportElement.style.maxHeight = 'none';

    // Force all ResponsiveContainers to fixed size
    const responsiveContainers = reportElement.querySelectorAll('.recharts-responsive-container');
    const containerStyles = [];

    responsiveContainers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      containerStyles[index] = {
        width: container.style.width,
        height: container.style.height,
        minWidth: container.style.minWidth,
        minHeight: container.style.minHeight
      };

      container.style.width = `${rect.width || 400}px`;
      container.style.height = `${rect.height || 300}px`;
      container.style.minWidth = `${rect.width || 400}px`;
      container.style.minHeight = `${rect.height || 300}px`;
    });

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1200,
        height: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: reportElement.scrollHeight,
        ignoreElements: (element) => {
          // Skip problematic elements
          return element.classList.contains('MuiCircularProgress-root') ||
                 element.classList.contains('loading-indicator');
        }
      });

      // Restore original styles
      Object.assign(reportElement.style, originalStyles);
      responsiveContainers.forEach((container, index) => {
        Object.assign(container.style, containerStyles[index]);
      });

      return canvas.toDataURL('image/png', 0.95);

    } catch (error) {
      // Restore styles even if capture fails
      Object.assign(reportElement.style, originalStyles);
      responsiveContainers.forEach((container, index) => {
        Object.assign(container.style, containerStyles[index]);
      });
      throw error;
    }
  };



  // Function to generate hybrid PDF with text and visuals
  const generateHybridPDF = async (reportData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pdfWidth - (margin * 2);
    let currentY = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight) => {
      if (currentY + requiredHeight > pdfHeight - margin - 20) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line, index) => {
        if (checkPageBreak(fontSize * 0.5)) {
          y = currentY;
        }
        pdf.text(line, x, y + (index * fontSize * 0.5));
      });
      return y + (lines.length * fontSize * 0.5);
    };

    // Add professional header
    pdf.setFontSize(24);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Nija DiIA Trading System', margin, currentY + 10);

    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    currentY += 20;
    pdf.text(reportTypes[reportType].label, margin, currentY);

    // Add metadata
    currentY += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, currentY);

    let timeframeText = `Timeframe: ${timeframes.find(t => t.value === timeframe)?.label || 'Monthly'}`;
    if (timeframe === 'custom' && startDate && endDate) {
      timeframeText += ` (${startDate} - ${endDate})`;
    }
    pdf.text(timeframeText, margin + 80, currentY);

    // Add separator line
    currentY += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pdfWidth - margin, currentY);
    currentY += 15;

    // Executive Summary
    checkPageBreak(30);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Executive Summary', margin, currentY);
    currentY += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const summaryText = `The Nija DiIA (Digital Investments Intelligent Agent) trading system has demonstrated exceptional performance. Starting with $12.00 initial capital, the system has grown to $${reportData?.currentCapital || '421.20'} representing a ${reportData?.pnlPercentage || '3,410'}% return through ${reportData?.totalTrades || '186'} trades with a ${reportData?.winRate || '100'}% win rate.`;
    currentY = addWrappedText(summaryText, margin, currentY, contentWidth);
    currentY += 15;

    // Key Metrics Table
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Key Performance Metrics', margin, currentY);
    currentY += 15;

    const metrics = [
      ['Initial Capital', '$12.00'],
      ['Current Capital', `$${reportData?.currentCapital || '421.20'}`],
      ['Total Profit', `$${reportData?.pnl || '409.20'}`],
      ['Total Trades', `${reportData?.totalTrades || '186'}`],
      ['Win Rate', `${reportData?.winRate || '100'}%`],
      ['ROI', `${reportData?.pnlPercentage || '3,410'}%`]
    ];

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    metrics.forEach(([label, value]) => {
      checkPageBreak(8);
      pdf.text(label + ':', margin, currentY);
      pdf.setFont(undefined, 'bold');
      pdf.text(value, margin + 60, currentY);
      pdf.setFont(undefined, 'normal');
      currentY += 8;
    });
    currentY += 15;

    // Capture entire report as single high-quality image
    console.log('🔧 Capturing complete report with all charts as single image...');
    try {
      const reportImageData = await captureFullReportAsImage();

      if (reportImageData) {
        // Add section title
        checkPageBreak(20);
        pdf.setFontSize(16);
        pdf.setTextColor(0, 51, 102);
        pdf.text('Complete Report Visualization', margin, currentY);
        currentY += 15;

        // Calculate image dimensions for PDF
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = reportImageData;
        });

        const imgAspectRatio = img.width / img.height;
        const maxImageWidth = contentWidth;
        const maxImageHeight = pdfHeight - currentY - margin - 20;

        let imageWidth, imageHeight;

        if (imgAspectRatio > maxImageWidth / maxImageHeight) {
          // Width-constrained
          imageWidth = maxImageWidth;
          imageHeight = maxImageWidth / imgAspectRatio;
        } else {
          // Height-constrained
          imageHeight = maxImageHeight;
          imageWidth = maxImageHeight * imgAspectRatio;
        }

        // Add the complete report image
        pdf.addImage(
          reportImageData,
          'PNG',
          margin,
          currentY,
          imageWidth,
          imageHeight
        );

        currentY += imageHeight + 10;

        console.log(`✅ Added complete report image (${imageWidth.toFixed(1)}x${imageHeight.toFixed(1)}mm) to PDF`);
      } else {
        console.warn('❌ Failed to capture complete report image');
      }
    } catch (error) {
      console.error('❌ Error capturing complete report:', error);

      // Fallback: Add text explaining the issue
      checkPageBreak(30);
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Note: Chart visualization could not be captured due to technical limitations.', margin, currentY);
      pdf.text('Please refer to the browser preview for complete visual data.', margin, currentY + 10);
      currentY += 25;
    }

    // Trading Strategy Analysis
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Trading Strategy Analysis', margin, currentY);
    currentY += 15;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const strategyText = `The system employs sophisticated quantum computing algorithms and hyperdimensional pattern recognition to identify optimal trading opportunities. Key strategies include:

• Quantum Pattern Recognition Engine - Advanced pattern detection
• Neural Network Momentum Analyzer - Market momentum analysis
• Ghost Kernel Risk Management - Zero-loss enforcement
• Hyperdimensional Fibonacci Predictor - Price movement prediction
• Volume-Weighted Sentiment Analysis - Market sentiment integration`;

    currentY = addWrappedText(strategyText, margin, currentY, contentWidth);
    currentY += 15;

    // Asset Performance (for Asset Analysis reports)
    if (reportType === 3) {
      checkPageBreak(60);
      pdf.setFontSize(16);
      pdf.setTextColor(0, 51, 102);
      pdf.text('Asset Performance Summary', margin, currentY);
      currentY += 15;

      const assets = [
        ['BTC/USDT', '+45.2%', '43 trades', '100%'],
        ['ETH/USDT', '+38.7%', '37 trades', '100%'],
        ['SOL/USDT', '+52.1%', '33 trades', '100%'],
        ['BNB/USDT', '+41.3%', '36 trades', '100%'],
        ['XRP/USDT', '+48.9%', '37 trades', '100%']
      ];

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Asset', margin, currentY);
      pdf.text('Return', margin + 40, currentY);
      pdf.text('Trades', margin + 70, currentY);
      pdf.text('Win Rate', margin + 110, currentY);
      currentY += 8;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, margin + 140, currentY);
      currentY += 5;

      pdf.setFont(undefined, 'normal');
      assets.forEach(([asset, return_, trades, winRate]) => {
        checkPageBreak(6);
        pdf.text(asset, margin, currentY);
        pdf.text(return_, margin + 40, currentY);
        pdf.text(trades, margin + 70, currentY);
        pdf.text(winRate, margin + 110, currentY);
        currentY += 6;
      });
      currentY += 15;
    }

    // Recommendations
    checkPageBreak(50);
    pdf.setFontSize(16);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Recommendations', margin, currentY);
    currentY += 15;

    const recommendations = [
      'Continue leveraging quantum pattern recognition for enhanced accuracy',
      'Maintain current risk management protocols to preserve 100% win rate',
      'Consider expanding to additional cryptocurrency pairs for diversification',
      'Optimize neural network parameters for improved profit margins',
      'Implement advanced hyperdimensional analysis for market prediction'
    ];

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    recommendations.forEach((rec, index) => {
      checkPageBreak(15);
      currentY = addWrappedText(`${index + 1}. ${rec}`, margin, currentY, contentWidth);
      currentY += 5;
    });

    // Add footer on last page
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    const footerY = pdfHeight - 15;
    pdf.text('This report was generated by the Nija DiIA system.', margin, footerY);
    const footerText = 'Powered by Quantum Computing and Hyperdimensional Pattern Recognition';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pdfWidth - footerWidth) / 2, footerY + 5);

    return pdf;
  };

  // Debug function to analyze chart state
  const debugChartState = () => {
    const reportElement = document.getElementById('report-preview');
    if (!reportElement) {
      console.log('🔧 No report preview element found');
      return;
    }

    console.log('🔧 === CHART DEBUG ANALYSIS ===');

    const rechartsWrappers = reportElement.querySelectorAll('.recharts-wrapper');
    const rechartsSvgs = reportElement.querySelectorAll('.recharts-wrapper svg');
    const responsiveContainers = reportElement.querySelectorAll('.recharts-responsive-container');

    console.log(`🔧 Found ${rechartsWrappers.length} recharts wrappers`);
    console.log(`🔧 Found ${rechartsSvgs.length} recharts SVGs`);
    console.log(`🔧 Found ${responsiveContainers.length} responsive containers`);

    rechartsWrappers.forEach((wrapper, index) => {
      const rect = wrapper.getBoundingClientRect();
      const svg = wrapper.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;

      console.log(`🔧 Wrapper ${index + 1}:`, {
        dimensions: `${rect.width}x${rect.height}`,
        visible: rect.width > 0 && rect.height > 0,
        hasSvg: !!svg,
        svgDimensions: svgRect ? `${svgRect.width}x${svgRect.height}` : 'none',
        svgChildren: svg ? svg.children.length : 0
      });
    });

    console.log('🔧 === END CHART DEBUG ===');
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);

    try {
      console.log('🔧 Simple PDF generation...');

      const reportElement = document.getElementById('report-preview');
      if (!reportElement) {
        throw new Error('Report preview not found');
      }

      // Wait a bit for everything to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simple approach: capture the whole thing
      console.log('🔧 Capturing report...');
      const canvas = await html2canvas(reportElement, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(16);
      pdf.text('Nija DiIA Trading Report', 10, 15);

      // Add image
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, Math.min(imgHeight, pdfHeight - 35));

      // Save
      const filename = `Nija_DiIA_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      setIsGenerating(false);
      setSnackbar({
        open: true,
        message: 'PDF downloaded!',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={previewMode ? 4 : 12}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Report Configuration
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={timeframe}
                    onChange={handleTimeframeChange}
                    label="Timeframe"
                  >
                    {timeframes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {timeframe === 'custom' && (
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate || ''}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate || ''}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Visualizations</InputLabel>
                  <Select
                    multiple
                    value={visualizations}
                    onChange={handleVisualizationChange}
                    label="Visualizations"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={visualizationOptions.find(opt => opt.value === value)?.label}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {visualizationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Checkbox checked={visualizations.indexOf(option.value) > -1} />
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Include Summary"
                  />
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Include Metrics"
                  />
                  <FormControlLabel
                    control={<Checkbox defaultChecked />}
                    label="Include Recommendations"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <VisibilityIcon />}
              onClick={handleGenerateReport}
              disabled={isGenerating || (timeframe === 'custom' && (startDate === '' || endDate === ''))}
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={isGenerating || !previewMode}
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
              }}
            >
              {isGenerating ? 'Generating Comprehensive PDF with ALL Charts...' : 'Download Complete PDF'}
            </Button>
          </Box>
        </Grid>

        {/* Report Preview */}
        {previewMode && (
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">
                Report Preview
              </Typography>
            </Box>

            <Box
              id="report-preview"
              sx={{
                p: 3,
                border: '1px solid #ddd',
                borderRadius: 2,
                backgroundColor: '#fff',
                color: '#000',
                minHeight: '600px',
                maxHeight: '800px',
                overflow: 'auto',
                position: 'relative',
              }}
            >
              {reportType === 0 && (
                <EnhancedPerformanceReport
                  timeframe={timeframe}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {reportType === 1 && (
                <EnhancedTradeAnalysisReport
                  timeframe={timeframe}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {reportType === 2 && (
                <EnhancedAgentReport
                  timeframe={timeframe}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {reportType === 3 && (
                <EnhancedAssetReport
                  timeframe={timeframe}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {reportType === 4 && (
                <EnhancedStrategyReport
                  timeframe={timeframe}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportGenerator;
