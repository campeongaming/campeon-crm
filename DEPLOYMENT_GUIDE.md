# CAMPEON CRM - Deployment Guide

## 🎯 Deployment Stack
- **Database**: PostgreSQL (already on top-bonuslab.com) ✅
- **Backend API**: Render.com
- **Frontend**: Vercel

---

## 📦 Step 1: Deploy Backend to Render

### 1.1 Push Code to GitHub
```bash
cd "C:\Users\GiorgosKorifidis\Downloads\CAMPEON CRM PROJECT"
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 1.2 Deploy on Render
1. Go to **https://render.com** and sign up/login
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `campeon-crm-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### 1.3 Set Environment Variables
In Render dashboard → Environment:
```
DATABASE_URL = <YOUR_POSTGRESQL_URL_FROM_DEVOPS>
```
(Use the PostgreSQL URL your DevOps person provided)

### 1.4 Deploy
Click **"Create Web Service"**

You'll get a URL like: `https://api.top-bonuslab.com`

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy on Vercel
1. Go to **https://vercel.com** and sign up/login
2. Click **"Add New" → "Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://api.top-bonuslab.com
```

### 2.3 Deploy
Click **"Deploy"**

You'll get a URL like: `https://campeon-crm.vercel.app`

---

## 🔧 Step 3: Update Frontend API Configuration

Update the API base URL in your frontend code:

**File: `src/lib/api-config.ts`** (or wherever you define API_BASE_URL)
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

---

## ✅ Step 4: Test Everything

### Backend API Test
Visit: `https://api.top-bonuslab.com/docs`

You should see the FastAPI Swagger documentation.

### Frontend Test
Visit: `https://campeon-crm.vercel.app`

The app should load and connect to the backend API.

### Database Test
Create a bonus template in the frontend - it should save to PostgreSQL.

---

## 🚨 Common Issues

### Issue: "CORS error" in browser console
**Fix**: Add your Vercel URL to CORS allowed origins in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://campeon-crm.vercel.app",  # Add this
        "https://your-custom-domain.com",   # Add any custom domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Backend cold starts slowly
**Solution**: Render free tier has cold starts (10-30 seconds). Upgrade to paid tier or use Railway.

### Issue: Database connection timeout
**Solution**: Check DATABASE_URL is set correctly in Render environment variables.

---

## 📝 URLs Summary

After deployment:
- **Frontend**: https://campeon-crm.vercel.app
- **Backend API**: https://api.top-bonuslab.com
- **API Docs**: https://api.top-bonuslab.com/docs
- **Database**: top-bonuslab.com (PostgreSQL)

---

## 🔄 Updating After Changes

### Update Backend
```bash
git add backend/
git commit -m "Update backend"
git push
```
Render auto-deploys from GitHub.

### Update Frontend
```bash
git add src/
git commit -m "Update frontend"
git push
```
Vercel auto-deploys from GitHub.

---

## 💰 Cost
- **Database**: Provided by your DevOps
- **Render**: FREE (with cold starts) or $7/month (always on)
- **Vercel**: FREE for personal projects

**Total**: FREE or $7/month
