import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trucks',
    name: 'Trucks',
    component: () => import('../views/Trucks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'Users',
    component: () => import('../views/admin/Users.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/criteria',
    name: 'Criteria',
    component: () => import('../views/admin/Criteria.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/analytics',
    name: 'Analytics',
    component: () => import('../views/admin/Analytics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // Redirect non-admins trying to access admin routes to trucks
    next('/trucks')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect logged in users: admins to dashboard, brokers to trucks
    next(authStore.isAdmin ? '/' : '/trucks')
  } else if (to.path === '/' && authStore.isAuthenticated && !authStore.isAdmin) {
    // Brokers trying to access dashboard get redirected to trucks
    next('/trucks')
  } else {
    next()
  }
})

export default router
