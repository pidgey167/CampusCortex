const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    language: {
      type: String,
      default: 'en'
    },
    metadata: {
      mood: String,
      intent: String,
      confidence: Number
    }
  }],
  context: {
    currentMood: String,
    lastMoodLog: Date,
    sessionStart: Date,
    language: {
      type: String,
      default: 'en'
    },
    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  flags: [{
    type: String,
    enum: ['crisis', 'escalation_needed', 'follow_up_required', 'positive_progress']
  }],
  summary: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes
chatSessionSchema.index({ userId: 1, isActive: 1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ lastActivity: -1 });
chatSessionSchema.index({ 'context.escalationLevel': 1 });

// Virtual for message count
chatSessionSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message
chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    timestamp: new Date()
  });
  this.totalMessages += 1;
  this.lastActivity = new Date();
  return this.save();
};

// Method to get recent messages
chatSessionSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .reverse();
};

// Static method to find active sessions
chatSessionSchema.statics.findActiveSessions = function(userId) {
  return this.find({ userId, isActive: true }).sort({ lastActivity: -1 });
};

// Static method to close session
chatSessionSchema.statics.closeSession = function(sessionId) {
  return this.findOneAndUpdate(
    { sessionId },
    { isActive: false, lastActivity: new Date() },
    { new: true }
  );
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
