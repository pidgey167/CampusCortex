const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      language = 'en',
      search,
      difficulty,
      targetAudience
    } = req.query;

    let query = { status: 'published' };

    if (type) query.type = type;
    if (category) query.category = category;
    if (language) query.language = language;
    if (difficulty) query.difficulty = difficulty;
    if (targetAudience) query.targetAudience = targetAudience;

    let resources;
    let total;

    if (search) {
      const searchResults = await Resource.searchResources(search, query);
      resources = searchResults.slice((page - 1) * limit, page * limit);
      total = searchResults.length;
    } else {
      const skip = (page - 1) * limit;
      resources = await Resource.find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      total = await Resource.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resources'
    });
  }
};

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Private
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment view count
    await resource.incrementViews();

    res.json({
      success: true,
      data: {
        resource
      }
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resource'
    });
  }
};

// @desc    Like resource
// @route   POST /api/resources/:id/like
// @access  Private
const likeResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await resource.like();

    res.json({
      success: true,
      message: 'Resource liked successfully'
    });
  } catch (error) {
    console.error('Like resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like resource'
    });
  }
};

// @desc    Rate resource
// @route   POST /api/resources/:id/rate
// @access  Private
const rateResource = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await resource.addRating(rating);

    res.json({
      success: true,
      message: 'Resource rated successfully'
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate resource'
    });
  }
};

// @desc    Get popular resources
// @route   GET /api/resources/popular
// @access  Private
const getPopularResources = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const resources = await Resource.getPopularResources(parseInt(limit));

    res.json({
      success: true,
      data: {
        resources
      }
    });
  } catch (error) {
    console.error('Get popular resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular resources'
    });
  }
};

// @desc    Get resources by category
// @route   GET /api/resources/category/:category
// @access  Private
const getResourcesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { language = 'en' } = req.query;

    const resources = await Resource.getResourcesByCategory(category, language);

    res.json({
      success: true,
      data: {
        resources
      }
    });
  } catch (error) {
    console.error('Get resources by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resources by category'
    });
  }
};

// @desc    Create resource (Admin only)
// @route   POST /api/resources
// @access  Private/Admin
const createResource = async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      createdBy: req.user._id
    };

    const resource = await Resource.create(resourceData);

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: {
        resource
      }
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource'
    });
  }
};

// @desc    Update resource (Admin only)
// @route   PUT /api/resources/:id
// @access  Private/Admin
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    Object.assign(resource, req.body);
    resource.lastModified = new Date();
    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: {
        resource
      }
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource'
    });
  }
};

// @desc    Delete resource (Admin only)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await resource.deleteOne();

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource'
    });
  }
};

// Public routes
router.get('/', getResources);
router.get('/popular', getPopularResources);
router.get('/category/:category', getResourcesByCategory);
router.get('/:id', getResource);
router.post('/:id/like', likeResource);
router.post('/:id/rate', rateResource);

// Admin routes
router.post('/', require('../middleware/auth').isAdmin, createResource);
router.put('/:id', require('../middleware/auth').isAdmin, updateResource);
router.delete('/:id', require('../middleware/auth').isAdmin, deleteResource);

module.exports = router;
