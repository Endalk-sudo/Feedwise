import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import feedbackRoutes from './routes/feedback.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js'; // Import auth routes
import aiRoutes from './routes/ai.js'; // Import AI routes
import settingsRoutes from './routes/settings.js';
import paymentRoutes from './routes/payment.js';
import analyticsRoutes from './routes/analytics.js';
import { handleWebhook } from './controllers/paymentController.js';
import { startInsightGenerationJob } from './jobs/generateInsights.js';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';

// Load environment variables from .env file
// This is like reading configuration settings before starting
dotenv.config();

// Create the main Express application
// Think of this as building the main office building
const app = express();

// Trust proxy - required for express-rate-limit to work correctly behind reverse proxies (Render, etc.)
// This allows Express to read X-Forwarded-For header for accurate IP identification
app.set('trust proxy', 1);

// Set secure HTTP headers
app.use(helmet());

// Logging HTTP requests
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Enable CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }),
);

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

// Apply the rate limiting middleware to all requests
app.use('/api/', apiLimiter);

// Enable cookie parsing
app.use(cookieParser());

// IMPORTANT: Define webhook route BEFORE bodyParser.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Enable JSON parsing for incoming requests
// This tells the server how to read JSON data sent from the frontend
// It's like teaching the receptionist how to read different types of mail
app.use(express.json());

// Define all API routes
// These are like different departments in your building

// Authentication routes (login, register, logout)
// All routes starting with /api/auth go to authRoutes
app.use('/api/auth', authRoutes);

// Feedback routes (submit feedback, get feedback)
// All routes starting with /api/feedback go to feedbackRoutes
app.use('/api/feedback', feedbackRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/user', userRoutes);

app.use('/api/setting', settingsRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/', analyticsRoutes);

// Health check endpoint
// This is like a "ping" to check if the server is alive
// Visit http://localhost:5000/health to see if server is running
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
    });
});

startInsightGenerationJob();

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error(`${error.message}`, { stack: error.stack });

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    });
});

// Start the server
// This is like opening the building for business
const PORT = process.env.PORT;

const startServer = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await connectDB(); // First connect to database

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📊 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        logger.error(`❌ Failed to start server: ${error.message}`, { stack: error.stack });
        process.exit(1);
    }
};

// Start everything
startServer();
