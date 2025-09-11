const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMoodAnalytics,
  getUserAnalytics,
  getBookingAnalytics,
  getForumAnalytics,
  getResourceAnalytics,
  exportMoodData,
  exportUserData,
  getCrisisAlerts,
  getSystemHealth,
  manageUsers,
  manageForums,
  manageResources,
  getModerationQueue,
  moderateContent,
  sendSystemAnnouncement,
  getAuditLogs
} = require('../controllers/adminController');
const { 
  validatePagination, 
  validateObjectId,
  validateDateRange,
  validateAdminAction
} = require('../middleware/validation');
const { auth, requireRole } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(requireRole(['admin', 'counsellor']));

// Dashboard and Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/mood', validateDateRange, getMoodAnalytics);
router.get('/analytics/users', validateDateRange, getUserAnalytics);
router.get('/analytics/bookings', validateDateRange, getBookingAnalytics);
router.get('/analytics/forums', validateDateRange, getForumAnalytics);
router.get('/analytics/resources', validateDateRange, getResourceAnalytics);

// Data Export
router.get('/export/mood-data', validateDateRange, exportMoodData);
router.get('/export/user-data', validateDateRange, exportUserData);

// Crisis Management
router.get('/crisis-alerts', getCrisisAlerts);
router.get('/system-health', getSystemHealth);

// User Management (Admin only)
router.use(requireRole(['admin']));
router.get('/users', validatePagination, manageUsers);
router.put('/users/:id/status', validateObjectId('id'), manageUsers);
router.put('/users/:id/role', validateObjectId('id'), manageUsers);

// Content Management
router.get('/moderation/queue', validatePagination, getModerationQueue);
router.put('/moderation/:contentId', validateObjectId('contentId'), validateAdminAction, moderateContent);
router.get('/forums', validatePagination, manageForums);
router.put('/forums/:id/status', validateObjectId('id'), manageForums);
router.get('/resources', validatePagination, manageResources);
router.put('/resources/:id/status', validateObjectId('id'), manageResources);

// System Management
router.post('/announcements', sendSystemAnnouncement);
router.get('/audit-logs', validatePagination, validateDateRange, getAuditLogs);

module.exports = router;
