const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const { connectDB, disconnectDB } = require('../config/database');

describe('Mood Logging Routes', () => {
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
    await MoodLog.deleteMany({});

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

  describe('POST /api/mood', () => {
    it('should create a new mood log successfully', async () => {
      const moodData = {
        mood: 'happy',
        intensity: 8,
        notes: 'Feeling great today!',
        triggers: ['academic'],
        activities: ['study'],
        sleep: {
          hours: 8,
          quality: 'good'
        },
        stressLevel: 3,
        energyLevel: 9
      };

      const response = await request(app)
        .post('/api/mood')
        .set('Authorization', `Bearer ${token}`)
        .send(moodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodLog.mood).toBe(moodData.mood);
      expect(response.body.data.moodLog.intensity).toBe(moodData.intensity);
      expect(response.body.data.moodLog.userId).toBe(userId);
    });

    it('should not create mood log with invalid data', async () => {
      const invalidMoodData = {
        mood: 'invalid_mood',
        intensity: 15, // Invalid intensity
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/mood')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidMoodData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not create mood log without authentication', async () => {
      const moodData = {
        mood: 'happy',
        intensity: 8
      };

      const response = await request(app)
        .post('/api/mood')
        .send(moodData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not create duplicate mood log for same day', async () => {
      const moodData = {
        mood: 'happy',
        intensity: 8
      };

      // Create first mood log
      await request(app)
        .post('/api/mood')
        .set('Authorization', `Bearer ${token}`)
        .send(moodData);

      // Try to create second mood log for same day
      const response = await request(app)
        .post('/api/mood')
        .set('Authorization', `Bearer ${token}`)
        .send(moodData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/mood', () => {
    beforeEach(async () => {
      // Create test mood logs
      const moodLogs = [
        {
          userId,
          mood: 'happy',
          intensity: 8,
          date: new Date('2024-01-01')
        },
        {
          userId,
          mood: 'sad',
          intensity: 4,
          date: new Date('2024-01-02')
        },
        {
          userId,
          mood: 'anxious',
          intensity: 6,
          date: new Date('2024-01-03')
        }
      ];

      await MoodLog.insertMany(moodLogs);
    });

    it('should get user mood logs', async () => {
      const response = await request(app)
        .get('/api/mood')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodLogs).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should get mood logs with pagination', async () => {
      const response = await request(app)
        .get('/api/mood?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodLogs).toHaveLength(2);
      expect(response.body.data.pagination.current).toBe(1);
    });

    it('should get mood logs with date filter', async () => {
      const response = await request(app)
        .get('/api/mood?startDate=2024-01-01&endDate=2024-01-02')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodLogs).toHaveLength(2);
    });
  });

  describe('GET /api/mood/streak', () => {
    beforeEach(async () => {
      // Create consecutive mood logs
      const moodLogs = [
        {
          userId,
          mood: 'happy',
          intensity: 8,
          date: new Date('2024-01-01'),
          streak: { current: 1, longest: 1, lastLogDate: new Date('2024-01-01') }
        },
        {
          userId,
          mood: 'sad',
          intensity: 4,
          date: new Date('2024-01-02'),
          streak: { current: 2, longest: 2, lastLogDate: new Date('2024-01-02') }
        },
        {
          userId,
          mood: 'anxious',
          intensity: 6,
          date: new Date('2024-01-03'),
          streak: { current: 3, longest: 3, lastLogDate: new Date('2024-01-03') }
        }
      ];

      await MoodLog.insertMany(moodLogs);
    });

    it('should get user streak information', async () => {
      const response = await request(app)
        .get('/api/mood/streak')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streak).toHaveProperty('current');
      expect(response.body.data.streak).toHaveProperty('longest');
      expect(response.body.data.streak).toHaveProperty('lastLogDate');
      expect(response.body.data.streak.current).toBe(3);
      expect(response.body.data.streak.longest).toBe(3);
    });
  });

  describe('PUT /api/mood/:id', () => {
    let moodLogId;

    beforeEach(async () => {
      const moodData = {
        userId,
        mood: 'happy',
        intensity: 8,
        notes: 'Original note'
      };

      const moodLog = await MoodLog.create(moodData);
      moodLogId = moodLog._id;
    });

    it('should update mood log successfully', async () => {
      const updateData = {
        mood: 'excited',
        intensity: 9,
        notes: 'Updated note'
      };

      const response = await request(app)
        .put(`/api/mood/${moodLogId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moodLog.mood).toBe(updateData.mood);
      expect(response.body.data.moodLog.intensity).toBe(updateData.intensity);
      expect(response.body.data.moodLog.notes).toBe(updateData.notes);
    });

    it('should not update mood log of another user', async () => {
      // Create another user
      const anotherUserData = {
        studentId: 'STU002',
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      const anotherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(anotherUserData);

      const anotherToken = anotherUserResponse.body.data.token;

      const updateData = {
        mood: 'excited',
        intensity: 9
      };

      const response = await request(app)
        .put(`/api/mood/${moodLogId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/mood/:id', () => {
    let moodLogId;

    beforeEach(async () => {
      const moodData = {
        userId,
        mood: 'happy',
        intensity: 8
      };

      const moodLog = await MoodLog.create(moodData);
      moodLogId = moodLog._id;
    });

    it('should delete mood log successfully', async () => {
      const response = await request(app)
        .delete(`/api/mood/${moodLogId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify mood log is deleted
      const deletedLog = await MoodLog.findById(moodLogId);
      expect(deletedLog).toBeNull();
    });

    it('should not delete mood log of another user', async () => {
      // Create another user
      const anotherUserData = {
        studentId: 'STU002',
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      const anotherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(anotherUserData);

      const anotherToken = anotherUserResponse.body.data.token;

      const response = await request(app)
        .delete(`/api/mood/${moodLogId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

