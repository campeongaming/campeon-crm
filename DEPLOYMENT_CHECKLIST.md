# Render Deployment - Quick Start Checklist

## Pre-Deployment Checklist (Local)

- [ ] Run `npm run build` - frontend builds without errors
- [ ] Run `pip install -r backend/requirements.txt` - backend dependencies work
- [ ] Check `backend/.env.production` has DATABASE_URL
- [ ] Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] Git repository is up to date

## Render Setup Steps

### 1️⃣ Create PostgreSQL Database
- [ ] Go to render.com → New → PostgreSQL
- [ ] Name: `campeon-crm-db`
- [ ] Copy **Internal Database URL**
- [ ] Save credentials securely

### 2️⃣ Deploy Backend
- [ ] New Web Service → GitHub
- [ ] Name: `campeon-crm-api`
- [ ] Environment: Python
- [ ] Build: `cd backend && pip install -r requirements.txt`
- [ ] Start: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] Set ENV: `DATABASE_URL=<internal-url>`
- [ ] Wait for deployment (5-10 min)
 - [ ] Test: `https://api.top-bonuslab.com/health`

### 3️⃣ Deploy Frontend
- [ ] New Web Service → GitHub
- [ ] Name: `campeon-crm-web`
- [ ] Environment: Node
- [ ] Build: `npm install && npm run build`
- [ ] Start: `npm start`
- [ ] Set ENV: `NEXT_PUBLIC_API_URL=https://api.top-bonuslab.com`
- [ ] Wait for deployment (5-10 min)
- [ ] Test: Visit frontend URL

## Post-Deployment

- [ ] Create test bonus template
- [ ] Verify data saves to PostgreSQL
- [ ] Check browser console for errors
- [ ] Test API endpoints via `/docs`

## Important URLs

| Service | Type | URL Format |
|---------|------|-----------|
| Backend | REST API | `https://api.top-bonuslab.com` |
| Frontend | Web App | `https://campeon-crm-web.onrender.com` |
| Database | PostgreSQL | `postgresql://...` (internal) |
| API Docs | Swagger UI | `https://api.top-bonuslab.com/docs` |
| Health Check | API | `https://api.top-bonuslab.com/health` |

## Environment Variables Needed

**Backend (.env or Render settings):**
```
DATABASE_URL=postgresql://campeon_user:PASSWORD@hostname:5432/campeon_crm
```

**Frontend (.env or Render settings):**
```
NEXT_PUBLIC_API_URL=https://api.top-bonuslab.com
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend won't build | Check Python version, ensure psycopg2-binary in requirements.txt |
| Database error | Verify DATABASE_URL is Internal URL, not External |
| API unreachable | Wait for deployment, check `/health` endpoint |
| Frontend can't connect | Verify NEXT_PUBLIC_API_URL matches backend service name |
| Data not persisting | Confirm DATABASE_URL is set in backend environment |

---

**Ready to deploy?** Follow the steps in `RENDER_DEPLOYMENT.md` for detailed instructions!
