require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const pool = require('./config/database');
const { connectRedis } = require('./config/redis');

// Routes
const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const parentRoutes = require('./routes/parent.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const marksRoutes = require('./routes/marks.routes');
const reportCardRoutes = require('./routes/reportcard.routes');
const courseRoutes = require('./routes/course.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const quizRoutes = require('./routes/quiz.routes');
const messageRoutes = require('./routes/message.routes');
const announcementRoutes = require('./routes/announcement.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const libraryRoutes = require('./routes/library.routes');
const eventRoutes = require('./routes/event.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const supportRoutes = require('./routes/support.routes');
const notificationRoutes = require('./routes/notification.routes');
const auditRoutes = require('./routes/audit.routes');
const aiRoutes = require('./routes/ai.routes');
const termRoutes = require('./routes/term.routes');
const academicYearRoutes = require('./routes/academic-years.routes');
const conductRoutes = require('./routes/conduct.routes');
const timetableRoutes = require('./routes/timetable.routes');
const searchRoutes = require('./routes/search.routes');
const contactRoutes = require('./routes/contact.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'https://life-ch2q.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'EduVerse Rwanda' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/conduct', conductRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);

app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;

// Only listen when running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const start = async () => {
    await connectRedis();
    let dbConnected = false;
    for (let i = 1; i <= 3; i++) {
      try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connected');
        dbConnected = true;
        break;
      } catch (err) {
        console.log(`⚠️  DB connection attempt ${i}/3 failed: ${err.message}`);
        if (i < 3) await new Promise(r => setTimeout(r, 5000));
      }
    }
    if (!dbConnected) {
      console.error('❌ Could not connect to database after 3 attempts.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 EduVerse Rwanda backend running on port ${PORT}`);
    });
  };
  start().catch(console.error);
}
