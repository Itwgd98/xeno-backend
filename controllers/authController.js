import { Tenant } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

/**
 * Login endpoint - returns JWT token
 * For demo purposes, accepts any tenant ID or shop domain
 */
export const login = async (req, res) => {
  try {
    const { email, tenantId, shopDomain } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    let tenant;

    // Find tenant by ID or shop domain
    if (tenantId && /^\d+$/.test(tenantId)) {
      tenant = await Tenant.findByPk(tenantId);
    } else if (shopDomain) {
      tenant = await Tenant.findOne({ where: { shopDomain } });
    }

    if (!tenant) {
      logger.warn('Login attempted with invalid tenant', { tenantId, shopDomain, email });
      return res.status(401).json({ error: 'Tenant not found' });
    }

    // Generate token
    const token = generateToken(tenant.id, email);

    logger.info('User logged in', { tenantId: tenant.id, email });

    res.json({
      token,
      tenant: {
        id: tenant.id,
        shopName: tenant.shopName,
        shopDomain: tenant.shopDomain
      }
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Verify token endpoint
 */
export const verify = async (req, res) => {
  try {
    const { tenantId, email } = req.user;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(401).json({ error: 'Tenant not found' });
    }

    res.json({
      valid: true,
      user: { tenantId, email },
      tenant: {
        id: tenant.id,
        shopName: tenant.shopName,
        shopDomain: tenant.shopDomain
      }
    });
  } catch (err) {
    logger.error('Token verify error', { error: err.message });
    res.status(500).json({ error: 'Verification failed' });
  }
};

export default { login, verify };
