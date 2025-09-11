const MoodLog = require('../models/MoodLog');
const User = require('../models/User');

// @desc    Create mood log
// @route   POST /api/mood
// @access  Private
const createMoodLog = async (req, res) => {
  try {
    const {
      mood,
      intensity,
      notes,
      triggers,
      activities,
      sleep,
      stressLevel,
      energyLevel,
      tags
    } = req.body;

    // Check if user already has a mood log for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingLog = await MoodLog.findOne({
      userId: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: 'Mood log already exists for today. Use PUT to update.'
      });
    }

    const moodLog = await MoodLog.create({
      userId: req.user._id,
      mood,
      intensity,
      notes,
      triggers,
      activities,
      sleep,
      stressLevel,
      energyLevel,
      tags
    });

    // Update streak information
    await moodLog.updateStreak();

    res.status(201).json({
      success: true,
      message: 'Mood log created successfully',
      data: {
        moodLog
      }
    });
  } catch (error) {
    console.error('Create mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mood log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get mood logs
// @route   GET /api/mood
// @access  Private
const getMoodLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate, mood } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };

    // Add date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Add mood filter
    if (mood) {
      query.mood = mood;
    }

    const moodLogs = await MoodLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MoodLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        moodLogs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get mood logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get mood log by ID
// @route   GET /api/mood/:id
// @access  Private
const getMoodLog = async (req, res) => {
  try {
    const moodLog = await MoodLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodLog) {
      return res.status(404).json({
        success: false,
        message: 'Mood log not found'
      });
    }

    res.json({
      success: true,
      data: {
        moodLog
      }
    });
  } catch (error) {
    console.error('Get mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update mood log
// @route   PUT /api/mood/:id
// @access  Private
const updateMoodLog = async (req, res) => {
  try {
    const {
      mood,
      intensity,
      notes,
      triggers,
      activities,
      sleep,
      stressLevel,
      energyLevel,
      tags
    } = req.body;

    const moodLog = await MoodLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodLog) {
      return res.status(404).json({
        success: false,
        message: 'Mood log not found'
      });
    }

    // Update fields
    if (mood) moodLog.mood = mood;
    if (intensity) moodLog.intensity = intensity;
    if (notes !== undefined) moodLog.notes = notes;
    if (triggers) moodLog.triggers = triggers;
    if (activities) moodLog.activities = activities;
    if (sleep) moodLog.sleep = sleep;
    if (stressLevel) moodLog.stressLevel = stressLevel;
    if (energyLevel) moodLog.energyLevel = energyLevel;
    if (tags) moodLog.tags = tags;

    await moodLog.save();

    res.json({
      success: true,
      message: 'Mood log updated successfully',
      data: {
        moodLog
      }
    });
  } catch (error) {
    console.error('Update mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mood log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete mood log
// @route   DELETE /api/mood/:id
// @access  Private
const deleteMoodLog = async (req, res) => {
  try {
    const moodLog = await MoodLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodLog) {
      return res.status(404).json({
        success: false,
        message: 'Mood log not found'
      });
    }

    res.json({
      success: true,
      message: 'Mood log deleted successfully'
    });
  } catch (error) {
    console.error('Delete mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mood log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get mood statistics
// @route   GET /api/mood/stats
// @access  Private
const getMoodStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await MoodLog.getMoodStats(req.user._id, startDate, endDate);

    // Get additional statistics
    const totalLogs = await MoodLog.countDocuments({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const averageIntensity = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgIntensity: { $avg: '$intensity' },
          avgStress: { $avg: '$stressLevel' },
          avgEnergy: { $avg: '$energyLevel' }
        }
      }
    ]);

    const moodTrends = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          avgMood: { $avg: '$intensity' },
          avgStress: { $avg: '$stressLevel' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        totalLogs,
        moodDistribution: stats,
        averages: averageIntensity[0] || { avgIntensity: 0, avgStress: 0, avgEnergy: 0 },
        trends: moodTrends
      }
    });
  } catch (error) {
    console.error('Get mood stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get today's mood log
// @route   GET /api/mood/today
// @access  Private
const getTodayMoodLog = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const moodLog = await MoodLog.findOne({
      userId: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.json({
      success: true,
      data: {
        moodLog,
        hasLoggedToday: !!moodLog
      }
    });
  } catch (error) {
    console.error('Get today mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s mood log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get mood streak
// @route   GET /api/mood/streak
// @access  Private
const getMoodStreak = async (req, res) => {
  try {
    const moodLogs = await MoodLog.find({
      userId: req.user._id
    }).sort({ date: -1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (let i = 0; i < moodLogs.length; i++) {
      const logDate = new Date(moodLogs[i].date);
      logDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        // First log
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (logDate.getTime() === today.getTime()) {
          currentStreak = 1;
          tempStreak = 1;
        } else if (logDate.getTime() === yesterday.getTime()) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const prevDate = new Date(moodLogs[i - 1].date);
        prevDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(prevDate);
        expectedDate.setDate(expectedDate.getDate() - 1);

        if (logDate.getTime() === expectedDate.getTime()) {
          if (i === 1) currentStreak++;
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalLogs: moodLogs.length
      }
    });
  } catch (error) {
    console.error('Get mood streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood streak',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createMoodLog,
  getMoodLogs,
  getMoodLog,
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getTodayMoodLog,
  getMoodStreak
};
