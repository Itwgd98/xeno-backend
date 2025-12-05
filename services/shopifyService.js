import axios from "axios";
import { logger } from "../utils/logger.js";

// Rate limiting state
const rateLimitState = {};

/**
 * Check and handle Shopify API rate limits
 */
function checkRateLimit(shop) {
  if (!rateLimitState[shop]) {
    rateLimitState[shop] = { remaining: 40, resetTime: Date.now() + 60000 };
  }
  
  const state = rateLimitState[shop];
  if (Date.now() > state.resetTime) {
    state.remaining = 40;
    state.resetTime = Date.now() + 60000;
  }
  
  return state.remaining;
}

/**
 * Wait if approaching rate limit
 */
async function handleRateLimit(shop) {
  const remaining = checkRateLimit(shop);
  if (remaining < 5) {
    const waitTime = rateLimitState[shop].resetTime - Date.now();
    logger.warn('Rate limit approaching, waiting', { shop, remaining, waitTime });
    await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
  }
}

/**
 * Fetch data with pagination
 */
async function fetchWithPagination(url, accessToken, shop, maxResults = null) {
  const results = [];
  let cursor = null;
  let count = 0;

  try {
    while (true) {
      await handleRateLimit(shop);

      const params = new URLSearchParams();
      if (cursor) params.append('limit', '250');
      if (cursor) params.append('cursor', cursor);
      else params.append('limit', '250');

      const response = await axios.get(`${url}${url.includes('?') ? '&' : '?'}${params}`, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      const data = response.data;
      const key = Object.keys(data).find(k => Array.isArray(data[k]));
      
      if (!key || !data[key]) break;
      
      results.push(...data[key]);
      count += data[key].length;

      // Check pagination header
      const linkHeader = response.headers['link'];
      if (!linkHeader || !linkHeader.includes('rel="next"')) break;
      
      // Extract next cursor from Link header
      const nextMatch = linkHeader.match(/<.*?cursor=([^&>]+)/);
      cursor = nextMatch ? nextMatch[1] : null;
      if (!cursor) break;

      if (maxResults && count >= maxResults) {
        results.splice(maxResults);
        break;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.debug('Pagination complete', { shop, url, totalResults: results.length });
    return results;
  } catch (err) {
    logger.error('Pagination fetch failed', { shop, url, error: err.message });
    throw err;
  }
}

// Fetch products with pagination
export const fetchProducts = async (shop, accessToken, maxResults = null) => {
  try {
    const url = `https://${shop}/admin/api/2024-10/products.json`;
    const products = await fetchWithPagination(url, accessToken, shop, maxResults);
    logger.info('Products fetched', { shop, count: products.length });
    return products;
  } catch (err) {
    logger.error('Failed to fetch products', { shop, error: err.message });
    throw err;
  }
};

// Fetch customers with pagination
export const fetchCustomers = async (shop, accessToken, maxResults = null) => {
  try {
    const url = `https://${shop}/admin/api/2024-10/customers.json`;
    const customers = await fetchWithPagination(url, accessToken, shop, maxResults);
    logger.info('Customers fetched', { shop, count: customers.length });
    return customers;
  } catch (err) {
    logger.error('Failed to fetch customers', { shop, error: err.message });
    throw err;
  }
};

// Fetch orders with pagination
export const fetchOrders = async (shop, accessToken, maxResults = null) => {
  try {
    const url = `https://${shop}/admin/api/2024-10/orders.json`;
    const orders = await fetchWithPagination(url, accessToken, shop, maxResults);
    logger.info('Orders fetched', { shop, count: orders.length });
    return orders;
  } catch (err) {
    logger.error('Failed to fetch orders', { shop, error: err.message });
    throw err;
  }
};

/**
 * Sync all data from Shopify to database
 */
export const syncTenantData = async (tenant, Customer, Order, Product, Store) => {
  try {
    logger.info('Starting data sync', { tenantId: tenant.id, shop: tenant.shopDomain });

    const store = await Store.findOne({ where: { tenantId: tenant.id, shop: tenant.shopDomain } });
    if (!store || !store.accessToken) {
      throw new Error('Store or access token not found');
    }

    // Fetch all data
    const [products, customers, orders] = await Promise.all([
      fetchProducts(tenant.shopDomain, store.accessToken),
      fetchCustomers(tenant.shopDomain, store.accessToken),
      fetchOrders(tenant.shopDomain, store.accessToken),
    ]);

    // Upsert products
    for (const product of products) {
      await Product.upsert({
        tenantId: tenant.id,
        shopId: product.id.toString(),
        title: product.title,
        price: parseFloat(product.variants?.[0]?.price || 0),
        sku: product.variants?.[0]?.sku,
        status: product.status
      });
    }

    // Upsert customers
    for (const customer of customers) {
      await Customer.upsert({
        tenantId: tenant.id,
        shopId: customer.id.toString(),
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        totalSpent: parseFloat(customer.total_spent || 0)
      });
    }

    // Upsert orders
    for (const order of orders) {
      await Order.upsert({
        tenantId: tenant.id,
        shopId: order.id.toString(),
        total: parseFloat(order.total_price || 0),
        currency: order.currency,
        status: order.financial_status,
        createdAt: new Date(order.created_at)
      });
    }

    // Update sync timestamp
    await store.update({ lastSyncAt: new Date() });

    logger.info('Data sync completed', {
      tenantId: tenant.id,
      products: products.length,
      customers: customers.length,
      orders: orders.length
    });

    return { products: products.length, customers: customers.length, orders: orders.length };
  } catch (err) {
    logger.error('Sync failed', { tenantId: tenant.id, error: err.message });
    throw err;
  }
};

export default {
  fetchProducts,
  fetchCustomers,
  fetchOrders,
  syncTenantData,
  checkRateLimit
};

