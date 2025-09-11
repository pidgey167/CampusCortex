const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const { generateResponse, generatePersonalizedResponse, generateCopingStrategies } = require('../utils/aiChatbot');
const { v4: uuidv4 } = require('uuid');

// @desc    Start new chat session
// @route   POST /api/chat/session
// @access  Private
const startChatSession = async (req, res) => {
  try {
    const { language = 'en' } = req.body;

    // Check for existing active session
    const existingSession = await ChatSession.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (existingSession) {
      return res.json({
        success: true,
        message: 'Active session found',
        data: {
          sessionId: existingSession.sessionId,
          messages: existingSession.getRecentMessages(10)
        }
      });
    }

    // Get user's recent mood data for context
    const recentMoodLog = await MoodLog.findOne({
      userId: req.user._id
    }).sort({ date: -1 });

    // Create new session
    const sessionId = uuidv4();
    const chatSession = new ChatSession({
      userId: req.user._id,
      sessionId,
      context: {
        language,
        currentMood: recentMoodLog?.mood,
        lastMoodLog: recentMoodLog?.date,
        sessionStart: new Date()
      }
    });

    // Add welcome message
    const welcomeMessages = {
      'en': "Hello! I'm AI Sathi, your mental health support companion. I'm here to listen and help you with stress, anxiety, or any emotional challenges you might be facing. How are you feeling today?",
      'hi': "नमस्ते! मैं AI Sathi हूँ, आपका मानसिक स्वास्थ्य सहायक। मैं यहाँ आपकी बात सुनने और तनाव, चिंता या किसी भी भावनात्मक चुनौतियों में आपकी मदद करने के लिए हूँ। आज आप कैसा महसूस कर रहे हैं?",
      'ta': "வணக்கம்! நான் AI Sathi, உங்கள் மன ஆரோக்கிய ஆதரவு துணை. நான் இங்கே உங்களைக் கேட்டு, மன அழுத்தம், கவலை அல்லது எந்தவொரு உணர்ச்சிபூர்வமான சவால்களிலும் உங்களுக்கு உதவ இருக்கிறேன். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
      'te': "నమస్కారం! నేను AI Sathi, మీ మానసిక ఆరోగ్య మద్దతు సహచరుడు. నేను ఇక్కడ మీ మాట వినడానికి మరియు ఒత్తిడి, ఆందోళన లేదా మీరు ఎదుర్కొనే ఏదైనా భావోద్వేగ సవాళ్లలో మీకు సహాయం చేయడానికి ఉన్నాను. ఈరోజు మీరు ఎలా అనుభవిస్తున్నారు?"
    };

    const welcomeMessage = welcomeMessages[language] || welcomeMessages['en'];

    chatSession.messages.push({
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
      language
    });

    await chatSession.save();

    res.status(201).json({
      success: true,
      message: 'Chat session started',
      data: {
        sessionId: chatSession.sessionId,
        messages: chatSession.messages
      }
    });
  } catch (error) {
    console.error('Start chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Send message to AI Sathi
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { sessionId, content, language = 'en' } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and message content are required'
      });
    }

    // Find chat session
    const chatSession = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or inactive'
      });
    }

    // Add user message to session
    await chatSession.addMessage('user', content, { language });

    // Get user context for personalized response
    const userContext = {
      currentMood: chatSession.context.currentMood,
      stressLevel: chatSession.context.stressLevel,
      department: req.user.department,
      year: req.user.year,
      interactionCount: chatSession.totalMessages,
      language: language
    };

    // Generate AI response
    const aiResponse = await generatePersonalizedResponse(content, userContext, language);

    // Add AI response to session
    await chatSession.addMessage('assistant', aiResponse.response, {
      language,
      mood: userContext.currentMood,
      intent: 'support',
      confidence: aiResponse.confidence
    });

    // Update context if escalation is needed
    if (aiResponse.escalationLevel > chatSession.context.escalationLevel) {
      chatSession.context.escalationLevel = aiResponse.escalationLevel;
      chatSession.flags.push('escalation_needed');
    }

    if (aiResponse.isCrisis) {
      chatSession.flags.push('crisis');
    }

    await chatSession.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        response: aiResponse.response,
        escalationLevel: aiResponse.escalationLevel,
        isCrisis: aiResponse.isCrisis,
        needsEscalation: aiResponse.needsEscalation,
        sessionId: chatSession.sessionId
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get chat session messages
// @route   GET /api/chat/session/:sessionId
// @access  Private
const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const chatSession = await ChatSession.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    const messages = chatSession.getRecentMessages(parseInt(limit));

    res.json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        messages,
        isActive: chatSession.isActive,
        context: chatSession.context,
        flags: chatSession.flags
      }
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's chat sessions
// @route   GET /api/chat/sessions
// @access  Private
const getChatSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find({
      userId: req.user._id
    })
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('sessionId isActive lastActivity totalMessages context flags summary');

    const total = await ChatSession.countDocuments({
      userId: req.user._id
    });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Close chat session
