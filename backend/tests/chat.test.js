const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const { connectDB, disconnectDB } = require('../config/database');

describe('AI Chatbot Routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await ChatSession.deleteMany({});

    // Create test user
    const userData = {
      studentId: 'STU001',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    token = registerResponse.body.data.token;
    userId = registerResponse.body.data.user._id;
  });

  describe('POST /api/chat/session', () => {
    it('should start a new chat session successfully', async () => {
      const sessionData = {
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data.messages).toHaveLength(1); // Welcome message
    });

    it('should return existing active session if one exists', async () => {
      const sessionData = {
        language: 'en'
      };

      // Create first session
      await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData);

      // Try to create another session
      const response = await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Active session found');
    });

    it('should not start session without authentication', async () => {
      const sessionData = {
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/session')
        .send(sessionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/chat/message', () => {
    let sessionId;

    beforeEach(async () => {
      // Create a chat session
      const sessionData = {
        language: 'en'
      };

      const sessionResponse = await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData);

      sessionId = sessionResponse.body.data.sessionId;
    });

    it('should send message successfully', async () => {
      const messageData = {
        sessionId,
        content: 'I am feeling anxious about my exams',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('escalationLevel');
      expect(response.body.data).toHaveProperty('isCrisis');
      expect(response.body.data).toHaveProperty('needsEscalation');
    });

    it('should not send message without session ID', async () => {
      const messageData = {
        content: 'I am feeling anxious about my exams',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session ID and message content are required');
    });

    it('should not send message without content', async () => {
      const messageData = {
        sessionId,
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not send message to non-existent session', async () => {
      const messageData = {
        sessionId: 'non-existent-session-id',
        content: 'I am feeling anxious about my exams',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Chat session not found');
    });
  });

  describe('GET /api/chat/session/:sessionId', () => {
    let sessionId;

    beforeEach(async () => {
      // Create a chat session
      const sessionData = {
        language: 'en'
      };

      const sessionResponse = await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData);

      sessionId = sessionResponse.body.data.sessionId;
    });

    it('should get chat session successfully', async () => {
      const response = await request(app)
        .get(`/api/chat/session/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('isActive');
      expect(response.body.data).toHaveProperty('context');
    });

    it('should not get non-existent session', async () => {
      const response = await request(app)
        .get('/api/chat/session/non-existent-session-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Chat session not found');
    });
  });

  describe('GET /api/chat/sessions', () => {
    beforeEach(async () => {
      // Create multiple chat sessions
      const sessionData = {
        language: 'en'
      };

      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/chat/session')
          .set('Authorization', `Bearer ${token}`)
          .send(sessionData);
      }
    });

    it('should get user chat sessions', async () => {
      const response = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.sessions.length).toBeGreaterThan(0);
    });

    it('should get chat sessions with pagination', async () => {
      const response = await request(app)
        .get('/api/chat/sessions?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(response.body.data.pagination.current).toBe(1);
    });
  });

  describe('POST /api/chat/session/:sessionId/close', () => {
    let sessionId;

    beforeEach(async () => {
      // Create a chat session
      const sessionData = {
        language: 'en'
      };

      const sessionResponse = await request(app)
        .post('/api/chat/session')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData);

      sessionId = sessionResponse.body.data.sessionId;
    });

    it('should close chat session successfully', async () => {
      const response = await request(app)
        .post(`/api/chat/session/${sessionId}/close`)
        .set('Authorization', `Bearer ${token}`)
        .send({ summary: 'Session completed successfully' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Chat session closed successfully');
    });

    it('should not close non-existent session', async () => {
      const response = await request(app)
        .post('/api/chat/session/non-existent-session-id/close')
        .set('Authorization', `Bearer ${token}`)
        .send({ summary: 'Test summary' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Chat session not found');
    });
  });

  describe('GET /api/chat/coping-strategies', () => {
    it('should get coping strategies for specific mood', async () => {
      const response = await request(app)
        .get('/api/chat/coping-strategies?mood=stressed&language=en')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('mood');
      expect(response.body.data).toHaveProperty('strategies');
      expect(response.body.data.mood).toBe('stressed');
      expect(Array.isArray(response.body.data.strategies)).toBe(true);
    });

    it('should not get coping strategies without mood parameter', async () => {
      const response = await request(app)
        .get('/api/chat/coping-strategies?language=en')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Mood parameter is required');
    });
  });

  describe('GET /api/chat/crisis-resources', () => {
    it('should get crisis resources in English', async () => {
      const response = await request(app)
        .get('/api/chat/crisis-resources?language=en')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('language');
      expect(response.body.data).toHaveProperty('resources');
      expect(response.body.data.resources).toHaveProperty('emergency');
      expect(response.body.data.resources).toHaveProperty('helplines');
    });

    it('should get crisis resources in Hindi', async () => {
      const response = await request(app)
        .get('/api/chat/crisis-resources?language=hi')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('hi');
      expect(response.body.data.resources).toHaveProperty('emergency');
      expect(response.body.data.resources).toHaveProperty('helplines');
    });
  });
});

