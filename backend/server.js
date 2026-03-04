import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { testConnection } from './config/database.js';

// Import routes
import playersRouter from './routes/players.js';
import clubsRouter from './routes/clubs.js';
import matchesRouter from './routes/matches.js';
import eventsRouter from './routes/events.js';
import analyticsRouter from './routes/analytics.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import stadiumsRouter from './routes/stadiums.js';
import managersRouter from './routes/managers.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CLUBSYNC API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/players', playersRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stadiums', stadiumsRouter);
app.use('/api/managers', managersRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
