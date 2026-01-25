import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register',
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').optional().isString(),
        body('role').optional().isIn(['ADMIN', 'EDITOR', 'VIEWER'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { username, email, password, full_name, role = 'VIEWER' } = req.body;

            // Check if user already exists
            const [existing] = await db.query(
                'SELECT user_id FROM APP_USER WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert user
            const [result] = await db.query(
                `INSERT INTO APP_USER (username, email, password_hash, full_name, role)
         VALUES (?, ?, ?, ?, ?)`,
                [username, email, passwordHash, full_name || null, role]
            );

            // Generate JWT token
            const token = jwt.sign(
                { user_id: result.insertId, username, role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user_id: result.insertId,
                    username,
                    email,
                    role,
                    token
                }
            });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ success: false, message: 'Registration failed' });
        }
    }
);

// POST /api/auth/login - User login
router.post('/login',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { username, password } = req.body;

            // Find user
            const [users] = await db.query(
                'SELECT * FROM APP_USER WHERE username = ? AND is_active = TRUE',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const user = users[0];

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login
            await db.query(
                'UPDATE APP_USER SET last_login = NOW() WHERE user_id = ?',
                [user.user_id]
            );

            // Generate JWT token
            const token = jwt.sign(
                { user_id: user.user_id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    token
                }
            });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({ success: false, message: 'Login failed' });
        }
    }
);

// GET /api/auth/me - Get current user profile
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await db.query(
            'SELECT user_id, username, email, full_name, role, last_login, created_at FROM APP_USER WHERE user_id = ?',
            [decoded.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
});

export default router;
