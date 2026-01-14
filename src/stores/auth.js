import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isBroker = computed(() => user.value?.role === 'broker')

  async function login(username, password) {
    const response = await api.login(username, password)
    token.value = response.data.access_token
    localStorage.setItem('token', token.value)

    // Get user info
    const userResponse = await api.getMe()
    user.value = userResponse.data
    localStorage.setItem('user', JSON.stringify(user.value))

    return user.value
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, isAuthenticated, isAdmin, isBroker, login, logout }
})
