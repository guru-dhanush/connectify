import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import { green, red } from '@mui/material/colors';

const StatusLogger = ({ logs }) => {
  const getStatusColor = (log) => {
    if (log.includes('Error:')) {
      return red[500];
    }
    if (log.includes('completed successfully')) {
      return green[500];
    }
    return 'inherit';
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Status
      </Typography>
      <List>
        {logs.map((log, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={log}
              sx={{
                color: getStatusColor(log),
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StatusLogger;
