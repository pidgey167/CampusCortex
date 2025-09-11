const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  authorNickname: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    },
    url: String,
    filename: String,
    size: Number
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'support', 'empathy', 'helpful', 'dislike']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    authorNickname: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['like', 'support', 'empathy', 'helpful']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    isModerated: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted', 'flagged'],
    default: 'active'
  },
  moderation: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderationReason: String,
    moderatedAt: Date
  },
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes
forumPostSchema.index({ forumId: 1, createdAt: -1 });
forumPostSchema.index({ author: 1 });
forumPostSchema.index({ status: 1 });
forumPostSchema.index({ 'moderation.isFlagged': 1 });
forumPostSchema.index({ isPinned: -1, createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text' });

// Virtual for comment count
forumPostSchema.virtual('commentCount').get(function() {
  return this.comments.filter(comment => !comment.isModerated).length;
});

// Virtual for reaction counts
forumPostSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Method to add reaction
forumPostSchema.methods.addReaction = function(userId, type) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    type,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to add comment
forumPostSchema.methods.addComment = function(authorId, content, isAnonymous = true, nickname = null) {
  this.comments.push({
    author: authorId,
    content,
    isAnonymous,
    authorNickname: nickname || `User${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to flag post
forumPostSchema.methods.flagPost = function(userId, reason) {
  this.moderation.isFlagged = true;
  this.moderation.flaggedBy.push({
    user: userId,
    reason,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to moderate post
forumPostSchema.methods.moderatePost = function(moderatorId, reason, action = 'hidden') {
  this.status = action;
  this.moderation.moderatedBy = moderatorId;
  this.moderation.moderationReason = reason;
  this.moderation.moderatedAt = new Date();
  
  return this.save();
};

// Static method to get posts by forum
forumPostSchema.statics.getPostsByForum = function(forumId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ forumId, status: 'active' })
    .populate('author', 'firstName lastName')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('ForumPost', forumPostSchema);
