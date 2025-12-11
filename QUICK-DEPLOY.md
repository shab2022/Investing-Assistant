# Quick Deployment Guide

## 🚀 Deploy to Production (30 minutes)

### Step 1: Prepare GitHub Repository

1. **Initialize Git** (if not already done):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - Investing Assistant"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name: `Investing-Assistant`
   - Make it Public (required for free deployments)
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/Investing-Assistant.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Python Service to Render

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Click "New +"** → **"Web Service"**

3. **Connect your GitHub repository**:
   - Select `Investing-Assistant`
   - Root Directory: `python-sentiment-service`

4. **Configure the service**:
   - **Name**: `investing-assistant-sentiment`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

5. **Click "Create Web Service"**

6. **Wait for deployment** (5-10 minutes, model download takes time)

7. **Copy the service URL** (e.g., `https://investing-assistant-sentiment.onrender.com`)

### Step 3: Update Supabase Secrets

1. **Update the sentiment service URL**:
   ```powershell
   npx supabase secrets set SENTIMENT_SERVICE_URL=https://investing-assistant-sentiment.onrender.com
   ```

2. **Verify secrets**:
   ```powershell
   npx supabase secrets list
   ```

### Step 4: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up/login with GitHub

2. **Click "Add New..."** → **"Project"**

3. **Import your GitHub repository**:
   - Select `Investing-Assistant`

4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qfvxyrbnvntqmfijhasy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnh5cmJudm50cW1maWpoYXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODkzNTMsImV4cCI6MjA4MTA2NTM1M30._4Uavi1dEen7zXQ6f0ST5fmnlO2C3B4iPyALnd8nKM4
   ```

6. **Click "Deploy"**

7. **Wait for deployment** (2-3 minutes)

8. **Your app is live!** Copy the production URL

## ✅ Verification Checklist

After deployment:

- [ ] Python service health check: `https://YOUR_RENDER_URL/health`
- [ ] Frontend loads: `https://YOUR_VERCEL_URL`
- [ ] User can register/login
- [ ] User can upload CSV portfolio
- [ ] Positions display correctly
- [ ] Test fetch prices function
- [ ] Test fetch news function
- [ ] Test generate digest function

## 📝 Important Notes

### Render Free Tier Limitations:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds (cold start)
- 750 hours/month free (enough for demo)

### Vercel Free Tier:
- 100 GB bandwidth/month
- Unlimited deployments
- Perfect for demos and testing

### For Demo Day:
1. **Warm up the service** 5 minutes before demo:
   - Visit: `https://YOUR_RENDER_URL/health`
   - This wakes up the service

2. **Have backup data ready**:
   - Pre-uploaded portfolio
   - Pre-fetched prices and news
   - Pre-generated digest

3. **Test everything 1 hour before**:
   - Full user flow
   - All features working
   - Load times acceptable

## 🔄 Continuous Deployment

Both Vercel and Render auto-deploy when you push to GitHub:
```powershell
git add .
git commit -m "Update feature"
git push
```

Frontend updates deploy in ~2 minutes
Backend updates deploy in ~5-10 minutes (model re-download)

## 🐛 Troubleshooting

### Python Service Issues:
- Check Render logs for errors
- Verify `requirements.txt` is correct
- Model download can take 5-10 min on first deploy

### Frontend Issues:
- Check Vercel deployment logs
- Verify environment variables are set
- Check browser console for errors

### Supabase Function Issues:
- Check function logs in Supabase dashboard
- Verify secrets are set correctly
- Test functions individually

## 🎓 Demo Script

1. **Show the homepage** - Clean, professional UI
2. **Sign up** - Create new account
3. **Upload portfolio** - Use sample CSV
4. **View positions** - Show portfolio overview
5. **Fetch prices** - Live market data
6. **Fetch news** - Relevant financial news
7. **Generate digest** - AI-powered sentiment analysis
8. **View digest** - Complete portfolio summary

Total demo time: 3-5 minutes
