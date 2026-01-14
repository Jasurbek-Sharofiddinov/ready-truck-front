<template>
  <div class="dashboard">
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>Welcome back, {{ authStore.user?.username }}</h1>
        <p>Here's what's happening with your fleet today.</p>
      </div>
      <div class="welcome-graphic">
        <svg viewBox="0 0 120 60" fill="none">
          <rect x="5" y="15" width="60" height="35" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M65 25h25l15 10v15H65V25z" stroke="currentColor" stroke-width="2"/>
          <circle cx="20" cy="52" r="8" stroke="currentColor" stroke-width="2"/>
          <circle cx="90" cy="52" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M0 52h120" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
        </svg>
      </div>
    </div>

    <div class="quick-actions">
      <router-link to="/trucks" class="action-card fleet">
        <div class="action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div class="action-content">
          <h3>Fleet Overview</h3>
          <p>View and manage your trucks</p>
        </div>
        <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </router-link>

      <router-link to="/grading" class="action-card ratings">
        <div class="action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="action-content">
          <h3>Performance Ratings</h3>
          <p>Submit your daily ratings</p>
        </div>
        <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </router-link>

      <template v-if="authStore.isAdmin">
        <router-link to="/admin/users" class="action-card users">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="action-content">
            <h3>User Management</h3>
            <p>Add and manage broker accounts</p>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>

        <router-link to="/admin/analytics" class="action-card analytics">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <div class="action-content">
            <h3>Analytics & Reports</h3>
            <p>View ratings and export data</p>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  overflow: hidden;
  position: relative;
}

.welcome-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-content p {
  color: rgba(255,255,255,0.7);
  font-size: 0.95rem;
}

.welcome-graphic {
  width: 200px;
  opacity: 0.3;
}

.welcome-graphic svg {
  width: 100%;
  height: auto;
  color: white;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  text-decoration: none;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 8px 24px var(--shadow-lg);
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-card.fleet .action-icon {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
}

.action-card.ratings .action-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.action-card.users .action-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.action-card.analytics .action-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.action-content p {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.action-arrow {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
}

.action-card:hover .action-arrow {
  color: #0ea5e9;
  transform: translateX(4px);
}

@media (max-width: 640px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .welcome-graphic {
    display: none;
  }
}
</style>
