<template>
  <div class="users-page">
    <div class="page-header">
      <div class="header-left">
        <h1>User Management</h1>
        <p class="subtitle">Manage broker and admin accounts</p>
      </div>
      <button @click="showAddModal = true" class="btn-add">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add User
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Data Table -->
    <div v-else class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="table-row">
            <td class="username">{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td><span :class="['role-badge', user.role]">{{ user.role }}</span></td>
            <td><span :class="['status-badge', { active: user.is_active }]">{{ user.is_active ? 'Active' : 'Inactive' }}</span></td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button
                v-if="user.role !== 'admin'"
                @click="deleteUser(user)"
                class="btn-delete"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h3>Add New User</h3>
            <p>Create a new broker or admin account</p>
          </div>
          <button @click="showAddModal = false" class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form @submit.prevent="addUser" class="modal-form">
          <div class="form-group">
            <label>Username</label>
            <input v-model="newUser.username" type="text" required placeholder="Enter username" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="newUser.email" type="email" required placeholder="Enter email address" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="newUser.password" type="password" required placeholder="Enter password" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="newUser.role">
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button type="button" @click="showAddModal = false" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="adding" class="btn-save">
              {{ adding ? 'Adding...' : 'Add User' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'

const users = ref([])
const loading = ref(true)
const showAddModal = ref(false)
const adding = ref(false)
const error = ref('')

const newUser = reactive({
  username: '',
  email: '',
  password: '',
  role: 'broker'
})

async function loadUsers() {
  loading.value = true
  try {
    const response = await api.getUsers()
    users.value = response.data
  } catch (err) {
    console.error('Failed to load users:', err)
  } finally {
    loading.value = false
  }
}

async function addUser() {
  error.value = ''
  adding.value = true

  try {
    await api.createUser(newUser)
    showAddModal.value = false
    newUser.username = ''
    newUser.email = ''
    newUser.password = ''
    newUser.role = 'broker'
    await loadUsers()
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to add user'
  } finally {
    adding.value = false
  }
}

async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete ${user.username}?`)) return

  try {
    await api.deleteUser(user.id)
    await loadUsers()
  } catch (err) {
    alert(err.response?.data?.detail || 'Failed to delete user')
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

onMounted(loadUsers)
</script>

<style scoped>
/* ================================================
   DARK THEME - USER MANAGEMENT PAGE
   ================================================ */

.users-page {
  background: #1e293b;
  min-height: calc(100vh - 64px);
  padding: 2rem;
  color: #e2e8f0;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 400;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.btn-add svg {
  width: 16px;
  height: 16px;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  color: #94a3b8;
  background: #334155;
  border-radius: 16px;
  border: 1px solid #475569;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #475569;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1.25rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Table Container */
.table-container {
  background: #334155;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #475569;
  overflow-x: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #1e293b;
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid #475569;
  white-space: nowrap;
}

.users-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #475569;
  font-size: 0.875rem;
  color: #e2e8f0;
}

.table-row {
  transition: all 0.15s ease;
}

.table-row:hover {
  background: rgba(59, 130, 246, 0.1);
}

.table-row:hover td {
  color: #f1f5f9;
}

.username {
  font-weight: 700;
  color: #60a5fa;
  font-size: 0.9rem;
}

/* Role Badges */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-badge.admin {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.role-badge.broker {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

/* Delete Button */
.btn-delete {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #334155;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid #475569;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.75rem;
  border-bottom: 1px solid #475569;
}

.modal-header h3 {
  font-size: 1.375rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.375rem;
}

.modal-header p {
  color: #94a3b8;
  font-size: 0.875rem;
}

.modal-close {
  width: 38px;
  height: 38px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #475569;
  border-color: #64748b;
  color: #f1f5f9;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-form {
  padding: 1.75rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #475569;
  border-radius: 10px;
  font-size: 0.875rem;
  background: #1e293b;
  color: #e2e8f0;
  transition: all 0.2s;
}

.form-group input:hover,
.form-group select:hover {
  border-color: #64748b;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-group input::placeholder {
  color: #64748b;
}

.error-message {
  padding: 0.875rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  gap: 0.875rem;
  padding-top: 0.5rem;
}

.btn-cancel {
  flex: 1;
  padding: 0.875rem;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 10px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #475569;
  border-color: #64748b;
  color: #f1f5f9;
}

.btn-save {
  flex: 2;
  padding: 0.875rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .users-page {
    padding: 1.25rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1.25rem;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }
}
</style>

