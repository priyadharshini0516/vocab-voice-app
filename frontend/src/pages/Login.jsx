import React, { useState } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button,
  Tab,
  Tabs,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material'
import { 
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'

const Login = ({ showNotification }) => {
  const { login, register } = useAuth()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  const handleTabChange = (event, newValue) => {
    setTab(newValue)
    setErrors({})
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (tab === 1) { // Register
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required'
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters'
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (tab === 1 && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      let result
      if (tab === 0) {
        // Login
        result = await login(formData.email, formData.password)
      } else {
        // Register
        result = await register(formData.username, formData.email, formData.password)
      }

      if (result.success) {
        showNotification(
          tab === 0 ? 'Login successful!' : 'Account created successfully!',
          'success'
        )
      } else {
        showNotification(result.error, 'error')
      }
    } catch (error) {
      showNotification('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      sx={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          maxWidth: 400, 
          width: '100%',
          mx: 2
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            🎯 Vocab Voice AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered vocabulary learning assistant
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs 
          value={tab} 
          onChange={handleTabChange} 
          centered 
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          {tab === 1 && (
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {tab === 1 && (
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? 'Please wait...' : (tab === 0 ? 'Login' : 'Create Account')}
          </Button>
        </Box>

        {/* Demo Account Info */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Demo Account:</strong>
            <br />
            Email: demo@example.com
            <br />
            Password: demo123
          </Typography>
        </Alert>

        {/* Features */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Features included:
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • OCR Text Extraction • Voice Recognition • AI Evaluation • Progress Tracking
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login