import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),

  // Users
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Criteria
  getCriteria: () => api.get('/criteria'),
  createCriteria: (data) => api.post('/criteria', data),
  updateCriteria: (id, data) => api.put(`/criteria/${id}`, data),
  deleteCriteria: (id) => api.delete(`/criteria/${id}`),

  // Grades
  getGrades: (params) => api.get('/grades', { params }),
  createGrades: (grades) => api.post('/grades', { grades }),

  // Trucks
  getTrucks: (params = {}) => api.get('/trucks', { params }),
  updateTruckStatus: (id, isInactive) => api.patch(`/trucks/${id}/status`, { is_inactive: isInactive }),
  updateTruckPreferences: (id, preferences) => api.patch(`/trucks/${id}/preferences`, preferences),
  syncTrucks: () => api.post('/trucks/sync'),
  getLastSync: () => api.get('/trucks/last-sync'),

  // Analytics
  getAnalytics: (params) => api.get('/analytics', { params }),
  exportGrades: (params) => api.get('/analytics/export', { params, responseType: 'blob' })
}
