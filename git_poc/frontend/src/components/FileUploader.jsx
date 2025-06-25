import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const FileUploader = ({ selectedFiles, onFilesSelected }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/zip': ['.zip'],
      'application/octet-stream': ['.gitignore'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => {
      // Add new files to existing ones
      const newFiles = [...selectedFiles, ...acceptedFiles];
      onFilesSelected(newFiles);
    },
  });

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'application':
        return '📄';
      default:
        return '📄';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        File Upload
      </Typography>

      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 2,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          transition: 'border-color 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 150
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h5" component="div" sx={{ mb: 2 }}>
          {isDragActive ? (
            <>
              <Typography variant="h4" component="span" color="primary">
                Drop files here
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                or click to select files
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h4" component="span">
                Drag & Drop
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                or click to select files
              </Typography>
            </>
          )}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" align="center">
          Supported formats: ZIP, TXT, PDF, Images, Videos, Audio
        </Typography>
      </Paper>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Selected Files ({selectedFiles.length}):
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => removeFile(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                }
              >
                <ListItemAvatar>
                  <Avatar>{getFileIcon(file)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getFileIcon(file)} {file.name}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(file.size / 1024)} KB
                      </Typography>
                      <Chip
                        label={file.type.split('/')[0]}
                        size="small"
                        color="primary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUploader;
