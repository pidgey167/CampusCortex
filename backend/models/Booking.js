const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counsellor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // in minutes
  },
  type: {
    type: String,
    enum: ['individual', 'group', 'crisis', 'follow_up'],
    default: 'individual'
  },
  mode: {
    type: String,
    enum: ['in_person', 'online', 'phone'],
    default: 'online'
  },
  location: {
    room: String,
    building: String,
    address: String,
    onlineLink: String,
    phoneNumber: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: {
    student: {
      type: String,
      maxlength: 1000
    },
    counsellor: {
      type: String,
      maxlength: 1000
    }
  },
  reminders: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    notes: String
  },
  feedback: {
    student: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      submittedAt: Date
    },
    counsellor: {
      notes: String,
      recommendations: String,
      nextSteps: String,
      submittedAt: Date
    }
  },
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    cancelledAt: Date
  },
  rescheduling: {
    originalDate: Date,
    originalTime: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    rescheduledAt: Date
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ student: 1, appointmentDate: 1 });
bookingSchema.index({ counsellor: 1, appointmentDate: 1 });
bookingSchema.index({ appointmentDate: 1, startTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ priority: 1 });
bookingSchema.index({ type: 1 });

// Virtual for formatted appointment time
bookingSchema.virtual('formattedTime').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for appointment duration in hours
bookingSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Method to check if appointment is in the past
bookingSchema.methods.isPast = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return appointmentDateTime < now;
};

// Method to check if appointment is today
bookingSchema.methods.isToday = function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  
  return today.toDateString() === appointmentDate.toDateString();
};

// Method to cancel appointment
bookingSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    reason,
    cancelledAt: new Date()
  };
  
  return this.save();
};

// Method to reschedule appointment
bookingSchema.methods.reschedule = function(newDate, newStartTime, newEndTime, rescheduledBy, reason) {
  this.rescheduling = {
    originalDate: this.appointmentDate,
    originalTime: this.startTime,
    rescheduledBy,
    reason,
    rescheduledAt: new Date()
  };
  
  this.appointmentDate = newDate;
  this.startTime = newStartTime;
  this.endTime = newEndTime;
  this.status = 'scheduled';
  
  return this.save();
};

// Method to complete appointment
bookingSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// Static method to get available time slots
bookingSchema.statics.getAvailableSlots = async function(counsellorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(9, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(17, 0, 0, 0);
  
  const existingBookings = await this.find({
    counsellor: counsellorId,
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed'] }
  });
  
  const bookedSlots = existingBookings.map(booking => ({
    start: booking.startTime,
    end: booking.endTime
  }));
  
  // Generate available slots (assuming 1-hour slots)
  const availableSlots = [];
  const currentTime = new Date(startOfDay);
  
  while (currentTime < endOfDay) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    const endTimeString = new Date(currentTime.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
    
    const isBooked = bookedSlots.some(slot => 
      timeString >= slot.start && timeString < slot.end
    );
    
    if (!isBooked) {
      availableSlots.push({
        start: timeString,
        end: endTimeString
      });
    }
    
    currentTime.setHours(currentTime.getHours() + 1);
  }
  
  return availableSlots;
};

// Static method to get counsellor schedule
bookingSchema.statics.getCounsellorSchedule = function(counsellorId, startDate, endDate) {
  return this.find({
    counsellor: counsellorId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('student', 'firstName lastName studentId').sort({ appointmentDate: 1, startTime: 1 });
};

module.exports = mongoose.model('Booking', bookingSchema);
