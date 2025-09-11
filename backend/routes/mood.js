const express = require('express');
const router = express.Router();
const {
  createMoodLog,
  getMoodLogs,
  getMoodLog,
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getTodayMoodLog,
  getMoodStreak
} = require('../controllers/moodController');
const { validateMoodLog, validatePagination, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(require('../middleware/auth').auth);

// Mood log CRUD operations
router.post('/', validateMoodLog, createMoodLog);
router.get('/', validatePagination, getMoodLogs);
router.get('/today', getTodayMoodLog);
router.get('/stats', getMoodStats);
router.get('/streak', getMoodStreak);
router.get('/:id', validateObjectId('id'), getMoodLog);
router.put('/:id', validateObjectId('id'), validateMoodLog, updateMoodLog);
router.delete('/:id', validateObjectId('id'), deleteMoodLog);

module.exports = router;
