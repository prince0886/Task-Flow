import axios from 'axios'
import { useAuthStore } from '@/features/auth/useAuthStore'

const apiClient = axios.create({
  baseURL: '', // Using empty string for MSW mocking on same origin
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
