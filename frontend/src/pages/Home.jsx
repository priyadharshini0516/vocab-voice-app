import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'
import { 
  CloudUpload, 
  Quiz, 
  VolumeUp,
  Spellcheck,
  TrendingUp
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiService } from '../services/apiService'
import ImageUpload from '../components/upload/ImageUpload'

const Home = ({ showNotification }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [extractedWords, setExtractedWords] = useState([])
  const [quizMode, setQuizMode] = useState('pronounce')
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false)
  const [userStats, setUserStats] = useState(null)

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    if (!user?.id) return
    
    try {
      const historyResponse = await apiService.getUserQuizHistory(user.id, 1, 100)
      if (historyResponse && historyResponse.success) {
        const quizData = historyResponse.history
        const completedQuizzes = quizData.filter(q => q.status === 'completed')
        const totalWords = completedQuizzes.reduce((sum, q) => sum + (q.totalWords || 0), 0)
        const totalScore = completedQuizzes.reduce((sum, q) => sum + (q.overallScore || 0), 0)
        const avgScore = completedQuizzes.length > 0 ? Math.round(totalScore / completedQuizzes.length) : 0
        
        setUserStats({
          totalQuizzes: completedQuizzes.length,
          totalWords: totalWords,
          averageScore: avgScore
        })
      }
    } catch (error) {
      console.error('Stats load error:', error)
    }
  }

  const handleWordsExtracted = (words) => {
    setExtractedWords(words)
  }

  const handleStartQuiz = async () => {
    if (extractedWords.length === 0) {
      showNotification('Please upload an image first to extract words', 'warning')
      return
    }

    setIsCreatingQuiz(true)
    try {
      const response = await apiService.createQuiz(user.id, extractedWords, quizMode)
      
      if (response.success) {
        navigate(`/quiz/${response.quiz.sessionId}`)
      } else {
        showNotification('Failed to create quiz session', 'error')
      }
    } catch (error) {
      console.error('Quiz creation error:', error)
      showNotification(
        error.response?.data?.error || 'Failed to create quiz session',
        'error'
      )
    } finally {
      setIsCreatingQuiz(false)
    }
  }

  const handleModeChange = (event) => {
    setQuizMode(event.target.value)
  }

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          🎯 AI Vocabulary Learning Assistant
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          Upload an image with text, and practice pronunciation with AI-powered feedback
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<CloudUpload />} label="OCR Text Extraction" color="primary" />
          <Chip icon={<VolumeUp />} label="Voice Recognition" color="primary" />
          <Chip icon={<TrendingUp />} label="AI Evaluation" color="primary" />
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Upload Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" />
              Step 1: Upload Image
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Upload an image containing text (worksheets, flashcards, textbook pages, etc.)
            </Typography>
            
            <ImageUpload 
              onWordsExtracted={handleWordsExtracted}
              showNotification={showNotification}
            />

            {/* Extracted Words Preview */}
            {extractedWords.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Extracted Words ({extractedWords.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {extractedWords.slice(0, 20).map((word, index) => (
                    <Chip 
                      key={index} 
                      label={word} 
                      variant="outlined" 
                      size="small"
                    />
                  ))}
                  {extractedWords.length > 20 && (
                    <Chip 
                      label={`+${extractedWords.length - 20} more`} 
                      variant="outlined" 
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quiz Configuration */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Quiz color="primary" />
              Step 2: Start Quiz
            </Typography>

            {/* Mode Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Quiz Mode</InputLabel>
              <Select
                value={quizMode}
                onChange={handleModeChange}
                label="Quiz Mode"
              >
                <MenuItem value="pronounce">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VolumeUp />
                    Pronunciation Practice
                  </Box>
                </MenuItem>
                <MenuItem value="spell">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Spellcheck />
                    Spelling Practice
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Mode Description */}
            <Alert severity="info" sx={{ mb: 3 }}>
              {quizMode === 'pronounce' ? (
                <Typography variant="body2">
                  <strong>Pronunciation Mode:</strong> Listen to each word and repeat it. 
                  AI will evaluate your pronunciation accuracy.
                </Typography>
              ) : (
                <Typography variant="body2">
                  <strong>Spelling Mode:</strong> Listen to each word and spell it out loud. 
                  AI will check your spelling accuracy.
                </Typography>
              )}
            </Alert>

            {/* Start Quiz Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleStartQuiz}
              disabled={extractedWords.length === 0 || isCreatingQuiz}
              startIcon={<Quiz />}
              sx={{ py: 1.5 }}
            >
              {isCreatingQuiz ? 'Creating Quiz...' : `Start ${quizMode === 'pronounce' ? 'Pronunciation' : 'Spelling'} Quiz`}
            </Button>

            {extractedWords.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Upload an image first to enable quiz creation
              </Typography>
            )}
          </Paper>

          {/* User Stats Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Progress
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Quizzes Completed:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {userStats?.totalQuizzes || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Words Practiced:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {userStats?.totalWords || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Average Score:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {userStats?.averageScore || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* How It Works Section */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          How It Works
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>1. Upload</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload an image with text using our OCR technology
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <VolumeUp sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>2. Listen</Typography>
              <Typography variant="body2" color="text.secondary">
                Hear each word pronounced clearly by AI voice
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <Quiz sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>3. Practice</Typography>
              <Typography variant="body2" color="text.secondary">
                Record your pronunciation or spelling attempt
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box textAlign="center">
              <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>4. Improve</Typography>
              <Typography variant="body2" color="text.secondary">
                Get AI feedback and track your progress over time
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default Home