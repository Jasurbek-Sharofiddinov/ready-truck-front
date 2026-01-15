<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Update your account information</p>
      </div>

      <form @submit.prevent="updateProfile" class="profile-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Enter username"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Enter email"
          />
        </div>

        <div class="form-divider">
          <span>Change Password</span>
        </div>

        <div class="form-group">
          <label for="password">New Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Leave blank to keep current"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm new password"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <button type="submit" class="btn-save" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const authStore = useAuthStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

onMounted(() => {
  if (authStore.user) {
    form.value.username = authStore.user.username
    form.value.email = authStore.user.email
  }
})

async function updateProfile() {
  error.value = ''
  success.value = ''

  // Validate passwords match if provided
  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const updateData = {}

    if (form.value.username !== authStore.user.username) {
      updateData.username = form.value.username
    }

    if (form.value.email !== authStore.user.email) {
      updateData.email = form.value.email
    }

    if (form.value.password) {
      updateData.password = form.value.password
    }

    if (Object.keys(updateData).length === 0) {
      error.value = 'No changes to save'
      loading.value = false
      return
    }

    const response = await api.updateProfile(updateData)

    // Update local user data
    authStore.user = response.data
    localStorage.setItem('user', JSON.stringify(response.data))

    success.value = 'Profile updated successfully'
    form.value.password = ''
    form.value.confirmPassword = ''

    // If username changed, user needs to re-login
    if (updateData.username) {
      success.value = 'Profile updated! Please log in again with your new username.'
      setTimeout(() => {
        authStore.logout()
      }, 2000)
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.profile-container {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.profile-header {
  margin-bottom: 2rem;
}

.profile-header h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.profile-header p {
  color: var(--text-secondary);
  margin: 0;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
}

.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.form-divider span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.btn-save {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
