import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vocab-voice-app-2-yhpx.onrender.com/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  async login(email, password) {
    const response = await api.post('/user/login', { email, password })
    return response.data
  },

  async register(username, email, password) {
    const response = await api.post('/user/register', { username, email, password })
    return response.data
  },

  async getProfile() {
    const response = await api.get('/user/profile')
    return response.data
  },

  async updatePreferences(preferences) {
    const response = await api.put('/user/preferences', preferences)
    return response.data
  },

  async getStats() {
    const response = await api.get('/user/stats')
    return response.data
  }
}