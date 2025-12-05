# Xeno — Multi-tenant Shopify Data Ingestion & Insights Service

A production-ready Node.js/Express backend for ingesting Shopify data (customers, orders, products) into PostgreSQL and providing multi-tenant analytics dashboards.

## Features

✅ **Multi-tenant architecture** — Complete data isolation using `tenantId`  
✅ **Shopify OAuth 2.0** — Secure app installation  
✅ **Webhook ingestion** — Real-time order/customer/product sync  
✅ **Scheduled sync** — Hourly bulk data fetch with pagination  
✅ **JWT authentication** — Secure dashboard access  
✅ **RESTful API** — Customers, Orders, Products, Metrics  
✅ **Analytics dashboard** — Revenue charts, top customers, trends  
✅ **Rate limiting** — Shopify API rate limit handling  
✅ **Error handling** — Structured logging with JSON output  
✅ **Production-ready** — Deployment on Render/Heroku

---

## Architecture

```
xeno-backend/
├── models/              # Sequelize ORM models
│   ├── Tenant.js       # Store credentials & domain
│   ├── Store.js        # Store settings & sync status
│   ├── Customer.js     # Customer data (multi-tenant)
│   ├── Order.js        # Order data (multi-tenant)
│   └── Product.js      # Product data (multi-tenant)
├── routes/             # Express route handlers
│   ├── auth.js         # JWT login/verify
│   ├── shopifyAuth.js  # OAuth flow
│   ├── orders.js       # Orders API
│   ├── sync.js         # Manual sync endpoint
│   ├── metrics.js      # Analytics
│   └── webhook.js      # Shopify webhooks
├── controllers/        # Business logic
│   ├── authController.js
│   ├── orderController.js
│   └── syncController.js
├── services/           # External API calls
│   └── shopifyService.js (pagination, rate limiting)
├── middleware/         # Express middleware
│   ├── auth.js         # JWT verification
│   └── tenant.js       # Tenant header validation
├── jobs/               # Background jobs
│   └── syncScheduler.js (node-cron scheduled sync)
├── utils/              # Utilities
│   ├── db.js          # Sequelize connection
│   ├── jwt.js         # JWT token generation
│   └── logger.js      # Structured logging
├── frontend/           # Static dashboard
│   ├── index.html     # Login page
│   ├── dashboard.html # Analytics dashboard
│   └── js/app.js      # Frontend logic
└── server.js           # Express app entry point
```

---

## Installation

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- Shopify app (with API credentials)

### Setup

1. **Clone & Install**
```bash
git clone <repo>
cd xeno-backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Create Database**
```bash
createdb xeno_db
# PostgreSQL will auto-create tables on first run via sequelize.sync()
```

4. **Seed Demo Data** (optional)
```bash
node seed.js
```

5. **Start Server**
```bash
npm start  # runs: nodemon server.js
```

Server will run on `http://localhost:5000`

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/xeno_db` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `SHOPIFY_API_KEY` | Shopify app key | From Partner Dashboard |
| `SHOPIFY_API_SECRET` | Shopify app secret | From Partner Dashboard |
| `SHOPIFY_WEBHOOK_SECRET` | Webhook signing key | From App settings |
| `BACKEND_URL` | Public backend URL | `https://app.example.com` |
| `SYNC_INTERVAL` | Cron schedule for sync jobs | `0 * * * *` (hourly) |
| `DEBUG` | Enable debug logging | `false` |

---

## API Endpoints

### Authentication
```
POST /auth/login
Body: { email, tenantId }
Returns: { token, tenant }
```

```
GET /auth/verify
Headers: Authorization: Bearer <token>
Returns: { valid, user, tenant }
```

### Sync
```
POST /sync/now
Headers: Authorization: Bearer <token>
Returns: { message, products, customers, orders }
```

```
GET /sync/status
Headers: Authorization: Bearer <token>
Returns: { lastSyncAt, webhooksConfigured }
```

### Orders
```
GET /orders?limit=20&offset=0&from=2024-01-01&to=2024-12-31&status=paid
Headers: Authorization: Bearer <token>
Returns: { total, limit, offset, orders[] }
```

### Metrics
```
GET /metrics?from=2024-01-01&to=2024-12-31
Headers: x-tenant-id: 1 OR x-shop-domain: shop.myshopify.com
Returns: { totalCustomers, totalOrders, totalRevenue, ordersByDate[], topCustomers[] }
```

---

## Multi-tenant Safety

All data is isolated per tenant:

- **Database**: `tenantId` on every customer/order/product record
- **Indexes**: Composite unique indexes like `(tenantId, shopId)` prevent cross-tenant leaks
- **Queries**: Every SELECT/UPDATE/DELETE filters by `tenantId`
- **Authentication**: JWT contains `tenantId`, verified on protected routes
- **Headers**: Tenant middleware validates `x-tenant-id` or `x-shop-domain`

---

## Shopify Integration

### OAuth Flow
1. User visits `https://app.example.com`
2. Clicks "Install App"
3. Redirected to `GET /auth/shopify/install?shop=myshop.myshopify.com`
4. User approves permissions on Shopify
5. Redirected back to `GET /auth/shopify/callback?code=...&shop=...`
6. Access token exchanged and saved to database

### Webhook Ingestion
1. Shopify sends webhook to `POST /webhook`
2. HMAC signature verified
3. Data upserted into database
4. Supports: `orders/create`, `orders/updated`, `products/create`, `products/update`, `customers/create`, `customers/update`

### Data Sync
- **Manual**: `POST /sync/now` fetches all data with pagination
- **Automatic**: Runs on schedule (default: hourly via node-cron)
- **Rate limiting**: Respects Shopify API rate limits (40 req/min)
- **Pagination**: Handles cursor-based pagination for large datasets

---

## Deployment

### Render.com
1. Push to GitHub
2. Create new Web Service from GitHub repo
3. Set environment variables in Render dashboard
4. Connect PostgreSQL database
5. Deploy

### Heroku
```bash
heroku login
heroku create xeno-backend
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=...
git push heroku main
```

### Vercel (Frontend Only)
Frontend static files are served from the backend. For separate deployment, use the `/frontend` folder.

---

## Development

### Run Tests
```bash
npm test
```

### Debug Mode
```bash
DEBUG=true npm start
```

### Database Migrations
```bash
npx sequelize-cli migration:generate --name add-column
npx sequelize-cli db:migrate
```

---

## Troubleshooting

### "Tenant not found"
- Ensure tenant exists in database (run `node seed.js` for demo)
- Check header: `x-tenant-id` or `x-shop-domain`

### "Invalid JWT"
- Token may have expired (7-day TTL)
- Re-login at `/`

### Webhooks not triggering
- Verify webhook secret in `.env` matches Shopify app settings
- Check HMAC signature verification isn't failing

### Sync errors
- Verify access token has `read_customers`, `read_orders`, `read_products` scopes
- Check rate limiting in logs

---

## Security

- ✅ HMAC signature verification on webhooks
- ✅ JWT token validation on protected routes
- ✅ Multi-tenant data isolation
- ✅ Environment variable for secrets
- ✅ CORS enabled for frontend
- ✅ Structured logging (no sensitive data leaked)

---

## License

ISC

---

## Support

For issues, check logs:
```bash
tail -f server.log
```

All output is JSON-formatted for easy parsing.
