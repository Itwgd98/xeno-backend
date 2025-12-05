import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

const SECRET_KEY = process.env.JWT_SECRET || 'xeno-secret-key-change-in-production';

/**
 * Generate JWT token for a tenant
 */
export function generateToken(tenantId, email) {
  try {
    const token = jwt.sign(
      { tenantId, email },
      SECRET_KEY,
      { expiresIn: '7d' }
    );
    return token;
  } catch (err) {
    logger.error('Token generation failed', { error: err.message });
    throw err;
  }
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (err) {
    logger.debug('Token verification failed', { error: err.message });
    return null;
  }
}

export default { generateToken, verifyToken };
