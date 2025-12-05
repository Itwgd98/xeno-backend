# Deployment Guide

## Quick Start - Render.com (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production-ready multi-tenant Shopify ingestion service"
git push origin main
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: xeno-backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Region**: Choose closest to users

### Step 3: Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: xeno-db
   - **Plan**: Standard
3. Copy connection string

### Step 4: Set Environment Variables

In Render dashboard → xeno-backend → Environment:

```
DATABASE_URL=<from-postgresql>
PORT=5000
BACKEND_URL=https://xeno-backend-XXXX.onrender.com
JWT_SECRET=your-super-secret-jwt-key-change-this
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
SYNC_INTERVAL=0 * * * *
DEBUG=false
```

### Step 5: Deploy & Seed

```bash
# Wait for deployment to complete, then seed demo data:
curl -X POST https://xeno-backend-XXXX.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","tenantId":"1"}'
```

---

## Heroku Deployment

### Step 1: Prepare
```bash
heroku login
```

### Step 2: Create App & Database
```bash
heroku create xeno-backend
heroku addons:create heroku-postgresql:standard-0
```

### Step 3: Set Env Variables
```bash
heroku config:set \
  JWT_SECRET="your-secret-key" \
  SHOPIFY_API_KEY="key" \
  SHOPIFY_API_SECRET="secret" \
  SHOPIFY_WEBHOOK_SECRET="webhook-secret" \
  BACKEND_URL="https://xeno-backend-XXXX.herokuapp.com"
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: View Logs
```bash
heroku logs --tail
```

---

## Manual VPS Deployment (Ubuntu 20.04+)

### Prerequisites
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
```

### Setup
```bash
cd /var/www/xeno-backend
git clone <repo> .
npm install

# Create database
sudo -u postgres createdb xeno_db

# Update .env
cp .env.example .env
nano .env  # edit with your values

# Seed data
node seed.js

# Start with PM2
npm install -g pm2
pm2 start server.js --name xeno
pm2 startup
pm2 save
```

### Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

---

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: xeno_db
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:your_password@db:5432/xeno_db
      JWT_SECRET: your-secret
      SHOPIFY_API_KEY: key
      SHOPIFY_API_SECRET: secret
    depends_on:
      - db

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## Health Checks

### Check Service Status
```bash
curl https://api.example.com/health
# Response: {"status":"ok","timestamp":"2024-12-05T..."}
```

### Check Database
```bash
curl https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","tenantId":"1"}'
```

### View Logs (Render)
```bash
# In Render dashboard → Logs tab
```

### View Logs (Heroku)
```bash
heroku logs --tail
```

---

## Post-Deployment

### 1. Configure Shopify Webhook
1. In Shopify Partner Dashboard → App settings
2. Add webhooks:
   - `orders/create` → `https://api.example.com/webhook`
   - `orders/updated` → `https://api.example.com/webhook`
   - `products/create` → `https://api.example.com/webhook`
   - `products/update` → `https://api.example.com/webhook`
   - `customers/create` → `https://api.example.com/webhook`
   - `customers/update` → `https://api.example.com/webhook`

### 2. Test OAuth Flow
1. Visit `https://api.example.com/auth/shopify/install?shop=myshop.myshopify.com`
2. Approve permissions
3. Should redirect back with success

### 3. Create First Tenant
```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myshop.com",
    "tenantId": "1"
  }'
```

### 4. Manual Sync
```bash
TOKEN="jwt-token-from-login"
curl -X POST https://api.example.com/sync/now \
  -H "Authorization: Bearer $TOKEN"
```

---

## Monitoring & Troubleshooting

### Common Issues

**"Tenant not found"**
- Ensure tenant exists in database
- Check: `SELECT * FROM "Tenants" LIMIT 1;`

**"Invalid JWT"**
- Token expired (7-day TTL)
- Check JWT_SECRET matches

**Webhooks not triggering**
- Verify SHOPIFY_WEBHOOK_SECRET
- Check webhook URL in Shopify dashboard
- Verify HMAC signature in logs

**Rate limit errors**
- Service handles automatically
- Check logs: `"remaining": <num>`

### View Logs
```bash
# Structured JSON logs for parsing
tail -f /var/www/xeno-backend/server.log | jq '.'

# Filter errors only
tail -f server.log | jq 'select(.level=="ERROR")'
```

---

## Scaling Considerations

- **Database**: Use managed PostgreSQL with connection pooling
- **Cron Jobs**: Run on single instance (node-cron)
- **Background Jobs**: Consider Bull queue for production
- **Caching**: Add Redis for metrics caching
- **CDN**: Serve frontend assets via CDN

---

## Maintenance

### Regular Backups
```bash
# Render: Automatic daily backups
# Manual backup:
pg_dump postgresql://user:pass@host/xeno_db > backup.sql
```

### Monitor Performance
```bash
# Check Render dashboard for:
- CPU usage
- Memory usage
- Build logs
- Runtime logs
```

### Updates
```bash
# SSH into server
cd /var/www/xeno-backend
git pull origin main
npm install
pm2 restart xeno
```

---

## Support

For issues:
1. Check logs first
2. Verify environment variables
3. Test endpoints with curl
4. Check GitHub issues
