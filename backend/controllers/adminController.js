const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const Booking = require('../models/Booking');
const Forum = require('../models/Forum');
const ForumPost = require('../models/ForumPost');
const Resource = require('../models/Resource');
const ChatSession = require('../models/ChatSession');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = moment().startOf('month').toDate();
    const startOfWeek = moment().startOf('week').toDate();
    const startOfDay = moment().startOf('day').toDate();

    // Get basic counts
    const [
      totalUsers,
      totalStudents,
      totalCounsellors,
      totalPeerVolunteers,
      totalMoodLogs,
      totalBookings,
      totalForums,
      totalResources,
      totalChatSessions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'counsellor' }),
      User.countDocuments({ role: 'peer_volunteer' }),
      MoodLog.countDocuments(),
      Booking.countDocuments(),
      Forum.countDocuments(),
      Resource.countDocuments(),
      ChatSession.countDocuments()
    ]);

    // Get monthly stats
    const [
      monthlyMoodLogs,
      monthlyBookings,
      monthlyNewUsers,
      monthlyChatSessions
    ] = await Promise.all([
      MoodLog.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      ChatSession.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    // Get weekly stats
    const [
      weeklyMoodLogs,
      weeklyBookings,
      weeklyNewUsers
    ] = await Promise.all([
      MoodLog.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Booking.countDocuments({ createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } })
    ]);

    // Get daily stats
    const [
      dailyMoodLogs,
      dailyBookings,
      dailyNewUsers
    ] = await Promise.all([
      MoodLog.countDocuments({ createdAt: { $gte: startOfDay } }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfDay } })
    ]);

    // Get mood distribution
    const moodDistribution = await MoodLog.aggregate([
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get booking status distribution
    const bookingStatusDistribution = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalStudents,
          totalCounsellors,
          totalPeerVolunteers,
          totalMoodLogs,
          totalBookings,
          totalForums,
          totalResources,
          totalChatSessions,
          activeUsers
        },
        monthly: {
          moodLogs: monthlyMoodLogs,
          bookings: monthlyBookings,
          newUsers: monthlyNewUsers,
          chatSessions: monthlyChatSessions
        },
        weekly: {
          moodLogs: weeklyMoodLogs,
          bookings: weeklyBookings,
          newUsers: weeklyNewUsers
        },
        daily: {
          moodLogs: dailyMoodLogs,
          bookings: dailyBookings,
          newUsers: dailyNewUsers
        },
        distributions: {
          mood: moodDistribution,
          bookingStatus: bookingStatusDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get mood analytics
const getMoodAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupStage;
    switch (groupBy) {
      case 'hour':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: { $hour: '$date' }
          }
        };
        break;
      case 'day':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          }
        };
        break;
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          }
        };
        break;
      case 'month':
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          }
        };
        break;
      default:
        groupStage = {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          }
        };
    }

    const moodAnalytics = await MoodLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          totalLogs: { $sum: 1 },
          averageIntensity: { $avg: '$intensity' },
          averageStressLevel: { $avg: '$stressLevel' },
          averageEnergyLevel: { $avg: '$energyLevel' },
          moodDistribution: {
            $push: {
              mood: '$mood',
              intensity: '$intensity'
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Get mood trends
    const moodTrends = await MoodLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 },
          averageIntensity: { $avg: '$intensity' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get stress level trends
    const stressTrends = await MoodLog.aggregate([
      { $match: { ...matchStage, stressLevel: { $exists: true } } },
      {
        $group: {
          _id: '$stressLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        analytics: moodAnalytics,
        moodTrends,
        stressTrends
      }
    });
  } catch (error) {
    console.error('Get mood analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // User registration trends
    const registrationTrends = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Department distribution
    const departmentDistribution = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Year distribution
    const yearDistribution = await User.aggregate([
      { $match: { year: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        registrationTrends,
        roleDistribution,
        departmentDistribution,
        yearDistribution,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get booking analytics
const getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Booking trends
    const bookingTrends = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' },
            day: { $dayOfMonth: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Booking status distribution
    const statusDistribution = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Booking type distribution
    const typeDistribution = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Counsellor workload
    const counsellorWorkload = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$counsellor',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'counsellor'
        }
      },
      { $unwind: '$counsellor' },
      {
        $project: {
          counsellorName: { $concat: ['$counsellor.firstName', ' ', '$counsellor.lastName'] },
          totalBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        bookingTrends,
        statusDistribution,
        typeDistribution,
        counsellorWorkload
      }
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get forum analytics
const getForumAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Forum activity trends
    const forumActivity = await Forum.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          forumsCreated: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Forum category distribution
    const categoryDistribution = await Forum.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Post activity
    const postActivity = await ForumPost.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          postsCreated: { $sum: 1 },
          totalComments: { $sum: { $size: '$comments' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        forumActivity,
        categoryDistribution,
        postActivity
      }
    });
  } catch (error) {
    console.error('Get forum analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get resource analytics
const getResourceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Resource creation trends
    const resourceTrends = await Resource.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          resourcesCreated: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Resource type distribution
    const typeDistribution = await Resource.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalViews: { $sum: '$metadata.views' },
          totalLikes: { $sum: '$metadata.likes' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Resource category distribution
    const categoryDistribution = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$metadata.views' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Language distribution
    const languageDistribution = await Resource.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        resourceTrends,
        typeDistribution,
        categoryDistribution,
        languageDistribution
      }
    });
  } catch (error) {
    console.error('Get resource analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export mood data
const exportMoodData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const moodData = await MoodLog.find(matchStage)
      .populate('userId', 'studentId department year')
      .select('-__v')
      .sort({ date: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = moodData.map(log => ({
        date: log.date.toISOString().split('T')[0],
        studentId: log.userId?.studentId || 'N/A',
        department: log.userId?.department || 'N/A',
        year: log.userId?.year || 'N/A',
        mood: log.mood,
        intensity: log.intensity,
        stressLevel: log.stressLevel || 'N/A',
        energyLevel: log.energyLevel || 'N/A',
        triggers: log.triggers?.join(', ') || 'N/A',
        activities: log.activities?.join(', ') || 'N/A'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=mood-data.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: moodData,
        count: moodData.length
      });
    }
  } catch (error) {
    console.error('Export mood data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export user data
const exportUserData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const userData = await User.find(matchStage)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = userData.map(user => ({
        studentId: user.studentId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department || 'N/A',
        year: user.year || 'N/A',
        phone: user.phone || 'N/A',
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString().split('T')[0],
        lastLogin: user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'N/A'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-data.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: userData,
        count: userData.length
      });
    }
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get crisis alerts
const getCrisisAlerts = async (req, res) => {
  try {
    // Get mood logs with high stress levels
    const highStressLogs = await MoodLog.find({
      stressLevel: { $gte: 8 },
      date: { $gte: moment().subtract(7, 'days').toDate() }
    }).populate('userId', 'firstName lastName studentId email phone');

    // Get chat sessions with crisis flags
    const crisisChatSessions = await ChatSession.find({
      flags: { $in: ['crisis', 'escalation_needed'] },
      lastActivity: { $gte: moment().subtract(7, 'days').toDate() }
    }).populate('userId', 'firstName lastName studentId email phone');

    // Get bookings marked as urgent
    const urgentBookings = await Booking.find({
      priority: 'urgent',
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate([
      { path: 'student', select: 'firstName lastName studentId email phone' },
      { path: 'counsellor', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      data: {
        highStressLogs,
        crisisChatSessions,
        urgentBookings
      }
    });
  } catch (error) {
    console.error('Get crisis alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get system health
const getSystemHealth = async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check recent activity
    const [
      recentMoodLogs,
      recentBookings,
      recentChatSessions,
      recentForumPosts
    ] = await Promise.all([
      MoodLog.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Booking.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      ChatSession.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      ForumPost.countDocuments({ createdAt: { $gte: oneHourAgo } })
    ]);

    // Check for flagged content
    const flaggedContent = await ForumPost.countDocuments({
      'moderation.isFlagged': true
    });

    // Check system performance metrics
    const systemHealth = {
      status: 'healthy',
      lastChecked: now,
      metrics: {
        recentActivity: {
          moodLogs: recentMoodLogs,
          bookings: recentBookings,
          chatSessions: recentChatSessions,
          forumPosts: recentForumPosts
        },
        flaggedContent,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    // Determine overall health status
    if (flaggedContent > 10) {
      systemHealth.status = 'warning';
    }

    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Placeholder functions for other admin operations
const manageUsers = async (req, res) => {
  // Implementation for user management
  res.json({ success: true, message: 'User management endpoint' });
};

const manageForums = async (req, res) => {
  // Implementation for forum management
  res.json({ success: true, message: 'Forum management endpoint' });
};

const manageResources = async (req, res) => {
  // Implementation for resource management
  res.json({ success: true, message: 'Resource management endpoint' });
};

const getModerationQueue = async (req, res) => {
  // Implementation for moderation queue
  res.json({ success: true, message: 'Moderation queue endpoint' });
};

const moderateContent = async (req, res) => {
  // Implementation for content moderation
  res.json({ success: true, message: 'Content moderation endpoint' });
};

const sendSystemAnnouncement = async (req, res) => {
  // Implementation for system announcements
  res.json({ success: true, message: 'System announcement endpoint' });
};

const getAuditLogs = async (req, res) => {
  // Implementation for audit logs
  res.json({ success: true, message: 'Audit logs endpoint' });
};

module.exports = {
  getDashboardStats,
  getMoodAnalytics,
  getUserAnalytics,
  getBookingAnalytics,
  getForumAnalytics,
  getResourceAnalytics,
  exportMoodData,
  exportUserData,
  getCrisisAlerts,
  getSystemHealth,
  manageUsers,
  manageForums,
  manageResources,
  getModerationQueue,
  moderateContent,
  sendSystemAnnouncement,
  getAuditLogs
};
