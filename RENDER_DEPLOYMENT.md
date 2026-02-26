# Render Deployment Guide - CAMPEON CRM

## Overview
This guide will deploy your CAMPEON CRM system to Render with a production PostgreSQL database.

---

## Part 1: Create PostgreSQL Database on Render

### Step 1: Create Render Account
1. Go to **https://render.com**
2. Sign up with GitHub or email
3. Verify your email

### Step 2: Create PostgreSQL Database
1. Click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `campeon-crm-db`
   - **Database**: `campeon_crm`
   - **User**: `campeon_user`
   - **Password**: (Render generates one - copy this!)
   - **Region**: Pick closest to your location (e.g., Frankfurt, Ohio)
   - **Plan**: Free (includes 90 days)
4. Click **"Create Database"**
5. Wait 2-3 minutes for creation

### Step 3: Copy Database Credentials
Once created, you'll see:
- **External Database URL** (for remote access)
- **Internal Database URL** (for Render services - USE THIS ONE)

**Format**: `postgresql://username:password@hostname:5432/dbname`

**Copy the Internal URL** - you'll need it in the next step.

---

## Part 2: Deploy Backend API to Render

### Step 1: Create Web Service for Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect Repository"**
   - Select your GitHub repo
   - Click **"Connect"**

### Step 2: Configure Backend Service
- **Name**: `campeon-crm-api`
- **Environment**: `Python 3`
- **Build Command**: 
  ```
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- **Plan**: Free

### Step 3: Set Environment Variables
Click **"Environment"** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://campeon_user:YOUR_PASSWORD@your-host.render.com:5432/campeon_crm` |
| `PYTHON_VERSION` | `3.11` |

**IMPORTANT**: Replace with your actual Internal Database URL from Step 1!

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. You'll get a URL like: `https://api.top-bonuslab.com`
4. Test: Visit `https://api.top-bonuslab.com/health`

---

## Part 3: Deploy Frontend to Render

### Step 1: Create Web Service for Frontend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository again
3. Click **"Connect"**

### Step 2: Configure Frontend Service
- **Name**: `campeon-crm-web`
- **Environment**: `Node`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```
- **Plan**: Free

### Step 3: Set Environment Variables
Click **"Environment"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.top-bonuslab.com` |
| `NODE_ENV` | `production` |

**Important**: Use your actual backend URL from Part 2!

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. You'll get a URL like: `https://campeon-crm-web.onrender.com`
4. Visit that URL to access your application!

---

## Part 4: Local Development (Keep Using)

### Running Locally with Production Database

**Option A: Use Local SQLite (Recommended for Development)**
```bash
# Frontend
npm run dev

# Backend (from backend folder)
python -m uvicorn main:app --reload --port 8000
```

**Option B: Test Production Database Locally**

1. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://campeon_user:password@your-host.render.com:5432/campeon_crm
   ```

2. Install PostgreSQL driver:
   ```bash
   pip install psycopg2-binary
   ```

3. Run backend:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

---

## Troubleshooting

### "Connection refused" when accessing API
- ❌ Backend might still be building
- ✅ Wait 5-10 minutes and refresh
- ✅ Check `https://api.top-bonuslab.com/health`

### Database connection errors on Render
- ❌ Wrong DATABASE_URL format
- ✅ Copy the **Internal Database URL** (not External)
- ✅ Format must be: `postgresql://user:pass@host:5432/db`

### Frontend shows "Cannot connect to API"
- ❌ `NEXT_PUBLIC_API_URL` not set correctly
- ✅ Must match your backend service URL
- ✅ Rebuild frontend after changing env vars

### Persistent database needed?
- ❌ Free tier auto-deletes after 90 days of inactivity
- ✅ Upgrade to paid plan ($7/month) for persistent database

---

## File Checklist

Make sure these files exist in your project:

✅ `backend/requirements.txt` - Must include `psycopg2-binary`  
✅ `backend/.env.production` - Has DATABASE_URL  
✅ `backend/main.py` - Has init_db() call  
✅ `.env.local` - Has `NEXT_PUBLIC_API_URL=http://localhost:8000`  
✅ `src/lib/api-config.ts` - API configuration utility  

---

## Next Steps After Deployment

1. **Test the deployed system**:
   - Visit your frontend URL
   - Try creating a bonus template
   - Check if data persists

2. **Enable CORS for production**:
   ```python
   # In backend/main.py
   allow_origins=["https://campeon-crm-web.onrender.com", "*"]
   ```

3. **Add authentication** (future enhancement):
   - Implement JWT tokens
   - Restrict API endpoints
   - Role-based access control

4. **Database backups**:
   - Render provides automated backups
   - Download backups from dashboard

---

## Production Checklist

- [ ] Database deployed and tested
- [ ] Backend API deployed and responding
- [ ] Frontend deployed and loading
- [ ] Environment variables set correctly
- [ ] CORS settings updated for production domain
- [ ] Database backups configured
- [ ] Monitoring enabled

---

## Support

If you encounter issues:
1. Check Render dashboard logs
2. Verify environment variables
3. Test health endpoint: `https://api.top-bonuslab.com/health`
4. Check browser console for errors
