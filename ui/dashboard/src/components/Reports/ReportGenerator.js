import React, { useState } from 'react';
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
  Divider,
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

  const handleDownloadPDF = () => {
    setIsGenerating(true);

    const reportElement = document.getElementById('report-preview');

    if (!reportElement) {
      setSnackbar({
        open: true,
        message: 'Error: Report preview not found',
        severity: 'error'
      });
      setIsGenerating(false);
      return;
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 128);
    pdf.text(reportTypes[reportType].label, margin, margin + 10);

    // Add date
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 20);

    // Add timeframe
    let timeframeText = `Timeframe: ${timeframes.find(t => t.value === timeframe).label}`;
    if (timeframe === 'custom' && startDate && endDate) {
      timeframeText += ` (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
    }
    pdf.text(timeframeText, margin, margin + 30);

    // Capture the report content
    html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');

      // Calculate aspect ratio to fit in PDF
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', margin, margin + 40, imgWidth, imgHeight);

      // Save PDF
      pdf.save(`OMNI_${reportTypes[reportType].label.replace(/\\s+/g, '_')}_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`);

      setIsGenerating(false);
      setSnackbar({
        open: true,
        message: 'PDF downloaded successfully!',
        severity: 'success'
      });
    }).catch(error => {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
      setSnackbar({
        open: true,
        message: 'Error generating PDF',
        severity: 'error'
      });
    });
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
              startIcon={<VisibilityIcon />}
              onClick={handleGenerateReport}
              disabled={isGenerating || (timeframe === 'custom' && (startDate === '' || endDate === ''))}
            >
              {isGenerating ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={isGenerating || !previewMode}
            >
              Download PDF
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
                color: '#000'
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
