# CampusCortex - Digital Psychological Intervention System

A comprehensive web-based platform designed to support students' mental well-being through AI-powered assistance, peer support, and professional counselling.

## 🌟 Features

### Student Interface
- **Landing Page** with secure login/signup (student ID authentication)
- **Mood Passport** - Daily mood tracking with emoji/emotion options
- **AI Sathi Chatbot** - 24/7 psychological first-aid with multi-language support
- **Peer Pods Forum** - Anonymous themed support groups with real-time messaging
- **Resource Hub** - Video tutorials, guided audios, and mental health articles
- **Counsellor Booking** - Confidential appointment scheduling with calendar integration
- **Streak System** - Gamified mood tracking with achievements
- **Push Notifications** - Timely reminders and crisis alerts
- **QR Code Access** - Easy campus-wide access to features

### Admin Dashboard
- **Analytics Dashboard** - Comprehensive mood data visualization
- **User Management** - Student, peer volunteer, counsellor, and admin roles
- **Content Moderation** - Forum and chat monitoring tools
- **Crisis Management** - Automated alerts and escalation systems
- **Reporting** - Department-wise analytics and exportable reports

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form management
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Redis** - Caching and sessions
- **Socket.IO** - Real-time messaging
- **JWT** - Authentication
- **OpenAI API** - AI chatbot integration
- **Mongoose** - MongoDB ODM

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancing
- **Jest** - Testing framework
- **Supertest** - API testing

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Redis 7.0+
- Docker (optional)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/campuscortex.git
   cd campuscortex
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Start services**
   ```bash
   # Start MongoDB and Redis (if not using Docker)
   # MongoDB: mongod
   # Redis: redis-server
   
   # Start backend (from backend directory)
   cd backend && npm run dev
   
   # Start frontend (from frontend directory)
   cd frontend && npm run dev
   ```

### Docker Deployment

1. **Clone and setup**
   ```bash
   git clone https://github.com/your-username/campuscortex.git
   cd campuscortex
   cp env.example .env
   ```

2. **Configure environment**
   Edit `.env` file with your production settings:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   MONGODB_URI=mongodb://admin:password@mongodb:27017/campuscortex?authSource=admin
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
```bash
cd backend
npm run test:coverage
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Mood Tracking
- `POST /api/mood` - Create mood log
- `GET /api/mood` - Get user mood logs
- `GET /api/mood/streak` - Get streak information
- `PUT /api/mood/:id` - Update mood log
- `DELETE /api/mood/:id` - Delete mood log

### AI Chatbot
- `POST /api/chat/session` - Start chat session
- `POST /api/chat/message` - Send message
- `GET /api/chat/sessions` - Get user sessions
- `GET /api/chat/coping-strategies` - Get coping strategies

### Peer Pods
- `GET /api/forum` - Get forums
- `POST /api/forum` - Create forum
- `POST /api/forum/:id/join` - Join forum
- `GET /api/forum/:id/posts` - Get forum posts

### Resources
- `GET /api/resources` - Get resources
- `GET /api/resources/popular` - Get popular resources
- `POST /api/resources/:id/like` - Like resource

### Booking
- `POST /api/booking` - Create booking
- `GET /api/booking/student` - Get student bookings
- `GET /api/booking/available-slots/:counsellorId` - Get available slots

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Student, peer volunteer, counsellor, admin roles
- **Rate Limiting** - API request throttling
- **Input Validation** - Comprehensive data validation
- **CORS Protection** - Cross-origin request security
- **Helmet.js** - Security headers
- **Password Hashing** - bcrypt with salt rounds
- **Session Management** - Redis-based sessions

## 🌐 Multi-language Support

The platform supports 12 Indian languages:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Gujarati (gu)
- Marathi (mr)
- Kannada (kn)
- Malayalam (ml)
- Odia (or)
- Punjabi (pa)
- Urdu (ur)

## 📱 Mobile Responsiveness

- Fully responsive design
- Progressive Web App (PWA) support
- Touch-friendly interface
- Offline capability for mood logging

## 🚨 Crisis Support

### Emergency Resources
- **Emergency Services**: 108
- **KIRAN Mental Health Helpline**: 1800-599-0019
- **Vandrevala Foundation**: 1860-2662-345
- **iCall**: 9152987821

### AI Safety Features
- Crisis detection algorithms
- Automatic escalation to human counsellors
- Safety guardrails and content filtering
- Multi-language crisis support

## 📈 Analytics & Monitoring

- Real-time mood trend analysis
- Department-wise wellness reports
- Crisis intervention tracking
- Platform usage analytics
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI chatbot capabilities
- MongoDB for database support
- The open-source community for various libraries
- Mental health professionals for guidance and feedback

## 📞 Support

For support, email support@campuscortex.com or join our community forum.

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI therapy features
- [ ] Integration with wearable devices
- [ ] Machine learning mood prediction
- [ ] Virtual reality therapy sessions
- [ ] Blockchain-based privacy features

---

**Built with ❤️ for student mental health and well-being**