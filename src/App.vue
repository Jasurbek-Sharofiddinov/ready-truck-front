<template>
  <div class="app" :class="{ dark: themeStore.isDark }">
    <nav v-if="authStore.isAuthenticated" class="navbar">
      <div class="nav-brand">
        <span class="brand-name">Taylor Transports LLC</span>
      </div>
      <div class="nav-links">
        <!-- Admin sees all nav links -->
        <template v-if="authStore.isAdmin">
          <router-link to="/" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </router-link>
          <router-link to="/trucks" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Fleet
          </router-link>
          <router-link to="/admin/users" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Users
          </router-link>
          <router-link to="/admin/criteria" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Criteria
          </router-link>
          <router-link to="/admin/analytics" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            Analytics
          </router-link>
        </template>
        <!-- Broker only sees Fleet -->
        <template v-else>
          <router-link to="/trucks" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Fleet
          </router-link>
        </template>
      </div>
      <div class="nav-user">
        <button @click="themeStore.toggleTheme" class="btn-theme" :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <!-- Sun icon for dark mode (click to go light) -->
          <svg v-if="themeStore.isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <!-- Moon icon for light mode (click to go dark) -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        </button>
        <router-link to="/profile" class="user-badge" title="Edit Profile">
          <span class="user-avatar">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.username }}</span>
            <span class="user-role">{{ authStore.user?.role }}</span>
          </div>
        </router-link>
        <button @click="logout" class="btn-logout" title="Sign Out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
* {
  box-sizing: border-box;
}

/* Light theme (default) */
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  --shadow: rgba(0, 0, 0, 0.08);
  --shadow-lg: rgba(0, 0, 0, 0.1);
}

/* Dark theme */
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --border-hover: #475569;
  --shadow: rgba(0, 0, 0, 0.25);
  --shadow-lg: rgba(0, 0, 0, 0.4);
}

body {
  margin: 0;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dark body,
body.dark {
  background: #0f172a;
}

.app {
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

.navbar {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  height: 72px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.3s ease;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-links {
  display: flex;
  gap: 0.25rem;
  margin-left: 3rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link svg {
  width: 18px;
  height: 18px;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-link.router-link-active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.nav-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-theme {
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-theme svg {
  width: 20px;
  height: 20px;
}

.btn-theme:hover {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: pointer;
}

.user-badge:hover {
  background: var(--bg-tertiary);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.btn-logout {
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout svg {
  width: 20px;
  height: 20px;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
}

.main-content {
  padding: 0;
}
</style>
