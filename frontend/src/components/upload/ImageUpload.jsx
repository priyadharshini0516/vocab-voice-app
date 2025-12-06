import React, { useState } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material'
import { CloudUpload, Image } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { apiService } from '../../services/apiService'

const ImageUpload = ({ onWordsExtracted, showNotification }) => {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)

    // Extract text
    setLoading(true)
    try {
      const response = await apiService.extractTextFromImage(file)
      
      if (response.success && response.words.length > 0) {
        onWordsExtracted(response.words)
        showNotification(`Successfully extracted ${response.words.length} words!`, 'success')
      } else {
        showNotification('No readable text found in the image. Please try another image.', 'warning')
      }
    } catch (error) {
      console.error('OCR Error:', error)
      showNotification(
        error.response?.data?.error || 'Failed to process image. Please try again.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: loading
  })

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <Box>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Image...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Extracting text using AI OCR
            </Typography>
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the image here' : 'Upload an Image'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag & drop an image with text, or click to select
            </Typography>
            <Button variant="outlined" startIcon={<Image />}>
              Choose Image
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supports JPEG, PNG • Max 5MB
            </Typography>
          </Box>
        )}
      </Paper>

      {preview && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
          <Box
            component="img"
            src={preview}
            alt="Upload preview"
            sx={{
              maxWidth: '100%',
              maxHeight: 200,
              objectFit: 'contain',
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 1
            }}
          />
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Tips for best results:</strong>
          <br />
          • Use clear, high-contrast images
          • Ensure text is readable and not blurry
          • Avoid handwritten text (printed text works best)
          • Good lighting improves accuracy
        </Typography>
      </Alert>
    </Box>
  )
}

export default ImageUpload