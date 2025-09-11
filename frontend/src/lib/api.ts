import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  mood: {
    logs: '/mood',
    today: '/mood/today',
    stats: '/mood/stats',
    streak: '/mood/streak',
  },
  chat: {
    sessions: '/chat/sessions',
    session: '/chat/session',
    message: '/chat/message',
    copingStrategies: '/chat/coping-strategies',
    crisisResources: '/chat/crisis-resources',
  },
  forum: {
    forums: '/forum',
    posts: '/forum/posts',
    join: '/forum/join',
    leave: '/forum/leave',
  },
  resources: {
    list: '/resources',
    categories: '/resources/categories',
    search: '/resources/search',
  },
  booking: {
    bookings: '/booking',
    availableSlots: '/booking/available-slots',
    counsellorSchedule: '/booking/counsellor-schedule',
    studentBookings: '/booking/student',
    stats: '/booking/stats',
  },
  admin: {
    dashboard: '/admin/dashboard',
    moodAnalytics: '/admin/analytics/mood',
    userAnalytics: '/admin/analytics/users',
    bookingAnalytics: '/admin/analytics/bookings',
    forumAnalytics: '/admin/analytics/forums',
    resourceAnalytics: '/admin/analytics/resources',
    exportMoodData: '/admin/export/mood-data',
    exportUserData: '/admin/export/user-data',
    crisisAlerts: '/admin/crisis-alerts',
    systemHealth: '/admin/system-health',
  },
}

export default api
