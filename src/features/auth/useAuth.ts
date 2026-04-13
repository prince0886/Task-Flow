import { useMutation } from '@tanstack/react-query'
import apiClient from '@/services/api'
import { LoginInput, RegisterInput, AuthResponse } from '@/types'
import { useAuthStore } from './useAuthStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export const useAuth = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Welcome back!')
      navigate('/projects')
    },
    onError: (error: any) => {
      toast.error(error.response?.statusText || 'Login failed')
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Registration successful!')
      navigate('/projects')
    },
    onError: (error: any) => {
      toast.error(error.response?.statusText || 'Registration failed')
    },
  })

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    logout: () => {
      logout()
      navigate('/login')
    },
  }
}
