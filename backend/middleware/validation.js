const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Student ID must be between 3 and 20 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name must be less than 100 characters'),
  
  body('year')
    .optional()
    .isIn(['1st', '2nd', '3rd', '4th', '5th', 'PG', 'PhD'])
    .withMessage('Invalid year selection'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Mood log validation
const validateMoodLog = [
  body('mood')
    .isIn(['happy', 'sad', 'anxious', 'stressed', 'tired', 'angry', 'excited', 'calm', 'confused', 'lonely'])
    .withMessage('Invalid mood selection'),
  
  body('intensity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Intensity must be between 1 and 10'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  body('triggers')
    .optional()
    .isArray()
    .withMessage('Triggers must be an array'),
  
  body('triggers.*')
    .optional()
    .isIn(['academic', 'social', 'family', 'health', 'financial', 'relationship', 'work', 'other'])
    .withMessage('Invalid trigger selection'),
  
  body('activities')
    .optional()
    .isArray()
    .withMessage('Activities must be an array'),
  
  body('activities.*')
    .optional()
    .isIn(['exercise', 'study', 'social', 'rest', 'hobby', 'work', 'other'])
    .withMessage('Invalid activity selection'),
  
  body('sleep.hours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be between 0 and 24'),
  
  body('sleep.quality')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid sleep quality selection'),
  
  body('stressLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Stress level must be between 1 and 10'),
  
  body('energyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Energy level must be between 1 and 10'),
  
  handleValidationErrors
];

// Forum post validation
const validateForumPost = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters'),
  
  handleValidationErrors
];

// Booking validation
const validateBooking = [
  body('counsellorId')
    .isMongoId()
    .withMessage('Invalid counsellor ID'),
  
  body('appointmentDate')
    .isISO8601()
    .withMessage('Invalid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      return true;
    }),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  
  body('type')
    .isIn(['individual', 'group', 'crisis', 'follow_up'])
    .withMessage('Invalid appointment type'),
  
  body('mode')
    .isIn(['in_person', 'online', 'phone'])
    .withMessage('Invalid appointment mode'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason for appointment is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  handleValidationErrors
];

// Resource validation
const validateResource = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('type')
    .isIn(['video', 'audio', 'article', 'document', 'link', 'exercise', 'meditation'])
    .withMessage('Invalid resource type'),
  
  body('category')
    .isIn(['stress_management', 'anxiety_relief', 'sleep_hygiene', 'mindfulness', 'crisis_support', 'academic_stress', 'relationships', 'general_wellness'])
    .withMessage('Invalid resource category'),
  
  body('language')
    .isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'or', 'pa', 'ur'])
    .withMessage('Invalid language selection'),
  
  body('content.url')
    .isURL()
    .withMessage('Invalid content URL'),
  
  body('targetAudience')
    .optional()
    .isIn(['all', 'students', 'first_year', 'final_year', 'postgraduate', 'counsellors'])
    .withMessage('Invalid target audience'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  
  handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'or', 'pa', 'ur'])
    .withMessage('Invalid language selection'),
  
  handleValidationErrors
];

// ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Booking update validation
const validateBookingUpdate = [
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('counsellorNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Counsellor notes must be less than 1000 characters'),
  
  handleValidationErrors
];

// Booking reschedule validation
const validateBookingReschedule = [
  body('newDate')
    .isISO8601()
    .withMessage('Invalid new appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('New appointment date cannot be in the past');
      }
      
      return true;
    }),
  
  body('newStartTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid new start time format (HH:MM)'),
  
  body('newEndTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid new end time format (HH:MM)'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reschedule reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  handleValidationErrors
];

// Admin action validation
const validateAdminAction = [
  body('action')
    .isIn(['approve', 'reject', 'hide', 'delete'])
    .withMessage('Invalid admin action'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateMoodLog,
  validateForumPost,
  validateBooking,
  validateBookingUpdate,
  validateBookingReschedule,
  validateResource,
  validateChatMessage,
  validateObjectId,
  validatePagination,
  validateDateRange,
  validateAdminAction
};
