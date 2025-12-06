import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiService = {
  // OCR Service
  async extractTextFromImage(imageFile) {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await api.post('/ocr/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Speech Service
  async transcribeAudio(audioBlob) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    
    const response = await api.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async evaluatePronunciation(targetWord, transcript, mode = 'pronounce') {
    const response = await api.post('/speech/evaluate', {
      targetWord,
      transcript,
      mode
    })
    return response.data
  },

  async transcribeAndEvaluate(audioBlob, targetWord, mode = 'pronounce') {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('targetWord', targetWord)
    formData.append('mode', mode)
    
    const response = await api.post('/speech/transcribe-and-evaluate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Quiz Service
  async createQuiz(userId, words, mode = 'pronounce') {
    const response = await api.post('/quiz/create', {
      userId,
      words,
      mode
    })
    return response.data
  },

  async getQuiz(sessionId) {
    const response = await api.get(`/quiz/${sessionId}`)
    return response.data
  },

  async submitAttempt(sessionId, attemptData) {
    const response = await api.post(`/quiz/${sessionId}/attempt`, attemptData)
    return response.data
  },

  async getQuizResults(sessionId) {
    const response = await api.get(`/quiz/${sessionId}/results`)
    return response.data
  },

  async getUserQuizHistory(userId, page = 1, limit = 10) {
    const response = await api.get(`/quiz/user/${userId}/history?page=${page}&limit=${limit}`)
    return response.data
  }
}