// @route   POST /api/chat/session/:sessionId/close
// @access  Private
const closeChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { summary } = req.body;

    const chatSession = await ChatSession.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    chatSession.isActive = false;
    chatSession.lastActivity = new Date();
    if (summary) {
      chatSession.summary = summary;
    }

    await chatSession.save();

    res.json({
      success: true,
      message: 'Chat session closed successfully'
    });
  } catch (error) {
    console.error('Close chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get coping strategies
// @route   GET /api/chat/coping-strategies
// @access  Private
const getCopingStrategies = async (req, res) => {
  try {
    const { mood, language = 'en' } = req.query;

    if (!mood) {
      return res.status(400).json({
        success: false,
        message: 'Mood parameter is required'
      });
    }

    const strategies = await generateCopingStrategies(mood, language);

    res.json({
      success: true,
      data: {
        mood,
        language,
        strategies
      }
    });
  } catch (error) {
    console.error('Get coping strategies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coping strategies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get crisis resources
// @route   GET /api/chat/crisis-resources
// @access  Private
const getCrisisResources = async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    const crisisResources = {
      'en': {
        emergency: {
          number: '108',
          description: 'Emergency Services'
        },
        helplines: [
          {
            name: 'KIRAN Mental Health Helpline',
            number: '1800-599-0019',
            description: '24/7 Mental Health Support'
          },
          {
            name: 'Vandrevala Foundation',
            number: '1860-2662-345',
            description: 'Crisis Support'
          },
          {
            name: 'iCall',
            number: '9152987821',
            description: 'Psychosocial Support'
          }
        ],
        message: 'If you are having thoughts of self-harm or suicide, please reach out for help immediately. You are not alone, and there are people who care about you and want to help.'
      },
      'hi': {
        emergency: {
          number: '108',
          description: 'आपातकालीन सेवाएं'
        },
        helplines: [
          {
            name: 'KIRAN मानसिक स्वास्थ्य हेल्पलाइन',
            number: '1800-599-0019',
            description: '24/7 मानसिक स्वास्थ्य सहायता'
          },
          {
            name: 'वंद्रेवाला फाउंडेशन',
            number: '1860-2662-345',
            description: 'संकट सहायता'
          }
        ],
        message: 'यदि आपके मन में आत्महत्या या आत्म-नुकसान के विचार आ रहे हैं, तो कृपया तुरंत मदद मांगें। आप अकेले नहीं हैं, और ऐसे लोग हैं जो आपकी परवाह करते हैं और आपकी मदद करना चाहते हैं।'
      }
    };

    const resources = crisisResources[language] || crisisResources['en'];

    res.json({
      success: true,
      data: {
        language,
        resources
      }
    });
  } catch (error) {
    console.error('Get crisis resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crisis resources',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  startChatSession,
  sendMessage,
  getChatSession,
  getChatSessions,
  closeChatSession,
  getCopingStrategies,
  getCrisisResources
};
