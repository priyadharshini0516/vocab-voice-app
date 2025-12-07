import React, { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress,
  Alert
} from '@mui/material'
import { 
  Mic, 
  Stop
} from '@mui/icons-material'

const VoiceRecorder = ({ targetWord, onTranscriptReceived, disabled = false, mode = 'pronounce' }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase().trim()
        console.log('Recognized:', spokenText)
        setTranscript(spokenText)
        setIsRecording(false)
        
        if (onTranscriptReceived) {
          onTranscriptReceived(spokenText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setError('Could not recognize speech. Please try again.')
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    } else {
      setError('Speech recognition not supported in this browser. Please use Chrome.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscriptReceived])

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available')
      return
    }

    setError(null)
    setTranscript('')
    setIsRecording(true)

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('Start recording error:', err)
      setError('Failed to start recording')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Recording Controls */}
      <Box sx={{ mb: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<Mic />}
            onClick={startRecording}
            disabled={disabled}
            sx={{ 
              borderRadius: '50px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Start Speaking
          </Button>
        ) : (
          <Box>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<Stop />}
              onClick={stopRecording}
              sx={{ 
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                mb: 2
              }}
            >
              Stop
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={20} color="error" />
              <Typography variant="h6" color="error">
                Listening...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Transcript Display */}
      {transcript && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You said: <strong>"{transcript}"</strong>
          </Typography>
        </Alert>
      )}

      {/* Instructions */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {!isRecording && !transcript && (
          mode === 'spell' 
            ? `Click and spell out the word letter by letter` 
            : `Click to pronounce: "${targetWord}"`
        )}
        {isRecording && (
          mode === 'spell'
            ? 'Spell the word letter by letter (e.g., A-P-P-L-E)'
            : 'Speak clearly into your microphone'
        )}
        {transcript && 'Processing your answer...'}
      </Typography>
    </Box>
  )
}

export default VoiceRecorder