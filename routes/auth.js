import express from 'express';
import { login, verify } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public login endpoint
router.post('/login', login);

// Protected verify endpoint
router.get('/verify', authMiddleware, verify);

export default router;
