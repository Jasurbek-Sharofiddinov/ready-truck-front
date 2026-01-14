<template>
  <div class="criteria-page">
    <div class="page-header">
      <div>
        <h1>Rating Criteria</h1>
        <p class="subtitle">Manage the criteria that brokers use to rate performance</p>
      </div>
      <button @click="openAddModal" class="btn-add">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Criteria
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading criteria...</p>
    </div>

    <div v-else-if="criteria.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <h3>No criteria defined</h3>
      <p>Add your first rating criteria to get started</p>
      <button @click="openAddModal" class="btn-add-empty">Add Your First Criteria</button>
    </div>

    <div v-else class="criteria-grid">
      <div v-for="criterion in criteria" :key="criterion.id" class="criteria-card">
        <div class="criteria-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="criteria-content">
          <h3>{{ criterion.name }}</h3>
          <p>{{ criterion.description || 'No description provided' }}</p>
          <span class="created-date">Created {{ formatDate(criterion.created_at) }}</span>
        </div>
        <div class="criteria-actions">
          <button @click="openEditModal(criterion)" class="btn-edit" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button @click="confirmDelete(criterion)" class="btn-delete" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Criteria' : 'Add New Criteria' }}</h3>
          <button @click="closeModal" class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveCriteria" class="modal-form">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g., On-Time Delivery"
              required
              maxlength="100"
            />
            <span class="char-count">{{ form.name.length }}/100</span>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="form.description"
              placeholder="Brief description of what this criteria measures..."
              rows="3"
              maxlength="500"
            ></textarea>
            <span class="char-count">{{ (form.description || '').length }}/500</span>
          </div>

          <div v-if="error" class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="saving || !form.name.trim()" class="btn-save">
              <span v-if="saving" class="btn-spinner"></span>
              {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Criteria') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal delete-modal">
        <div class="delete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
        <h3>Delete Criteria</h3>
        <p>Are you sure you want to delete <strong>"{{ criteriaToDelete?.name }}"</strong>? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">Cancel</button>
          <button @click="deleteCriteria" :disabled="deleting" class="btn-delete-confirm">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api'

const criteria = ref([])
const loading = ref(true)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const criteriaToDelete = ref(null)

const form = reactive({
  name: '',
  description: ''
})

async function loadCriteria() {
  loading.value = true
  try {
    const response = await api.getCriteria()
    criteria.value = response.data
  } catch (err) {
    console.error('Failed to load criteria:', err)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  isEditing.value = false
  editingId.value = null
  form.name = ''
  form.description = ''
  error.value = ''
  showModal.value = true
}

function openEditModal(criterion) {
  isEditing.value = true
  editingId.value = criterion.id
  form.name = criterion.name
  form.description = criterion.description || ''
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  error.value = ''
}

async function saveCriteria() {
  error.value = ''
  saving.value = true

  try {
    const data = {
      name: form.name.trim(),
      description: form.description?.trim() || null
    }

    if (isEditing.value) {
      await api.updateCriteria(editingId.value, data)
    } else {
      await api.createCriteria(data)
    }

    closeModal()
    await loadCriteria()
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to save criteria'
  } finally {
    saving.value = false
  }
}

function confirmDelete(criterion) {
  criteriaToDelete.value = criterion
  showDeleteModal.value = true
}

async function deleteCriteria() {
  deleting.value = true
  try {
    await api.deleteCriteria(criteriaToDelete.value.id)
    showDeleteModal.value = false
    criteriaToDelete.value = null
    await loadCriteria()
  } catch (err) {
    alert(err.response?.data?.detail || 'Failed to delete criteria')
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(loadCriteria)
</script>

<style scoped>
.criteria-page {
  background: #1e293b;
  min-height: calc(100vh - 64px);
  padding: 2rem;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
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
  width: 18px;
  height: 18px;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  background: #334155;
  border-radius: 16px;
  border: 1px solid #475569;
  max-width: 1000px;
  margin: 0 auto;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #475569;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #64748b;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #f1f5f9;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.btn-add-empty {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-empty:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

/* Criteria Grid */
.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  max-width: 1000px;
  margin: 0 auto;
}

.criteria-card {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s ease;
}

.criteria-card:hover {
  border-color: #64748b;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.criteria-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.criteria-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.criteria-content {
  flex: 1;
  min-width: 0;
}

.criteria-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.375rem;
}

.criteria-content p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.created-date {
  font-size: 0.75rem;
  color: #64748b;
}

.criteria-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.btn-edit:hover {
  background: rgba(59, 130, 246, 0.25);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-edit svg, .btn-delete svg {
  width: 18px;
  height: 18px;
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
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  border: 1px solid #475569;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #475569;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
}

.modal-close {
  width: 36px;
  height: 36px;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #475569;
  color: #f1f5f9;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
}

.required {
  color: #f87171;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #f1f5f9;
  transition: all 0.2s;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input:hover,
.form-group textarea:hover {
  border-color: #64748b;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #64748b;
}

.char-count {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #f87171;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.error-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Delete Modal */
.delete-modal {
  text-align: center;
  padding: 2rem;
}

.delete-icon {
  width: 64px;
  height: 64px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}

.delete-icon svg {
  width: 32px;
  height: 32px;
  color: #f87171;
}

.delete-modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.75rem;
}

.delete-modal p {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.delete-modal strong {
  color: #f1f5f9;
}

.btn-delete-confirm {
  flex: 2;
  padding: 0.875rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
}

.btn-delete-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .criteria-page {
    padding: 1.25rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .criteria-grid {
    grid-template-columns: 1fr;
  }

  .criteria-card {
    flex-direction: column;
  }

  .criteria-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
