const Booking = require('../models/Booking');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      counsellorId,
      appointmentDate,
      startTime,
      endTime,
      type,
      mode,
      location,
      reason,
      priority
    } = req.body;

    const studentId = req.user.id;

    // Check if counsellor exists and has counsellor role
    const counsellor = await User.findById(counsellorId);
    if (!counsellor || counsellor.role !== 'counsellor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid counsellor selected'
      });
    }

    // Check for time conflicts
    const conflictingBooking = await Booking.findOne({
      counsellor: counsellorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Calculate duration
    const start = moment(`${appointmentDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const end = moment(`${appointmentDate} ${endTime}`, 'YYYY-MM-DD HH:mm');
    const duration = end.diff(start, 'minutes');

    const booking = new Booking({
      student: studentId,
      counsellor: counsellorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      duration,
      type,
      mode,
      location,
      reason,
      priority
    });

    await booking.save();

    // Populate the booking with user details
    await booking.populate([
      { path: 'student', select: 'firstName lastName studentId email' },
      { path: 'counsellor', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get bookings with filters
const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, counsellorId, studentId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'counsellor') {
      filter.counsellor = req.user.id;
    } else if (req.user.role === 'student') {
      filter.student = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all bookings
      if (counsellorId) filter.counsellor = counsellorId;
      if (studentId) filter.student = studentId;
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    const bookings = await Booking.find(filter)
      .populate('student', 'firstName lastName studentId email')
      .populate('counsellor', 'firstName lastName email')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get student's own bookings
const getStudentBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { student: req.user.id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('counsellor', 'firstName lastName email')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('student', 'firstName lastName studentId email')
      .populate('counsellor', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access permissions
    const hasAccess = req.user.role === 'admin' || 
                     booking.student._id.toString() === req.user.id ||
                     booking.counsellor._id.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     booking.counsellor.toString() === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const allowedUpdates = ['notes', 'status', 'priority'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle counsellor notes specifically
    if (req.body.counsellorNotes) {
      updates['notes.counsellor'] = req.body.counsellorNotes;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'student', select: 'firstName lastName studentId email' },
      { path: 'counsellor', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canCancel = req.user.role === 'admin' || 
                     booking.student.toString() === req.user.id ||
                     booking.counsellor.toString() === req.user.id;

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await booking.cancel(req.user.id, reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reschedule booking
const rescheduleBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { newDate, newStartTime, newEndTime, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canReschedule = req.user.role === 'admin' || 
                         booking.student.toString() === req.user.id ||
                         booking.counsellor.toString() === req.user.id;

    if (!canReschedule) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check for conflicts with new time
    const conflictingBooking = await Booking.findOne({
      counsellor: booking.counsellor,
      appointmentDate: new Date(newDate),
      startTime: newStartTime,
      status: { $in: ['scheduled', 'confirmed'] },
      _id: { $ne: booking._id }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'New time slot is already booked'
      });
    }

    await booking.reschedule(newDate, newStartTime, newEndTime, req.user.id, reason);

    res.json({
      success: true,
      message: 'Booking rescheduled successfully'
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete booking
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only counsellors and admins can complete bookings
    const canComplete = req.user.role === 'admin' || 
                       booking.counsellor.toString() === req.user.id;

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await booking.complete();

    res.json({
      success: true,
      message: 'Booking completed successfully'
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available time slots for a counsellor
const getAvailableSlots = async (req, res) => {
  try {
    const { counsellorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const slots = await Booking.getAvailableSlots(counsellorId, date);

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get counsellor schedule
const getCounsellorSchedule = async (req, res) => {
  try {
    const { counsellorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const schedule = await Booking.getCounsellorSchedule(counsellorId, startDate, endDate);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get counsellor schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add feedback to booking
const addFeedback = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only students can add feedback
    if (booking.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    booking.feedback.student = {
      rating,
      comments,
      submittedAt: new Date()
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Role-based filtering
    if (req.user.role === 'counsellor') {
      filter.counsellor = req.user.id;
    } else if (req.user.role === 'student') {
      filter.student = req.user.id;
    }

    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageRating: { $avg: '$feedback.student.rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        averageRating: 0
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
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
};
