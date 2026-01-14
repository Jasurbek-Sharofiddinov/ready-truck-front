<template>
  <div class="analytics-page">
    <div class="page-header">
      <div>
        <h1>Analytics & Reports</h1>
        <p class="subtitle">Performance ratings overview</p>
      </div>
      <button @click="exportData" :disabled="exporting" class="btn-export">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        {{ exporting ? 'Exporting...' : 'Export CSV' }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card total">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ brokerRatings.length }}</span>
            <span class="card-label">Broker Submissions</span>
          </div>
        </div>
        <div v-for="avg in analytics.criteria_averages" :key="avg.criteria_id" class="summary-card">
          <div class="card-icon criteria">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ avg.average_score }}<small>/10</small></span>
            <span class="card-label">{{ avg.criteria_name }}</span>
          </div>
        </div>
      </div>

      <!-- Brokers Section -->
      <div class="section">
        <h2>Ratings by Broker</h2>
        <p class="section-desc">Click on a broker to view their rating history</p>

        <div class="brokers-grid">
          <div
            v-for="broker in brokerRatings"
            :key="broker.name"
            class="broker-card"
            @click="openBrokerModal(broker.name)"
          >
            <div class="broker-avatar">{{ broker.name?.charAt(0).toUpperCase() }}</div>
            <div class="broker-info">
              <span class="broker-name">{{ broker.name }}</span>
              <span class="broker-count">{{ brokerSubmissionCounts[broker.name] || 0 }} submission{{ (brokerSubmissionCounts[broker.name] || 0) !== 1 ? 's' : '' }}</span>
            </div>
            <svg class="broker-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="section">
        <h2>Recent Ratings</h2>
        <p class="section-desc">Latest rating submission from each broker</p>
        <div class="ratings-table">
          <table>
            <thead>
              <tr>
                <th>Broker</th>
                <th v-for="criteria in criteriaList" :key="criteria">{{ criteria }}</th>
                <th>Avg %</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="broker in brokerRatings" :key="broker.name">
                <td class="broker-cell">
                  <div class="broker-avatar-small">{{ broker.name?.charAt(0).toUpperCase() }}</div>
                  <span>{{ broker.name }}</span>
                </td>
                <td v-for="criteria in criteriaList" :key="criteria" class="score-cell">
                  <span :class="['score-badge', getScoreClass(broker.scores[criteria])]">
                    {{ broker.scores[criteria] || '-' }}
                  </span>
                </td>
                <td class="score-cell">
                  <span :class="['score-badge', 'percentage', getScoreClass(getBrokerAverage(broker.scores))]">
                    {{ getBrokerPercentage(broker.scores) }}%
                  </span>
                </td>
                <td class="date-cell">{{ formatDate(broker.date) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="totals-row">
                <td class="totals-label">Average</td>
                <td v-for="criteria in criteriaList" :key="criteria" class="score-cell">
                  <span :class="['score-badge', 'percentage', getScoreClass(getCriteriaAverage(criteria))]">
                    {{ getCriteriaPercentage(criteria) }}%
                  </span>
                </td>
                <td class="score-cell">
                  <span :class="['score-badge', 'percentage', 'grand-total', getScoreClass(getGrandAverage())]">
                    {{ getGrandPercentage() }}%
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- Broker Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-avatar">{{ selectedBroker?.charAt(0).toUpperCase() }}</div>
            <div>
              <h3>{{ selectedBroker }}</h3>
              <p>Rating History</p>
            </div>
          </div>
          <button @click="closeModal" class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-stats">
          <div v-for="avg in brokerAverages" :key="avg.criteria" class="stat-item">
            <span class="stat-label">{{ avg.criteria }}</span>
            <div class="stat-bar-container">
              <div class="stat-bar" :style="{ width: (avg.average / 10 * 100) + '%' }"></div>
            </div>
            <span class="stat-value">{{ avg.average.toFixed(1) }}</span>
          </div>
        </div>

        <div class="modal-history">
          <h4>All Submissions</h4>
          <div class="history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th v-for="criteria in criteriaList" :key="criteria">{{ criteria }}</th>
                  <th>Avg %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="submission in brokerSubmissions" :key="submission.date">
                  <td class="date-cell">{{ formatDate(submission.date) }}</td>
                  <td v-for="criteria in criteriaList" :key="criteria" class="score-cell">
                    <span :class="['score-badge', getScoreClass(submission.scores[criteria])]">
                      {{ submission.scores[criteria] || '-' }}
                    </span>
                  </td>
                  <td class="score-cell">
                    <span :class="['score-badge', 'percentage', getScoreClass(getBrokerAverage(submission.scores))]">
                      {{ getBrokerPercentage(submission.scores) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api'

const analytics = ref({ criteria_averages: [], total_grades: 0, grades_by_broker: {} })
const grades = ref([])  // Latest grades only (for Recent Ratings table)
const allGrades = ref([])  // All grades (for counting total submissions)
const loading = ref(true)
const exporting = ref(false)
const showModal = ref(false)
const selectedBroker = ref(null)

const brokerGrades = computed(() => {
  if (!selectedBroker.value) return []
  // Use allGrades to show full history in the modal
  return allGrades.value.filter(g => g.broker_name === selectedBroker.value)
})

// Group broker's grades by submission (timestamp) for the modal table
const brokerSubmissions = computed(() => {
  if (!selectedBroker.value) return []

  const submissionMap = {}

  brokerGrades.value.forEach(g => {
    // Round to 10-second window to group ratings submitted together
    const timestamp = new Date(g.created_at)
    const key = Math.floor(timestamp.getTime() / 10000) * 10000  // 10 second window

    if (!submissionMap[key]) {
      submissionMap[key] = {
        date: g.created_at,
        scores: {}
      }
    }
    submissionMap[key].scores[g.criteria_name] = g.score
  })

  // Sort by date (most recent first)
  return Object.values(submissionMap).sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Get unique criteria names
const criteriaList = computed(() => {
  const criteria = new Set()
  grades.value.forEach(g => {
    if (g.criteria_name) criteria.add(g.criteria_name)
  })
  return Array.from(criteria)
})

// Count total submissions per broker (from all grades, not just latest)
const brokerSubmissionCounts = computed(() => {
  const counts = {}

  allGrades.value.forEach(g => {
    const broker = g.broker_name
    if (!counts[broker]) {
      counts[broker] = new Set()
    }
    // Round to 10-second window to group ratings submitted together
    const timestamp = new Date(g.created_at)
    const key = Math.floor(timestamp.getTime() / 10000) * 10000
    counts[broker].add(key)
  })

  // Convert Sets to counts
  const result = {}
  for (const [broker, timestamps] of Object.entries(counts)) {
    result[broker] = timestamps.size
  }
  return result
})

// Group grades by broker with their scores in columns
const brokerRatings = computed(() => {
  const brokerMap = {}

  grades.value.forEach(g => {
    if (!brokerMap[g.broker_name]) {
      brokerMap[g.broker_name] = {
        name: g.broker_name,
        scores: {},
        date: g.created_at
      }
    }
    brokerMap[g.broker_name].scores[g.criteria_name] = g.score
    // Use the most recent date
    if (new Date(g.created_at) > new Date(brokerMap[g.broker_name].date)) {
      brokerMap[g.broker_name].date = g.created_at
    }
  })

  // Sort by date (most recent first)
  return Object.values(brokerMap).sort((a, b) => new Date(b.date) - new Date(a.date))
})

function getScoreClass(score) {
  if (!score) return ''
  if (score >= 8) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

// Calculate average score for a broker (row total)
function getBrokerAverage(scores) {
  const values = Object.values(scores).filter(v => v != null)
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function getBrokerPercentage(scores) {
  const avg = getBrokerAverage(scores)
  return Math.round(avg * 10)
}

// Calculate average score for a criteria (column total)
function getCriteriaAverage(criteria) {
  const scores = brokerRatings.value
    .map(b => b.scores[criteria])
    .filter(s => s != null)
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function getCriteriaPercentage(criteria) {
  return Math.round(getCriteriaAverage(criteria) * 10)
}

// Calculate grand total average
function getGrandAverage() {
  const allScores = []
  brokerRatings.value.forEach(b => {
    Object.values(b.scores).forEach(s => {
      if (s != null) allScores.push(s)
    })
  })
  if (allScores.length === 0) return 0
  return allScores.reduce((a, b) => a + b, 0) / allScores.length
}

function getGrandPercentage() {
  return Math.round(getGrandAverage() * 10)
}

const brokerAverages = computed(() => {
  if (!selectedBroker.value) return []
  const bg = brokerGrades.value
  const criteriaMap = {}

  bg.forEach(g => {
    if (!criteriaMap[g.criteria_name]) {
      criteriaMap[g.criteria_name] = { total: 0, count: 0 }
    }
    criteriaMap[g.criteria_name].total += g.score
    criteriaMap[g.criteria_name].count++
  })

  return Object.entries(criteriaMap).map(([criteria, data]) => ({
    criteria,
    average: data.total / data.count
  }))
})

async function loadData() {
  loading.value = true
  try {
    const [analyticsRes, gradesRes, allGradesRes] = await Promise.all([
      api.getAnalytics(),
      api.getGrades({ latest_only: 'true' }),  // For Recent Ratings table
      api.getGrades()  // All grades for counting submissions (no filter)
    ])
    analytics.value = analyticsRes.data
    grades.value = gradesRes.data
    allGrades.value = allGradesRes.data
    console.log('All grades loaded:', allGrades.value.length)
  } catch (err) {
    console.error('Failed to load analytics:', err)
  } finally {
    loading.value = false
  }
}

function openBrokerModal(broker) {
  selectedBroker.value = broker
  showModal.value = true
  // Debug logging
  console.log('Opening modal for:', broker)
  console.log('All grades for broker:', allGrades.value.filter(g => g.broker_name === broker))
  console.log('Broker grades:', brokerGrades.value)
  console.log('Broker submissions:', brokerSubmissions.value)
}

function closeModal() {
  showModal.value = false
  selectedBroker.value = null
}

async function exportData() {
  exporting.value = true
  try {
    const response = await api.exportGrades()
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'grades_export.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (err) {
    alert('Failed to export data')
  } finally {
    exporting.value = false
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000 / 60)

  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(loadData)
</script>

<style scoped>
.analytics-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
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

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-export svg {
  width: 18px;
  height: 18px;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: #94a3b8;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #475569;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-icon.criteria {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
}

.card-value small {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.card-label {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* Section */
.section {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
}

.section-desc {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

/* Brokers Grid */
.brokers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.broker-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.broker-card:hover {
  background: #475569;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.broker-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
}

.broker-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.broker-name {
  font-weight: 600;
  color: #f1f5f9;
}

.broker-count {
  font-size: 0.8rem;
  color: #94a3b8;
}

.broker-arrow {
  width: 20px;
  height: 20px;
  color: #64748b;
  transition: all 0.2s;
}

.broker-card:hover .broker-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-avatar {
  width: 36px;
  height: 36px;
  background: #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.activity-text {
  font-size: 0.9rem;
  color: #334155;
}

.activity-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

.activity-score {
  font-weight: 700;
  color: #0ea5e9;
  font-size: 0.95rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #334155;
  border: 1px solid #475569;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #475569;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
}

.modal-title h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.125rem;
}

.modal-title p {
  color: #94a3b8;
  font-size: 0.85rem;
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

.modal-stats {
  padding: 1.5rem;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-label {
  width: 120px;
  font-size: 0.85rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.stat-bar-container {
  flex: 1;
  height: 8px;
  background: #475569;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.3s;
}

.stat-value {
  width: 32px;
  font-weight: 700;
  color: #f1f5f9;
  text-align: right;
}

.modal-history {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-history h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.history-table {
  overflow-x: auto;
}

.history-table table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  text-align: left;
  padding: 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #475569;
  white-space: nowrap;
}

.history-table td {
  padding: 0.6rem;
  border-bottom: 1px solid #475569;
  font-size: 0.85rem;
}

.history-table tr:hover {
  background: rgba(59, 130, 246, 0.1);
}

/* Ratings Table */
.ratings-table {
  overflow-x: auto;
}

.ratings-table table {
  width: 100%;
  border-collapse: collapse;
}

.ratings-table th {
  text-align: left;
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #475569;
  white-space: nowrap;
}

.ratings-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #475569;
  font-size: 0.9rem;
}

.ratings-table tr:hover {
  background: #1e293b;
}

.broker-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #f1f5f9;
}

.broker-avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.score-cell {
  text-align: center;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  background: #475569;
  color: #94a3b8;
}

.score-badge.high {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.score-badge.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.score-badge.low {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.date-cell {
  color: #94a3b8;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Totals Row */
.ratings-table tfoot {
  border-top: 2px solid #475569;
}

.totals-row {
  background: #1e293b;
}

.totals-row td {
  font-weight: 600;
  padding: 1rem 0.75rem;
}

.totals-label {
  color: #f1f5f9;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.score-badge.percentage {
  background: #475569;
  color: #f1f5f9;
  min-width: 45px;
}

.score-badge.percentage.high {
  background: rgba(16, 185, 129, 0.25);
  color: #34d399;
}

.score-badge.percentage.medium {
  background: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.score-badge.percentage.low {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.score-badge.grand-total {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}
</style>
