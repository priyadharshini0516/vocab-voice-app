import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider
} from '@mui/material'
import { 
  VolumeUp, 
  Mic,
  CheckCircle,
  Cancel,
  Refresh,
  ArrowForward,
  EmojiEvents
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'
import TextToSpeech from '../components/quiz/TextToSpeech'
import VoiceRecorder from '../components/quiz/VoiceRecorder'

const Quiz = ({ showNotification }) => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentAttempt, setCurrentAttempt] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadQuiz()
  }, [sessionId])

  const loadQuiz = async () => {
    try {
      const response = await apiService.getQuiz(sessionId)
      if (response.success) {
        setQuiz(response.quiz)
      } else {
        showNotification('Quiz session not found', 'error')
        navigate('/')
      }
    } catch (error) {
      console.error('Quiz load error:', error)
      showNotification('Failed to load quiz session', 'error')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleTranscriptReceived = async (transcript) => {
    if (!quiz?.currentWord) return

    setIsProcessing(true)
    try {
      // Evaluate pronunciation using transcript
      const response = await apiService.evaluatePronunciation(
        quiz.currentWord,
        transcript,
        quiz.mode
      )

      if (response.success) {
        const evaluation = response.evaluation
        setCurrentAttempt({
          transcript: transcript,
          evaluation: evaluation
        })

        // Submit attempt to backend
        const attemptResponse = await apiService.submitAttempt(sessionId, {
          transcript: transcript,
          pronunciationScore: evaluation.pronunciationScore,
          spellingScore: evaluation.spellingScore,
          feedback: evaluation.feedback,
          isCorrect: evaluation.isCorrect
        })

        if (attemptResponse.success) {
          setFeedback(attemptResponse.result)
          
          // Auto-advance only if quiz completed
          if (attemptResponse.result.nextAction === 'quiz_completed') {
            setTimeout(() => {
              navigate(`/results/${sessionId}`)
            }, 2000)
          }
        }
      }
    } catch (error) {
      console.error('Pronunciation evaluation error:', error)
      showNotification('Failed to evaluate pronunciation', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNextWord = async () => {
    setCurrentAttempt(null)
    setFeedback(null)
    await loadQuiz() // Reload to get updated quiz state
  }

  const handleSkipWord = async () => {
    if (!quiz?.currentWord) return

    try {
      // Submit a skip attempt to mark word as completed
      const skipResponse = await apiService.submitAttempt(sessionId, {
        transcript: 'skipped',
        pronunciationScore: 0,
        spellingScore: 0,
        feedback: 'Word skipped',
        isCorrect: false
      })

      if (skipResponse.success) {
        if (skipResponse.result.nextAction === 'quiz_completed') {
          navigate(`/results/${sessionId}`)
        } else {
          setCurrentAttempt(null)
          setFeedback(null)
          await loadQuiz()
        }
      }
    } catch (error) {
      console.error('Skip word error:', error)
      showNotification('Failed to skip word', 'error')
    }
  }

  const handleRetry = () => {
    setCurrentAttempt(null)
    setFeedback(null)
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading quiz...</Typography>
      </Box>
    )
  }

  if (!quiz) {
    return (
      <Alert severity="error">
        Quiz session not found
      </Alert>
    )
  }

  return (
    <Box>
      {/* Progress Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {quiz.mode === 'pronounce' ? '🎤 Pronunciation' : '📝 Spelling'} Quiz
          </Typography>
          <Chip 
            label={`${quiz.currentWordIndex + 1} / ${quiz.totalWords}`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={quiz.progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Progress: {quiz.progress}% ({quiz.completedWords} words completed)
        </Typography>
      </Paper>

      {/* Current Word Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
          Word #{quiz.currentWordIndex + 1}
        </Typography>
        
        <TextToSpeech 
          text={quiz.currentWord}
          autoPlay={!currentAttempt}
          showControls={true}
        />

        <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
          {quiz.mode === 'pronounce' 
            ? 'Listen to the word and repeat it clearly'
            : 'Listen to the word and spell it out loud'
          }
        </Typography>

        {/* Voice Recognition Section */}
        {!feedback && (
          <VoiceRecorder 
            targetWord={quiz.currentWord}
            onTranscriptReceived={handleTranscriptReceived}
            disabled={isProcessing}
            mode={quiz.mode}
          />
        )}

        {isProcessing && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing your recording...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Feedback Section */}
      {currentAttempt && feedback && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {feedback.isCorrect ? (
              <>
                <CheckCircle color="success" />
                Great Job!
              </>
            ) : (
              <>
                <Cancel color="error" />
                Try Again
              </>
            )}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Transcript */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              What you said:
            </Typography>
            <Typography variant="body1" sx={{ 
              p: 2, 
              backgroundColor: 'grey.100', 
              borderRadius: 1,
              fontStyle: 'italic'
            }}>
              "{currentAttempt.transcript}"
            </Typography>
          </Box>

          {/* Scores */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color={getScoreColor(currentAttempt.evaluation.pronunciationScore)}>
                  {currentAttempt.evaluation.pronunciationScore}
                </Typography>
                <Typography variant="body2">
                  Pronunciation
                </Typography>
                <Chip 
                  label={getScoreLabel(currentAttempt.evaluation.pronunciationScore)}
                  color={getScoreColor(currentAttempt.evaluation.pronunciationScore)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color={getScoreColor(currentAttempt.evaluation.spellingScore)}>
                  {currentAttempt.evaluation.spellingScore}
                </Typography>
                <Typography variant="body2">
                  Spelling
                </Typography>
                <Chip 
                  label={getScoreLabel(currentAttempt.evaluation.spellingScore)}
                  color={getScoreColor(currentAttempt.evaluation.spellingScore)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* AI Feedback */}
          <Alert 
            severity={feedback.isCorrect ? 'success' : 'info'} 
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              {currentAttempt.evaluation.feedback}
            </Typography>
          </Alert>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {feedback.nextAction === 'retry' && feedback.attemptsLeft > 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRetry}
                >
                  Try Again ({feedback.attemptsLeft} attempts left)
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ArrowForward />}
                  onClick={handleSkipWord}
                >
                  Skip Word
                </Button>
              </>
            )}

            {(feedback.nextAction === 'next_word' || feedback.attemptsLeft === 0) && (
              <Button
                variant="contained"
                startIcon={<ArrowForward />}
                onClick={handleNextWord}
              >
                Next Word
              </Button>
            )}

            {feedback.nextAction === 'quiz_completed' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<EmojiEvents />}
                onClick={() => navigate(`/results/${sessionId}`)}
              >
                View Results
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Instructions */}
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Instructions:</strong>
          <br />
          • Click "Listen" to hear the word pronunciation
          • Record your {quiz.mode === 'pronounce' ? 'pronunciation' : 'spelling'} attempt
          • Get instant AI feedback and scoring
          • You have up to 3 attempts per word
        </Typography>
      </Alert>
    </Box>
  )
}

export default Quiz