const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  rescheduleBooking,
  completeBooking,
  getAvailableSlots,
  getCounsellorSchedule,
  getStudentBookings,
  addFeedback,
  getBookingStats
} = require('../controllers/bookingController');
const { 
  validateBooking, 
  validatePagination, 
  validateObjectId,
  validateBookingUpdate,
  validateBookingReschedule
} = require('../middleware/validation');
const { auth, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Booking CRUD operations
router.post('/', validateBooking, createBooking);
router.get('/', validatePagination, getBookings);
router.get('/student', getStudentBookings);
router.get('/stats', getBookingStats);
router.get('/available-slots/:counsellorId', validateObjectId('counsellorId'), getAvailableSlots);
router.get('/counsellor-schedule/:counsellorId', validateObjectId('counsellorId'), getCounsellorSchedule);
router.get('/:id', validateObjectId('id'), getBooking);
router.put('/:id', validateObjectId('id'), validateBookingUpdate, updateBooking);
router.put('/:id/cancel', validateObjectId('id'), cancelBooking);
router.put('/:id/reschedule', validateObjectId('id'), validateBookingReschedule, rescheduleBooking);
router.put('/:id/complete', validateObjectId('id'), completeBooking);
router.post('/:id/feedback', validateObjectId('id'), addFeedback);

module.exports = router;
