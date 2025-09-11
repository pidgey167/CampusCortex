const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'anxious', 'stressed', 'tired', 'angry', 'excited', 'calm', 'confused', 'lonely']
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  triggers: [{
    type: String,
    enum: ['academic', 'social', 'family', 'health', 'financial', 'relationship', 'work', 'other']
  }],
  activities: [{
    type: String,
    enum: ['exercise', 'study', 'social', 'rest', 'hobby', 'work', 'other']
  }],
  sleep: {
    hours: {
      type: Number,
      min: 0,
      max: 24
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastLogDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
moodLogSchema.index({ userId: 1, date: -1 });
moodLogSchema.index({ date: -1 });
moodLogSchema.index({ mood: 1 });
moodLogSchema.index({ userId: 1, mood: 1 });

// Virtual for formatted date
moodLogSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtual fields are serialized
moodLogSchema.set('toJSON', { virtuals: true });

// Method to calculate and update streak
moodLogSchema.methods.updateStreak = async function() {
  const userId = this.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get the most recent mood log before this one
  const lastLog = await this.constructor.findOne({
    userId: userId,
    _id: { $ne: this._id }
  }).sort({ date: -1 });
  
  if (lastLog) {
    const lastLogDate = new Date(lastLog.date);
    lastLogDate.setHours(0, 0, 0, 0);
    
    const currentLogDate = new Date(this.date);
    currentLogDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((currentLogDate - lastLogDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 1) {
      // Consecutive day - increment streak
      this.streak.current = (lastLog.streak?.current || 0) + 1;
    } else if (daysDifference === 0) {
      // Same day - keep current streak
      this.streak.current = lastLog.streak?.current || 0;
    } else {
      // Gap in days - reset streak
      this.streak.current = 1;
    }
  } else {
    // First mood log
    this.streak.current = 1;
  }
  
  // Update longest streak if current is higher
  this.streak.longest = Math.max(this.streak.current, lastLog?.streak?.longest || 0);
  this.streak.lastLogDate = this.date;
  
  return this.save();
};

// Static method to get user's streak information
moodLogSchema.statics.getUserStreak = async function(userId) {
  const lastLog = await this.findOne({ userId }).sort({ date: -1 });
  
  if (!lastLog) {
    return {
      current: 0,
      longest: 0,
      lastLogDate: null
    };
  }
  
  return {
    current: lastLog.streak?.current || 0,
    longest: lastLog.streak?.longest || 0,
    lastLogDate: lastLog.streak?.lastLogDate || lastLog.date
  };
};

// Static method to get mood statistics
moodLogSchema.statics.getMoodStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$mood',
        count: { $sum: 1 },
        avgIntensity: { $avg: '$intensity' },
        avgStress: { $avg: '$stressLevel' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('MoodLog', moodLogSchema);
