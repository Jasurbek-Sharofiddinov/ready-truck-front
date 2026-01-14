<template>
  <div class="trucks-page">
    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card total">
        <div class="stat-value">{{ totalTrucks }}</div>
        <div class="stat-label">Total Trucks</div>
      </div>
      <div class="stat-card ready">
        <div class="stat-value">{{ readyCount }}</div>
        <div class="stat-label">Ready</div>
      </div>
      <div class="stat-card enroute">
        <div class="stat-value">{{ enrouteCount }}</div>
        <div class="stat-label">Enroute</div>
      </div>
      <div class="stat-card at-pu">
        <div class="stat-value">{{ atPuCount }}</div>
        <div class="stat-label">At PU</div>
      </div>
      <div class="stat-card at-del">
        <div class="stat-value">{{ atDelCount }}</div>
        <div class="stat-label">At Del</div>
      </div>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Fleet Overview</h1>
        <p class="subtitle">{{ totalTrucks }} trucks across {{ uniqueStates }} states</p>
        <p class="last-sync">Last synced: {{ lastSyncDisplay }}</p>
      </div>
      <div class="header-actions">
        <button v-if="!authStore.isAdmin" @click="openRatingModal" class="btn-rate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Submit Rating
        </button>
        <button v-if="authStore.isAdmin" @click="syncFromPeaka" :disabled="syncing" class="btn-sync">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          {{ syncing ? 'Syncing...' : 'Sync Peaka' }}
        </button>
        <label v-if="authStore.isAdmin" class="toggle-inactive">
          <input type="checkbox" v-model="showInactive" @change="loadTrucks" />
          <span>Show Inactive</span>
        </label>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-tabs">
        <button :class="['tab', { active: statusFilter === '' }]" @click="setFilter('')">
          All <span class="count">{{ trucks.length }}</span>
        </button>
        <button :class="['tab', { active: statusFilter === 'READY' }]" @click="setFilter('READY')">
          <span class="dot ready"></span> Ready <span class="count">{{ countByDisplayStatus('READY') }}</span>
        </button>
        <button :class="['tab', { active: statusFilter === 'ENROUTE' }]" @click="setFilter('ENROUTE')">
          <span class="dot enroute"></span> Enroute <span class="count">{{ countByDisplayStatus('ENROUTE') }}</span>
        </button>
        <button :class="['tab', { active: statusFilter === 'AT PU' }]" @click="setFilter('AT PU')">
          <span class="dot at-pu"></span> At PU <span class="count">{{ countByDisplayStatus('AT PU') }}</span>
        </button>
        <button :class="['tab', { active: statusFilter === 'AT DEL' }]" @click="setFilter('AT DEL')">
          <span class="dot at-del"></span> At Del <span class="count">{{ countByDisplayStatus('AT DEL') }}</span>
        </button>
        <button :class="['tab', { active: statusFilter === 'N/A' }]" @click="setFilter('N/A')">
          <span class="dot na"></span> N/A <span class="count">{{ countByDisplayStatus('N/A') }}</span>
        </button>
      </div>

      <div class="filter-controls">
        <select v-model="stateFilter" class="state-select">
          <option value="">All States</option>
          <option v-for="state in availableStates" :key="state" :value="state">{{ state }}</option>
        </select>
        <select v-model="statusFilter" class="status-select">
          <option value="">All Statuses</option>
          <option v-for="status in availableStatuses" :key="status" :value="status">{{ status }}</option>
        </select>
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Search trucks..." />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading fleet data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTrucks.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8zM6 21a2 2 0 100-4 2 2 0 000 4zM18 21a2 2 0 100-4 2 2 0 000 4z"/>
      </svg>
      <h3>No trucks found</h3>
      <p>Try adjusting your filters</p>
    </div>

    <!-- Data Table -->
    <div v-else class="table-container">
      <table class="fleet-table">
        <thead>
          <tr>
            <th @click="sortBy('truck_number')" class="sortable">
              Truck # <span class="sort-icon">{{ getSortIcon('truck_number') }}</span>
            </th>
            <th @click="sortBy('city')" class="sortable">
              Location <span class="sort-icon">{{ getSortIcon('city') }}</span>
            </th>
            <th @click="sortBy('display_status')" class="sortable">
              Status <span class="sort-icon">{{ getSortIcon('display_status') }}</span>
            </th>
            <th @click="sortBy('hours_in_status')" class="sortable">
              Hours <span class="sort-icon">{{ getSortIcon('hours_in_status') }}</span>
            </th>
            <th @click="sortBy('dispatcher')" class="sortable">
              Dispatcher <span class="sort-icon">{{ getSortIcon('dispatcher') }}</span>
            </th>
            <th>Pref. Dest</th>
            <th>Pref. Miles</th>
            <th>Comments</th>
            <th v-if="authStore.isAdmin">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="truck in sortedTrucks" :key="truck.id" :class="['table-row', { inactive: truck.is_inactive }]">
            <td class="truck-number">{{ truck.truck_number }}</td>
            <td class="location-cell">{{ formatLocation(truck) }}</td>

            <!-- Status Badge -->
            <td>
              <span :class="['status-badge', getStatusClass(truck)]">
                {{ truck.is_inactive ? 'Inactive' : (truck.display_status || 'N/A') }}
              </span>
            </td>

            <!-- Hours in Status -->
            <td class="hours-cell">
              <span :class="getHoursClass(truck.hours_in_status)">
                {{ truck.hours_in_status != null ? truck.hours_in_status + 'h' : '-' }}
              </span>
            </td>

            <!-- Dispatcher (Clickable) -->
            <td class="dispatcher-cell">
              <button
                v-if="truck.dispatcher"
                @click="openDispatcherModal(truck)"
                class="dispatcher-btn"
              >
                {{ truck.dispatcher }}
              </button>
              <span v-else>-</span>
            </td>

            <!-- Editable Fields (Admin Only) -->
            <td v-if="authStore.isAdmin">
              <input
                type="text"
                :value="truck.preferable_dest || ''"
                @blur="(e) => savePreferences(truck, 'preferable_dest', e.target.value)"
                @keyup.enter="(e) => { savePreferences(truck, 'preferable_dest', e.target.value); e.target.blur() }"
                class="inline-edit"
                placeholder="-"
              />
            </td>
            <td v-else>{{ truck.preferable_dest || '-' }}</td>

            <td v-if="authStore.isAdmin">
              <input
                type="number"
                :value="truck.preferable_miles || ''"
                @blur="(e) => savePreferences(truck, 'preferable_miles', e.target.value ? parseInt(e.target.value) : null)"
                @keyup.enter="(e) => { savePreferences(truck, 'preferable_miles', e.target.value ? parseInt(e.target.value) : null); e.target.blur() }"
                class="inline-edit narrow"
                placeholder="-"
              />
            </td>
            <td v-else>{{ truck.preferable_miles || '-' }}</td>

            <td v-if="authStore.isAdmin">
              <input
                type="text"
                :value="truck.comments || ''"
                @blur="(e) => savePreferences(truck, 'comments', e.target.value)"
                @keyup.enter="(e) => { savePreferences(truck, 'comments', e.target.value); e.target.blur() }"
                class="inline-edit wide"
                placeholder="-"
              />
            </td>
            <td v-else>{{ truck.comments || '-' }}</td>

            <!-- Actions -->
            <td v-if="authStore.isAdmin">
              <button @click="toggleInactive(truck)" :class="['action-btn', truck.is_inactive ? 'activate' : 'deactivate']">
                {{ truck.is_inactive ? 'Activate' : 'Deactivate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rating Modal -->
    <div v-if="showRatingModal" class="modal-overlay" @click.self="closeRatingModal">
      <div class="rating-modal">
        <div class="modal-header">
          <div>
            <h3>Submit Daily Rating</h3>
            <p>Rate your experience with ReadyTruck</p>
          </div>
          <button @click="closeRatingModal" class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="rating-form">
          <div v-for="criterion in criteria" :key="criterion.id" class="rating-item">
            <div class="rating-label">
              <span class="criteria-name">{{ criterion.name }}</span>
              <span class="criteria-score">{{ ratings[criterion.id] || 0 }}/10</span>
            </div>
            <div class="rating-stars">
              <button
                v-for="n in 10"
                :key="n"
                type="button"
                :class="['star-btn', { active: ratings[criterion.id] >= n }]"
                @click="setRating(criterion.id, n)"
              >
                {{ n }}
              </button>
            </div>
            <input
              type="text"
              v-model="comments[criterion.id]"
              placeholder="Optional comment..."
              class="comment-input"
            />
          </div>
        </div>

        <div v-if="ratingError" class="rating-error">{{ ratingError }}</div>
        <div v-if="ratingSuccess" class="rating-success">{{ ratingSuccess }}</div>

        <div class="modal-footer">
          <button @click="closeRatingModal" class="btn-cancel">Cancel</button>
          <button @click="submitRatings" :disabled="submittingRating || !isRatingValid" class="btn-submit">
            {{ submittingRating ? 'Submitting...' : 'Submit Rating' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dispatcher Contact Modal -->
    <div v-if="showDispatcherModal" class="modal-overlay" @click.self="closeDispatcherModal">
      <div class="dispatcher-modal">
        <div class="modal-header">
          <div>
            <h3>Dispatcher Contact</h3>
            <p>{{ selectedDispatcher.name }}</p>
          </div>
          <button @click="closeDispatcherModal" class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="dispatcher-info">
          <div class="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            <div class="contact-details">
              <span class="contact-label">Phone</span>
              <a v-if="selectedDispatcher.phone" :href="'tel:' + selectedDispatcher.phone" class="contact-value">
                {{ selectedDispatcher.phone }}
              </a>
              <span v-else class="contact-value empty">Not available</span>
            </div>
          </div>
          <div class="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <div class="contact-details">
              <span class="contact-label">Email</span>
              <a v-if="selectedDispatcher.email" :href="'mailto:' + selectedDispatcher.email" class="contact-value">
                {{ selectedDispatcher.email }}
              </a>
              <span v-else class="contact-value empty">Not available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const authStore = useAuthStore()
const trucks = ref([])
const allTrucks = ref([])
const loading = ref(true)
const syncing = ref(false)
const lastSyncTime = ref(null)
const statusFilter = ref('')
const stateFilter = ref('')
const searchQuery = ref('')
const showInactive = ref(false)
const sortColumn = ref('truck_number')
const sortDirection = ref('asc')

// Rating modal state
const showRatingModal = ref(false)
const criteria = ref([])
const ratings = reactive({})
const comments = reactive({})
const submittingRating = ref(false)
const ratingError = ref('')
const ratingSuccess = ref('')

// Dispatcher modal state
const showDispatcherModal = ref(false)
const selectedDispatcher = ref({ name: '', phone: '', email: '' })

const isRatingValid = computed(() => {
  return criteria.value.length > 0 && criteria.value.every(c => ratings[c.id] > 0)
})

const lastSyncDisplay = computed(() => {
  if (!lastSyncTime.value) return 'Never'
  const now = new Date()
  const syncDate = new Date(lastSyncTime.value)
  const diffMs = now - syncDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return syncDate.toLocaleString()
})

// Stats computed properties
const totalTrucks = computed(() => allTrucks.value.filter(t => !t.is_inactive).length)
const readyCount = computed(() => allTrucks.value.filter(t => t.display_status === 'READY' && !t.is_inactive).length)
const enrouteCount = computed(() => allTrucks.value.filter(t => t.display_status === 'ENROUTE' && !t.is_inactive).length)
const atPuCount = computed(() => allTrucks.value.filter(t => t.display_status === 'AT PU' && !t.is_inactive).length)
const atDelCount = computed(() => allTrucks.value.filter(t => t.display_status === 'AT DEL' && !t.is_inactive).length)

const uniqueStates = computed(() => {
  const states = new Set(allTrucks.value.map(t => t.state).filter(Boolean))
  return states.size
})

const availableStates = computed(() => {
  const states = new Set()
  trucks.value.forEach(t => {
    if (t.state) states.add(t.state)
  })
  return Array.from(states).sort()
})

const availableStatuses = computed(() => {
  // Only show the 5 defined display statuses
  return ['READY', 'ENROUTE', 'AT PU', 'AT DEL', 'N/A']
})

const filteredTrucks = computed(() => {
  return trucks.value.filter(truck => {
    const matchesStatus = !statusFilter.value || truck.display_status === statusFilter.value
    const matchesState = !stateFilter.value || truck.state === stateFilter.value
    const matchesSearch = !searchQuery.value ||
      truck.truck_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (truck.city && truck.city.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (truck.state && truck.state.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (truck.display_status && truck.display_status.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (truck.dispatcher && truck.dispatcher.toLowerCase().includes(searchQuery.value.toLowerCase()))
    return matchesStatus && matchesState && matchesSearch
  })
})

// Sorting logic
const sortedTrucks = computed(() => {
  const filtered = filteredTrucks.value
  return [...filtered].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]

    if (aVal == null) aVal = ''
    if (bVal == null) bVal = ''

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getSortIcon(column) {
  if (sortColumn.value !== column) return ''
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

function countByStatus(status) {
  return trucks.value.filter(t => t.status === status).length
}

function countByDisplayStatus(status) {
  return trucks.value.filter(t => t.display_status === status).length
}

function formatLocation(truck) {
  const parts = []
  if (truck.city) parts.push(truck.city)
  if (truck.state) parts.push(truck.state)
  return parts.length > 0 ? parts.join(', ') : '-'
}

function openDispatcherModal(truck) {
  selectedDispatcher.value = {
    name: truck.dispatcher || 'Unknown',
    phone: truck.dispatcher_phone || '',
    email: truck.dispatcher_email || ''
  }
  showDispatcherModal.value = true
}

function closeDispatcherModal() {
  showDispatcherModal.value = false
}

async function loadTrucks() {
  loading.value = true
  try {
    const params = { show_inactive: showInactive.value }
    if (statusFilter.value) params.status_filter = statusFilter.value
    const response = await api.getTrucks(params)
    trucks.value = response.data

    // Also load all trucks for stats
    const allResponse = await api.getTrucks({ show_inactive: true })
    allTrucks.value = allResponse.data

    // Load last sync time
    await loadLastSync()
  } catch (error) {
    console.error('Failed to load trucks:', error)
  } finally {
    loading.value = false
  }
}

async function loadLastSync() {
  try {
    const response = await api.getLastSync()
    lastSyncTime.value = response.data.last_sync
  } catch (error) {
    console.error('Failed to load last sync time:', error)
  }
}

function setFilter(status) {
  statusFilter.value = status
  loadTrucks()
}

async function syncFromPeaka() {
  syncing.value = true
  try {
    const response = await api.syncTrucks()
    lastSyncTime.value = response.data.last_sync
    await loadTrucks()
  } catch (error) {
    console.error('Sync failed:', error)
  } finally {
    syncing.value = false
  }
}

async function toggleInactive(truck) {
  try {
    await api.updateTruckStatus(truck.id, !truck.is_inactive)
    await loadTrucks()
  } catch (error) {
    console.error('Failed to update truck:', error)
  }
}

// Auto-save preferences on blur/enter
async function savePreferences(truck, field, value) {
  // Only save if value actually changed
  if (truck[field] === value) return

  try {
    const preferences = { [field]: value }
    await api.updateTruckPreferences(truck.id, preferences)
    truck[field] = value // Update local state
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

function getState(location) {
  if (!location) return ''
  const parts = location.split(',')
  return parts.length >= 2 ? parts[parts.length - 1].trim() : ''
}

function getStatusClass(truck) {
  if (truck.is_inactive) return 'inactive'
  const status = (truck.display_status || '').toUpperCase()
  // Map display statuses to CSS classes
  const statusMap = {
    'READY': 'ready',
    'ENROUTE': 'enroute',
    'AT PU': 'at-pu',
    'AT DEL': 'at-del',
    'N/A': 'na'
  }
  return statusMap[status] || 'na'
}

function getHoursClass(hours) {
  if (hours == null) return ''
  if (hours >= 48) return 'hours-critical'
  if (hours >= 24) return 'hours-warning'
  return 'hours-normal'
}

// Rating modal functions
async function openRatingModal() {
  ratingError.value = ''
  ratingSuccess.value = ''
  try {
    const response = await api.getCriteria()
    criteria.value = response.data
    criteria.value.forEach(c => {
      ratings[c.id] = 0
      comments[c.id] = ''
    })
    showRatingModal.value = true
  } catch (err) {
    console.error('Failed to load criteria:', err)
  }
}

function closeRatingModal() {
  showRatingModal.value = false
}

function setRating(criteriaId, score) {
  ratings[criteriaId] = score
}

async function submitRatings() {
  ratingError.value = ''
  ratingSuccess.value = ''
  submittingRating.value = true

  try {
    const gradesData = criteria.value.map(c => ({
      criteria_id: c.id,
      score: ratings[c.id],
      comment: comments[c.id] || null
    }))

    await api.createGrades(gradesData)
    ratingSuccess.value = 'Rating submitted successfully!'

    setTimeout(() => {
      closeRatingModal()
    }, 1500)
  } catch (err) {
    ratingError.value = err.response?.data?.detail || 'Failed to submit rating'
  } finally {
    submittingRating.value = false
  }
}

onMounted(loadTrucks)
</script>

<style scoped>
/* ================================================
   REFINED DARK THEME - PROFESSIONAL FLEET DASHBOARD
   ================================================ */

.trucks-page {
  background: #1e293b;
  min-height: calc(100vh - 64px);
  padding: 2rem;
  color: #e2e8f0;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.stat-card {
  background: #334155;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #475569;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: #64748b;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 800;
  color: #3b82f6;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card.total::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.stat-card.total .stat-value {
  color: #3b82f6;
}

.stat-card.ready::before {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.stat-card.ready .stat-value {
  color: #10b981;
}

.stat-card.enroute::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.stat-card.enroute .stat-value {
  color: #60a5fa;
}

.stat-card.at-pu::before {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.stat-card.at-pu .stat-value {
  color: #f59e0b;
}

.stat-card.at-del::before {
  background: linear-gradient(90deg, #ec4899, #f472b6);
}

.stat-card.at-del .stat-value {
  color: #ec4899;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.75rem;
  max-width: 1400px;
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

.last-sync {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 400;
  margin-top: 0.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-sync {
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

.btn-sync:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-sync .icon {
  width: 16px;
  height: 16px;
}

.toggle-inactive {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.toggle-inactive:hover {
  background: #334155;
  color: #f1f5f9;
}

.toggle-inactive input {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
}

/* Filters */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  gap: 1rem;
  flex-wrap: wrap;
  background: #334155;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #475569;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.filter-tabs {
  display: flex;
  gap: 0.375rem;
  background: #1e293b;
  padding: 0.375rem;
  border-radius: 12px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  color: #f1f5f9;
  background: rgba(59, 130, 246, 0.15);
}

.tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.tab .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.ready { background: #10b981; }
.dot.enroute { background: #3b82f6; }
.dot.at-pu { background: #f59e0b; }
.dot.at-del { background: #ec4899; }
.dot.na { background: #6b7280; }

.tab .count {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tab.active .count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.filter-controls {
  display: flex;
  gap: 0.875rem;
}

.state-select,
.status-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #475569;
  border-radius: 8px;
  font-size: 0.8rem;
  background: #1e293b;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.state-select:hover,
.status-select:hover {
  border-color: #64748b;
}

.state-select:focus,
.status-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-box {
  position: relative;
}

.search-box .search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: color 0.2s;
}

.search-box input {
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  border: 1px solid #475569;
  border-radius: 10px;
  font-size: 0.875rem;
  width: 220px;
  background: #1e293b;
  color: #e2e8f0;
  transition: all 0.2s;
}

.search-box input:hover {
  border-color: #64748b;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-box:focus-within .search-icon {
  color: #3b82f6;
}

.search-box input::placeholder {
  color: #64748b;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  color: #94a3b8;
  background: #334155;
  border-radius: 16px;
  border: 1px solid #475569;
  max-width: 1400px;
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

.empty-state svg {
  width: 72px;
  height: 72px;
  color: #64748b;
  margin-bottom: 1.25rem;
}

.empty-state h3 {
  color: #f1f5f9;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.375rem;
}

.empty-state p {
  color: #64748b;
}

/* Table Container */
.table-container {
  background: #334155;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #475569;
  overflow-x: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.fleet-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.fleet-table th {
  background: #1e293b;
  padding: 0.75rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #475569;
  white-space: nowrap;
}

.fleet-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.fleet-table th.sortable:hover {
  color: #3b82f6;
}

.sort-icon {
  margin-left: 0.5rem;
  font-size: 0.6rem;
  color: #3b82f6;
}

.fleet-table td {
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #475569;
  font-size: 0.8rem;
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

.table-row.inactive {
  opacity: 0.5;
}

.table-row.inactive:hover {
  opacity: 0.7;
}

.truck-number {
  font-weight: 700;
  color: #60a5fa;
  font-size: 0.8rem;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.status-badge.ready {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.status-badge.enroute {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.status-badge.dispatched {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.status-badge.at-pu {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-badge.at-del {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.status-badge.na {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Hours Display */
.hours-cell {
  font-weight: 600;
  font-size: 0.75rem;
}

.hours-normal {
  color: #34d399;
}

.hours-warning {
  color: #fbbf24;
}

.hours-critical {
  color: #f87171;
}

/* State cell */
.state-cell {
  font-weight: 500;
  color: #94a3b8;
}

/* Dispatcher cell */
.dispatcher-cell {
  max-width: 150px;
}

.dispatcher-btn {
  background: transparent;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dispatcher-btn:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

/* Location cell */
.location-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Inline Edit Fields */
.inline-edit {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  color: #e2e8f0;
  width: 100%;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.inline-edit:hover {
  border-color: #64748b;
}

.inline-edit:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.inline-edit::placeholder {
  color: #64748b;
}

.inline-edit.narrow {
  width: 70px;
}

.inline-edit.wide {
  min-width: 120px;
}

/* Action Button */
.action-btn {
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.action-btn.deactivate {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.action-btn.deactivate:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.action-btn.activate {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.action-btn.activate:hover {
  background: rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

/* Rating Button */
.btn-rate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
}

.btn-rate svg {
  width: 16px;
  height: 16px;
}

.btn-rate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}

/* Modal Overlay */
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

/* Dispatcher Modal */
.dispatcher-modal {
  background: #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
  border: 1px solid #475569;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.dispatcher-info {
  padding: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #1e293b;
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-item svg {
  width: 24px;
  height: 24px;
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.contact-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.contact-value {
  font-size: 0.95rem;
  color: #f1f5f9;
  word-break: break-all;
  text-decoration: none;
  transition: color 0.2s;
}

.contact-value:hover {
  color: #3b82f6;
}

.contact-value.empty {
  color: #64748b;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .trucks-page {
    padding: 1.25rem;
  }

  .stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1.25rem;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }

  .filter-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .filter-controls {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-box input {
    width: 100%;
  }

  .state-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }
}

/* Rating Modal */
.rating-modal {
  background: #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  border: 1px solid #475569;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.rating-form {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.rating-item {
  background: #1e293b;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.rating-item:last-child {
  margin-bottom: 0;
}

.rating-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.criteria-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.criteria-score {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
}

.rating-stars {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.star-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #334155;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.star-btn:hover {
  border-color: #f59e0b;
  color: #fbbf24;
}

.star-btn.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: #f59e0b;
  color: white;
}

.comment-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #475569;
  border-radius: 8px;
  background: #334155;
  color: #e2e8f0;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.comment-input::placeholder {
  color: #64748b;
}

.rating-error {
  margin: 0 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.85rem;
}

.rating-success {
  margin: 0 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: #34d399;
  font-size: 0.85rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #475569;
  background: #1e293b;
}

.btn-cancel {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid #475569;
  border-radius: 8px;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #64748b;
  color: #f1f5f9;
  background: #475569;
}

.btn-submit {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
