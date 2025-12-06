import React, { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material'
import { 
  Mic, 
  MicOff, 
  Stop, 
  PlayArrow,
  Pause
} from '@mui/icons-material'

const AudioRecorder = ({ onRecordingComplete, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
        
        if (onRecordingComplete) {
          onRecordingComplete(blob)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
    setError(null)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        {!isRecording && !audioBlob && (
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
            Start Recording
          </Button>
        )}

        {isRecording && (
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
              Stop Recording
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={20} color="error" />
              <Typography variant="h6" color="error">
                Recording: {formatTime(recordingTime)}
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="indeterminate" 
              color="error" 
              sx={{ mt: 1, height: 4, borderRadius: 2 }}
            />
          </Box>
        )}

        {audioBlob && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                onClick={playRecording}
              >
                {isPlaying ? 'Pause' : 'Play'} Recording
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Mic />}
                onClick={resetRecording}
              >
                Record Again
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Recording duration: {formatTime(recordingTime)}
            </Typography>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          </Box>
        )}
      </Box>

      {/* Instructions */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {!isRecording && !audioBlob && 'Click to start recording your pronunciation'}
        {isRecording && 'Speak clearly into your microphone'}
        {audioBlob && 'You can play back your recording or record again'}
      </Typography>
    </Box>
  )
}

export default AudioRecorder