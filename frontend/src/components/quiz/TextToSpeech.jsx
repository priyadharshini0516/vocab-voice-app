import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Button, 
  IconButton,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { 
  VolumeUp, 
  VolumeOff,
  Settings
} from '@mui/icons-material'

const TextToSpeech = ({ text, autoPlay = false, showControls = true }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(0.8)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      const englishVoices = availableVoices.filter(voice => 
        voice.lang.startsWith('en')
      )
      setVoices(englishVoices)
      
      // Set default voice (prefer female voice if available)
      const defaultVoice = englishVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen')
      ) || englishVoices[0]
      
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name)
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (autoPlay && text) {
      speak()
    }
  }, [text, autoPlay])

  const speak = () => {
    if (!text) return

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Find selected voice
    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) {
      utterance.voice = voice
    }

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const handleVoiceChange = (event) => {
    setSelectedVoice(event.target.value)
  }

  if (!showControls) {
    // Auto-play mode without controls
    return null
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Main Play Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isPlaying ? <VolumeOff /> : <VolumeUp />}
          onClick={isPlaying ? stopSpeaking : speak}
          disabled={!text}
          sx={{ 
            borderRadius: '50px',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem'
          }}
        >
          {isPlaying ? 'Stop' : 'Listen'}
        </Button>

        <IconButton
          onClick={() => setShowSettings(!showSettings)}
          sx={{ ml: 1 }}
        >
          <Settings />
        </IconButton>
      </Box>

      {/* Word Display */}
      {text && (
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 2,
            fontWeight: 'bold',
            color: 'primary.main',
            textTransform: 'lowercase'
          }}
        >
          "{text}"
        </Typography>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          border: 1, 
          borderColor: 'grey.300', 
          borderRadius: 2,
          backgroundColor: 'grey.50'
        }}>
          <Typography variant="h6" gutterBottom>
            Voice Settings
          </Typography>

          {/* Voice Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Voice</InputLabel>
            <Select
              value={selectedVoice}
              onChange={handleVoiceChange}
              label="Voice"
            >
              {voices.map((voice) => (
                <MenuItem key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Speed Control */}
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>
              Speed: {rate.toFixed(1)}x
            </Typography>
            <Slider
              value={rate}
              onChange={(_, value) => setRate(value)}
              min={0.5}
              max={2}
              step={0.1}
              marks={[
                { value: 0.5, label: '0.5x' },
                { value: 1, label: '1x' },
                { value: 1.5, label: '1.5x' },
                { value: 2, label: '2x' }
              ]}
            />
          </Box>

          {/* Pitch Control */}
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>
              Pitch: {pitch.toFixed(1)}
            </Typography>
            <Slider
              value={pitch}
              onChange={(_, value) => setPitch(value)}
              min={0.5}
              max={2}
              step={0.1}
              marks={[
                { value: 0.5, label: 'Low' },
                { value: 1, label: 'Normal' },
                { value: 2, label: 'High' }
              ]}
            />
          </Box>

          {/* Volume Control */}
          <Box>
            <Typography gutterBottom>
              Volume: {Math.round(volume * 100)}%
            </Typography>
            <Slider
              value={volume}
              onChange={(_, value) => setVolume(value)}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0%' },
                { value: 0.5, label: '50%' },
                { value: 1, label: '100%' }
              ]}
            />
          </Box>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Click "Listen" to hear the pronunciation
      </Typography>
    </Box>
  )
}

export default TextToSpeech