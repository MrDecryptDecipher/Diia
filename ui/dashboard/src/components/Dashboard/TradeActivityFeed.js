import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  CallMade as EntryIcon,
  CallReceived as ExitIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';

const TradeActivityFeed = ({ events = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Handle click
  const handleClick = (id) => {
    navigate(`/trades/${id}`);
  };
  
  return (
    <List sx={{ p: 0 }}>
      {events.length === 0 ? (
        <ListItem sx={{ px: 2, py: 3 }}>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                No recent trade activity
              </Typography>
            }
          />
        </ListItem>
      ) : (
        events.map((event, index) => (
          <React.Fragment key={index}>
            <ListItem
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
              onClick={() => handleClick(event.id)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: event.type === 'entry'
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    color: event.type === 'entry'
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                  }}
                >
                  {event.type === 'entry' ? <EntryIcon /> : <ExitIcon />}
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.type === 'entry' ? 'New Trade' : 'Trade Exit'}: {event.symbol}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatRelativeTime(event.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Chip
                      size="small"
                      label={event.direction}
                      color={event.direction === 'long' ? 'success' : 'error'}
                      sx={{ height: 20, mr: 1, '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' } }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatCurrency(event.price)} × {event.size.toFixed(4)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    {event.reason}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    Agent: {event.agent}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
            {index < events.length - 1 && (
              <Divider sx={{ opacity: 0.1 }} />
            )}
          </React.Fragment>
        ))
      )}
    </List>
  );
};

export default TradeActivityFeed;
