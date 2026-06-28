import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { error } from './utils/apiResponse.js';

// Import modular routes
import authRoutes from './routes/auth.routes.js';
import ingestRoutes from './routes/ingest.routes.js';
import recommendRoutes from './routes/recommend.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Middlewares setup
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Netflix + YouTube Recommendation Engine API.'
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/admin', adminRoutes);

// Fallback 404 Route Handler
app.use((req, res, next) => {
  const err = new Error(`API endpoint not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

// Standardized Global Error Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.error(`💥 Error [${statusCode}]: ${err.stack || err.message}`);
  return error(
    res,
    err.message || 'An unexpected server error occurred.',
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode
  );
});

export default app;