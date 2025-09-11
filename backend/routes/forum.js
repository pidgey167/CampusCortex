const express = require('express');
const router = express.Router();
const Forum = require('../models/Forum');
const ForumPost = require('../models/ForumPost');

// @desc    Get all forums
// @route   GET /api/forum
// @access  Private
const getForums = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const forums = await Forum.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Forum.countDocuments(query);

    res.json({
      success: true,
      data: {
        forums,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get forums'
    });
  }
};

// @desc    Create forum
// @route   POST /api/forum
// @access  Private
const createForum = async (req, res) => {
  try {
    const { name, description, category, tags, settings } = req.body;

    const forum = await Forum.create({
      name,
      description,
      category,
      tags,
      createdBy: req.user._id,
      settings: settings || {}
    });

    // Add creator as first member
    await forum.addMember(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Forum created successfully',
      data: {
        forum
      }
    });
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forum'
    });
  }
};

// @desc    Join forum
// @route   POST /api/forum/:id/join
// @access  Private
const joinForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    if (forum.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this forum'
      });
    }

    await forum.addMember(req.user._id);

    res.json({
      success: true,
      message: 'Joined forum successfully'
    });
  } catch (error) {
    console.error('Join forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join forum'
    });
  }
};

// @desc    Leave forum
// @route   POST /api/forum/:id/leave
// @access  Private
const leaveForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    await forum.removeMember(req.user._id);

    res.json({
      success: true,
      message: 'Left forum successfully'
    });
  } catch (error) {
    console.error('Leave forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave forum'
    });
  }
};

// @desc    Get forum posts
// @route   GET /api/forum/:id/posts
// @access  Private
const getForumPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    if (!forum.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Join the forum to view posts.'
      });
    }

    const posts = await ForumPost.getPostsByForum(req.params.id, page, limit);

    res.json({
      success: true,
      data: {
        posts
      }
    });
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get forum posts'
    });
  }
};

// @desc    Create forum post
// @route   POST /api/forum/:id/posts
// @access  Private
const createForumPost = async (req, res) => {
  try {
    const { title, content, isAnonymous = true, tags } = req.body;

    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    if (!forum.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Join the forum to create posts.'
      });
    }

    const post = await ForumPost.create({
      forumId: req.params.id,
      author: req.user._id,
      title,
      content,
      isAnonymous,
      authorNickname: isAnonymous ? `User${Math.random().toString(36).substr(2, 9)}` : `${req.user.firstName} ${req.user.lastName}`,
      tags
    });

    // Update forum post count
    forum.postCount += 1;
    forum.lastActivity = new Date();
    await forum.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

module.exports = router;
