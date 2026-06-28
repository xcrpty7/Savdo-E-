const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const ApiError = require('./utils/ApiError');
const logger = require('./utils/logger');

// ── App Setup ──────────────────────────────────────────────────────────────

const app = express();

// ── Security Middlewares ───────────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// Production da frontend backend bilan bir serverda — CORS faqat dev uchun
if (process.env.NODE_ENV !== 'production') {
  // Dev: localhost va 127.0.0.1 (har qanday port) ga avtomatik ruxsat — vite proxy ba'zan 127.0.0.1 sifatida keladi
  const isLocalOrigin = (origin) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: Origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
} else {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(apiLimiter);          // Global rate limiting

// ── Body Parsing ───────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());     // Must run AFTER body parsing to sanitize req.body

// ── Logging ────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// ── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/v1', routes);

// ── Static Frontend (production only) ─────────────────────────────────────
// ✅ Agar dist papkalar mavjud bo'lsa, frontend-ni server qiladi
//    Render'da faqat backend kodi bor — static papkalar yo'q, shuning uchun
//    bu blok skipp qilinadi va API-only rejim ishlaydi.

if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const webDist   = path.join(__dirname, '../../web/dist');
  const adminDist = path.join(__dirname, '../../web/admin/dist');

  if (fs.existsSync(adminDist)) {
    app.use('/admin', express.static(adminDist));
    app.get('/admin', (req, res) => res.redirect('/admin/'));
    app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
  }

  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }
}

// ── 404 Handler (API only) ─────────────────────────────────────────────────

app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ── Global Error Handler ───────────────────────────────────────────────────

app.use(errorMiddleware);

// ── Start Server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API base: http://localhost:${PORT}/api/v1`);
    logger.info(`Health:   http://localhost:${PORT}/health`);
  });
};

startServer();

// ── Graceful Shutdown ─────────────────────────────────────────────────────

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
