const express = require('express');
const router = express.Router();
const {
  startChatSession,
  sendMessage,
  getChatSession,
  getChatSessions,
  closeChatSession,
  getCopingStrategies,
  getCrisisResources
} = require('../controllers/chatController');
const { validateChatMessage, validatePagination, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(require('../middleware/auth').auth);

// Chat session management
router.post('/session', startChatSession);
router.get('/sessions', validatePagination, getChatSessions);
router.get('/session/:sessionId', validateObjectId('sessionId'), getChatSession);
router.post('/session/:sessionId/close', validateObjectId('sessionId'), closeChatSession);

// Chat messaging
router.post('/message', validateChatMessage, sendMessage);

// Support resources
router.get('/coping-strategies', getCopingStrategies);
router.get('/crisis-resources', getCrisisResources);

module.exports = router;
