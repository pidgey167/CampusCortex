const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const connectRedis = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moodRoutes = require('./routes/mood');
const chatRoutes = require('./routes/chat');
const forumRoutes = require('./routes/forum');
const resourceRoutes = require('./routes/resources');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const harborRoutes = require('./routes/harbor');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to databases
connectDB();
connectRedis();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/mood', auth, moodRoutes);
app.use('/api/chat', auth, chatRoutes);
app.use('/api/forum', auth, forumRoutes);
app.use('/api/resources', auth, resourceRoutes);
app.use('/api/booking', auth, bookingRoutes);
app.use('/api/admin', auth, adminRoutes);
app.use('/api/harbor', auth, harborRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join forum room
  socket.on('join-forum', (forumId) => {
    socket.join(`forum-${forumId}`);
    console.log(`User ${socket.id} joined forum ${forumId}`);
  });

  // Leave forum room
  socket.on('leave-forum', (forumId) => {
    socket.leave(`forum-${forumId}`);
    console.log(`User ${socket.id} left forum ${forumId}`);
  });

  // Handle forum messages
  socket.on('forum-message', (data) => {
    socket.to(`forum-${data.forumId}`).emit('new-message', data);
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    socket.to(`chat-${data.chatId}`).emit('new-chat-message', data);
  });

  // Harbor real-time chat
  socket.on('harbor-message', async (data) => {
    try {
      const { generateResponse, detectRisk } = require('./utils/ai')
      const result = await generateResponse(data.content, data.mood)
      const isRisk = result.risk || detectRisk(data.content)

      // Emit AI response (encrypted content for privacy)
      socket.emit('ai-response', {
        content: result.text,
        encryptedContent: data.encryptedContent // echoing not ideal; in real impl encrypt server-side
      })

      if (isRisk) {
        socket.to('authority-room').emit('harbor-alert', { anonymized: true })
        socket.emit('harbor-alert', { anonymized: true })
      }
    } catch (e) {
      console.error('harbor-message error', e)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;
