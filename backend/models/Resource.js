const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'audio', 'article', 'document', 'link', 'exercise', 'meditation']
  },
  category: {
    type: String,
    required: true,
    enum: ['stress_management', 'anxiety_relief', 'sleep_hygiene', 'mindfulness', 'crisis_support', 'academic_stress', 'relationships', 'general_wellness']
  },
  language: {
    type: String,
    required: true,
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn', 'ml', 'or', 'pa', 'ur'],
    default: 'en'
  },
  content: {
    url: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    fileSize: {
      type: Number, // in bytes
      default: 0
    },
    format: {
      type: String,
      enum: ['mp4', 'mp3', 'pdf', 'doc', 'docx', 'txt', 'html', 'external']
    },
    thumbnail: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'first_year', 'final_year', 'postgraduate', 'counsellors'],
    default: 'all'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  author: {
    name: String,
    credentials: String,
    organization: String
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  accessibility: {
    hasSubtitles: {
      type: Boolean,
      default: false
    },
    hasTranscript: {
      type: Boolean,
      default: false
    },
    isAudioDescribed: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'flagged'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
resourceSchema.index({ type: 1, category: 1, status: 1 });
resourceSchema.index({ language: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ targetAudience: 1 });
resourceSchema.index({ isFeatured: -1, createdAt: -1 });
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ 'metadata.views': -1 });
resourceSchema.index({ 'metadata.rating.average': -1 });

// Virtual for formatted duration
resourceSchema.virtual('formattedDuration').get(function() {
  if (!this.content.duration) return 'N/A';
  
  const hours = Math.floor(this.content.duration / 60);
  const minutes = this.content.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for formatted file size
resourceSchema.virtual('formattedFileSize').get(function() {
  if (!this.content.fileSize) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.content.fileSize) / Math.log(1024));
  
  return Math.round(this.content.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment views
resourceSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Method to add rating
resourceSchema.methods.addRating = function(rating) {
  const currentTotal = this.metadata.rating.average * this.metadata.rating.count;
  this.metadata.rating.count += 1;
  this.metadata.rating.average = (currentTotal + rating) / this.metadata.rating.count;
  return this.save();
};

// Method to like resource
resourceSchema.methods.like = function() {
  this.metadata.likes += 1;
  return this.save();
};

// Method to download resource
resourceSchema.methods.download = function() {
  this.metadata.downloads += 1;
  return this.save();
};

// Static method to search resources
resourceSchema.statics.searchResources = function(query, filters = {}) {
  const searchQuery = {
    status: 'published',
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, isFeatured: -1, createdAt: -1 });
};

// Static method to get popular resources
resourceSchema.statics.getPopularResources = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort({ 'metadata.views': -1, 'metadata.likes': -1 })
    .limit(limit);
};

// Static method to get resources by category
resourceSchema.statics.getResourcesByCategory = function(category, language = 'en') {
  return this.find({ 
    category, 
    language, 
    status: 'published' 
  }).sort({ isFeatured: -1, createdAt: -1 });
};

module.exports = mongoose.model('Resource', resourceSchema);
