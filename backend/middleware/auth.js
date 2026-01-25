import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const [users] = await db.query(
            'SELECT user_id, username, email, role, is_active FROM APP_USER WHERE user_id = ?',
            [decoded.user_id]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        res.status(500).json({ success: false, message: 'Authentication failed' });
    }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Audit log middleware
export const auditLog = (tableName, action) => {
    return async (req, res, next) => {
        // Store original methods
        const originalJson = res.json;
        const originalStatus = res.status;

        let statusCode = 200;

        // Override status to capture status code
        res.status = function (code) {
            statusCode = code;
            return originalStatus.call(this, code);
        };

        // Override json to log after successful operations
        res.json = async function (data) {
            if (req.user && statusCode >= 200 && statusCode < 300) {
                try {
                    const recordId = data.data?.player_id || data.data?.club_id || data.data?.match_id || 0;

                    await db.query(
                        `INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            req.user.user_id,
                            tableName,
                            recordId,
                            action,
                            JSON.stringify(req.body),
                            req.ip
                        ]
                    );
                } catch (error) {
                    console.error('Audit log error:', error);
                }
            }
            return originalJson.call(this, data);
        };

        next();
    };
};
