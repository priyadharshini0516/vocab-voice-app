import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material'
import { 
  EmojiEvents,
  Home,
  Refresh,
  TrendingUp,
  CheckCircle,
  Cancel,
  Star
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'

const Results = ({ showNotification }) => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [sessionId])

  const loadResults = async () => {
    try {
      const response = await apiService.getQuizResults(sessionId)
      if (response.success) {
        setResults(response.results)
      } else {
        showNotification('Results not found', 'error')
        navigate('/')
      }
    } catch (error) {
      console.error('Results load error:', error)
      showNotification('Failed to load results', 'error')
      navigate('/')
    } finally {
      setLoading(false)
    }
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

  const getPerformanceMessage = (score) => {
    if (score >= 90) return "Outstanding performance! You're mastering these words!"
    if (score >= 70) return "Great job! Keep practicing to improve further."
    if (score >= 50) return "Good effort! Focus on the challenging words."
    return "Keep practicing! Every attempt makes you better."
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading results...</Typography>
      </Box>
    )
  }

  if (!results) {
    return (
      <Alert severity="error">
        Results not found
      </Alert>
    )
  }

  const completionRate = Math.round((results.completedWords / results.totalWords) * 100)
  const accuracyRate = Math.round((results.correctWords / results.completedWords) * 100) || 0

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <EmojiEvents sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Quiz Complete!
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          {getPerformanceMessage(results.overallScore)}
        </Typography>
      </Paper>

      {/* Overall Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {results.overallScore || 0}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Overall Score
              </Typography>
              <Chip 
                label={getScoreLabel(results.overallScore)}
                color={getScoreColor(results.overallScore)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {completionRate}%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {results.completedWords} / {results.totalWords} words
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" fontWeight="bold">
                {accuracyRate}%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Accuracy Rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {results.correctWords} correct answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Quiz Mode
              </Typography>
              <Chip 
                label={results.mode === 'pronounce' ? 'Pronunciation' : 'Spelling'}
                color="primary"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Visualization */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp />
          Performance Breakdown
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Overall Progress</Typography>
            <Typography variant="body2">{results.overallScore}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={results.overallScore} 
            sx={{ height: 8, borderRadius: 4 }}
            color={getScoreColor(results.overallScore)}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Completion Rate</Typography>
            <Typography variant="body2">{completionRate}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionRate} 
            sx={{ height: 8, borderRadius: 4 }}
            color="success"
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Accuracy Rate</Typography>
            <Typography variant="body2">{accuracyRate}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={accuracyRate} 
            sx={{ height: 8, borderRadius: 4 }}
            color="info"
          />
        </Box>
      </Paper>

      {/* Detailed Word Results */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Word-by-Word Results
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Word</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Score</strong></TableCell>
                <TableCell align="center"><strong>Attempts</strong></TableCell>
                <TableCell><strong>Best Attempt</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.wordDetails.map((word, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {word.word}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {word.completed ? (
                      word.bestAttempt?.isCorrect ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Cancel color="error" />
                      )
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not completed
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {word.finalScore ? (
                      <Chip 
                        label={`${Math.round(word.finalScore)}%`}
                        color={getScoreColor(word.finalScore)}
                        size="small"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {word.attempts}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {word.bestAttempt ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{word.bestAttempt.transcript}"
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No attempts
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Home />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<Refresh />}
          onClick={() => navigate('/')}
        >
          Start New Quiz
        </Button>
      </Box>

      {/* Improvement Tips */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Tips for Improvement:</strong>
          <br />
          • Practice words you found challenging in a quiet environment
          • Speak clearly and at a moderate pace
          • Listen to the pronunciation multiple times before attempting
          • Focus on syllable breaks and stress patterns
          • Regular practice leads to better results!
        </Typography>
      </Alert>
    </Box>
  )
}

export default Results