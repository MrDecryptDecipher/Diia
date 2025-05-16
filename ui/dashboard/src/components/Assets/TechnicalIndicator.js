import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { ResponsivePie } from '@nivo/pie';

const TechnicalIndicator = ({ title, value, data, color, description }) => {
  const theme = useTheme();

  return (
    <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        action={
          <Chip
            label={typeof value === 'number' ? value.toFixed(2) : value}
            color="primary"
            size="small"
          />
        }
      />
      <CardContent>
        <Box sx={{ height: 120 }}>
          <ResponsivePie
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            innerRadius={0.6}
            padAngle={0.5}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'category10' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            enableArcLabels={false}
            animate={true}
            isInteractive={true}
          />
        </Box>
        {description && (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicator;
