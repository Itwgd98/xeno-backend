# Render Deployment Guide - Post-Deployment Checklist

## ✅ Your Deployment Status

**URL:** https://xeno-backend-84lr.onrender.com  
**Database:** Render PostgreSQL (managed)  
**Status:** ✅ Running (frontend loading)  

---

## 🔧 What to Check/Do Now

### 1. **Verify Server is Fully Started**
Check Render dashboard → Logs:
- Look for: `"PostgreSQL connected"`
- Look for: `"Server running on http://localhost:5000"`
- Look for: `"Sync job scheduled successfully"`

If you see errors, scroll up to find the issue.

### 2. **Update Environment Variables (If Needed)**

Your `.env` needs these variables in Render:

```
DATABASE_URL=postgresql://...  (Render auto-sets this)
PORT=5000
BACKEND_URL=https://xeno-backend-84lr.onrender.com
JWT_SECRET=your-super-secret-key-change-this
SHOPIFY_API_KEY=your-key
SHOPIFY_API_SECRET=your-secret
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
SYNC_INTERVAL=0 * * * *
DEBUG=false
```

**To update in Render:**
1. Go to Render dashboard → xeno-backend
2. Click "Environment"
3. Update each variable
4. Click "Deploy" to restart with new env vars

### 3. **Test Login Endpoint**

Replace `$TOKEN` with your actual token:

```bash
# Get token via login
curl -X POST https://xeno-backend-84lr.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","tenantId":"1"}'

# Should return something like:
# {"token":"eyJhbGc...","tenant":{"id":1,"shopName":"...","shopDomain":"..."}}
```

### 4. **Create Demo Tenant (If Not Done)**

If you haven't seeded the database yet:

**Option A: Via Render Web Console**
1. Go to Render dashboard → xeno-backend
2. Click "Shell" tab
3. Run: `node seed.js`
4. Should see: "Seed completed successfully"

**Option B: Via Local Environment**
```bash
# Update .env with Render's DATABASE_URL
# Then run locally:
node seed.js
```

### 5. **Test Dashboard**

1. Visit: https://xeno-backend-84lr.onrender.com
2. Login with:
   - Email: `demo@xeno.com`
   - Tenant: `1` or `demo.myshopify.com`
3. Should see metrics, charts, sync button

### 6. **Configure Shopify Webhooks** (If You Have a Shop)

1. In Shopify Partner Dashboard → Your App → Settings
2. Add webhooks pointing to:
   - `https://xeno-backend-84lr.onrender.com/webhook`
   - Events: `orders/create`, `orders/updated`, `products/create`, `products/update`, `customers/create`, `customers/update`
3. Copy webhook secret to Render → SHOPIFY_WEBHOOK_SECRET

---

## 📊 API Endpoint Testing

### Test Health Check (NEW endpoint in latest deploy)
```bash
curl https://xeno-backend-84lr.onrender.com/health
# Should return: {"status":"ok","timestamp":"2024-12-05T..."}
```

### Test Metrics
```bash
curl https://xeno-backend-84lr.onrender.com/metrics \
  -H "x-tenant-id: 1"
# Should return: {"totalCustomers":0,"totalOrders":0,"totalRevenue":0,...}
```

### Test Orders
```bash
# First get JWT token from login
TOKEN="your-jwt-token"
curl https://xeno-backend-84lr.onrender.com/orders \
  -H "Authorization: Bearer $TOKEN"
# Should return: {"total":0,"limit":20,"offset":0,"orders":[]}
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "404 on /health"
**Cause:** Old version still deployed  
**Fix:** 
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes for redeploy

### Issue 2: "Cannot find module 'node-cron'"
**Cause:** Dependencies not installed after push  
**Fix:**
1. In Render → Settings → Build Command
2. Verify it's: `npm install`
3. Click "Manual Deploy" → "Deploy latest commit"

### Issue 3: "Tenant not found"
**Cause:** Database not seeded  
**Fix:** 
```bash
# Via Render Shell:
node seed.js
# Or create manually with your DB tool
```

### Issue 4: "JWT_SECRET not set"
**Cause:** Environment variable missing  
**Fix:**
1. Render → Environment
2. Add: `JWT_SECRET=your-secret-key`
3. Click "Deploy"

### Issue 5: Database Connection Error
**Cause:** DATABASE_URL not set or wrong format  
**Fix:**
1. Render auto-sets DATABASE_URL from PostgreSQL addon
2. If missing, go to Render → Environment
3. Verify DATABASE_URL starts with `postgresql://`

---

## 📈 Monitoring & Logs

### View Real-time Logs
```
Render Dashboard → xeno-backend → Logs tab
```

### Check Recent Errors
```
Render Dashboard → xeno-backend → Events tab
```

### View Database Queries
In .env, set: `DEBUG=true` (will log verbose output)

---

## 🔄 Continuous Sync

The service is already set to sync data hourly (configurable via SYNC_INTERVAL).

**To manually trigger sync:**
```bash
TOKEN="your-jwt-token"
curl -X POST https://xeno-backend-84lr.onrender.com/sync/now \
  -H "Authorization: Bearer $TOKEN"
# Should return: {"message":"Sync completed successfully","customers":0,"orders":0,"products":0}
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET changed to a strong random key
- [ ] SHOPIFY_API_SECRET is secure (not exposed)
- [ ] SHOPIFY_WEBHOOK_SECRET is secret (not exposed)
- [ ] DATABASE_URL not logged (should be hidden in Render)
- [ ] CORS enabled (configured in server.js)

---

## 📊 What's Running on Render

```
Process: node server.js
Port: 5000 (Render handles routing)
Database: PostgreSQL (Render managed)
Jobs: Sync scheduler (node-cron, hourly)
Frontend: Static HTML served from server
Logging: Structured JSON to stdout
```

---

## 🚀 Next Steps

### Immediate (Now)
1. [ ] Check Render logs for any errors
2. [ ] Test login at dashboard
3. [ ] Verify environment variables are set
4. [ ] Seed database if needed

### Short-term (This Week)
1. [ ] Configure Shopify webhooks
2. [ ] Test data ingestion
3. [ ] Monitor sync jobs
4. [ ] Test all API endpoints

### Long-term
1. [ ] Set up monitoring alerts
2. [ ] Implement database backups
3. [ ] Plan scaling strategy
4. [ ] Add more analytics

---

## 📞 Troubleshooting Steps

**If something breaks:**

1. Check Render logs:
   ```
   Render Dashboard → xeno-backend → Logs
   ```

2. Check if it's a deployment issue:
   ```
   Render Dashboard → Events
   ```

3. Verify env variables:
   ```
   Render Dashboard → Environment
   ```

4. Check database connection:
   ```
   Try connecting with any PostgreSQL client using DATABASE_URL
   ```

5. Check git push:
   ```
   git log --oneline -1  (should match latest commit)
   ```

---

## ✨ You're All Set!

Your production system is live. Monitor the logs, test endpoints, and enjoy your multi-tenant analytics platform! 🚀

**Dashboard:** https://xeno-backend-84lr.onrender.com
