import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert
} from '@mui/material'
import { 
  Person,
  TrendingUp,
  History,
  Settings,
  EmojiEvents,
  Quiz
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { apiService } from '../services/apiService'

const Profile = ({ showNotification }) => {
  const { user, updatePreferences } = useAuth()
  const [stats, setStats] = useState(null)
  const [quizHistory, setQuizHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(user?.preferences?.theme === 'dark')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Load user stats
      const statsResponse = await authService.getStats()
      if (statsResponse.success) {
        setStats(statsResponse.stats)
      }

      // Load quiz history
      const historyResponse = await apiService.getUserQuizHistory(user.id, 1, 10)
      if (historyResponse.success) {
        setQuizHistory(historyResponse.history)
      }
    } catch (error) {
      console.error('Profile data load error:', error)
      showNotification('Failed to load profile data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = async (event) => {
    const newTheme = event.target.checked ? 'dark' : 'light'
    setDarkMode(event.target.checked)
    
    const result = await updatePreferences({ theme: newTheme })
    if (result.success) {
      showNotification('Theme updated successfully', 'success')
    } else {
      showNotification('Failed to update theme', 'error')
      setDarkMode(!event.target.checked) // Revert on error
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading profile...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Profile Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Person sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {user?.username}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Settings */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings color="primary" />
          <Typography variant="h6">Preferences</Typography>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={handleThemeChange}
                color="primary"
              />
            }
            label="Dark Mode"
          />
        </Box>
      </Paper>

      {/* Statistics Overview */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalQuizzes}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Quizzes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Quiz sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalWords}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Words Practiced
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.averageScore}%
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <History sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalAttempts}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Attempts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp />
            Recent Activity
          </Typography>
          
          <Grid container spacing={2}>
            {stats.recentActivity.map((activity, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={activity.mode === 'pronounce' ? 'Pronunciation' : 'Spelling'}
                        color="primary"
                        size="small"
                      />
                      <Chip 
                        label={`${activity.score}%`}
                        color={getScoreColor(activity.score)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.wordsCount} words
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(activity.completedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Quiz History */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History />
          Quiz History
        </Typography>
        
        {quizHistory.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Mode</strong></TableCell>
                  <TableCell align="center"><strong>Words</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizHistory.map((quiz, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(quiz.completedAt || quiz.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={quiz.mode === 'pronounce' ? 'Pronunciation' : 'Spelling'}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {quiz.totalWords}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {quiz.overallScore ? (
                        <Chip 
                          label={`${quiz.overallScore}%`}
                          color={getScoreColor(quiz.overallScore)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={quiz.status}
                        color={quiz.status === 'completed' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            <Typography variant="body2">
              No quiz history yet. Start your first quiz to see your progress here!
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Achievement Tips */}
      <Alert severity="success" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Keep up the great work!</strong>
          <br />
          • Practice regularly to improve your scores
          • Try both pronunciation and spelling modes
          • Challenge yourself with different types of images
          • Track your progress over time to see improvement
        </Typography>
      </Alert>
    </Box>
  )
}

export default Profile