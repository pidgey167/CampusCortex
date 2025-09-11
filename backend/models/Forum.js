const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['stress', 'sleep', 'homesickness', 'exam_stress', 'relationships', 'academic', 'general', 'crisis_support']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    nickname: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 100
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  memberCount: {
    type: Number,
    default: 0
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
forumSchema.index({ category: 1, isActive: 1 });
forumSchema.index({ createdBy: 1 });
forumSchema.index({ 'members.user': 1 });
forumSchema.index({ lastActivity: -1 });
forumSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
forumSchema.virtual('activeMemberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Method to add member
forumSchema.methods.addMember = function(userId, nickname = null) {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.joinedAt = new Date();
  } else {
    this.members.push({
      user: userId,
      nickname: nickname || `User${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: new Date()
    });
  }
  
  this.memberCount = this.members.filter(m => m.isActive).length;
  this.lastActivity = new Date();
  return this.save();
};

// Method to remove member
forumSchema.methods.removeMember = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (member) {
    member.isActive = false;
    this.memberCount = this.members.filter(m => m.isActive).length;
    this.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if user is member
forumSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
};

// Method to check if user is moderator
forumSchema.methods.isModerator = function(userId) {
  return this.moderators.some(moderator => 
    moderator.toString() === userId.toString()
  );
};

module.exports = mongoose.model('Forum', forumSchema);
