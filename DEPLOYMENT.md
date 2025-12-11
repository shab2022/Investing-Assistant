# Production Deployment Plan

## 🎯 Deployment Overview

This project will be deployed across three platforms:
1. **Vercel** - Next.js frontend (free tier)
2. **Render** - Python sentiment service (free tier)
3. **Supabase** - Database + Edge Functions (already set up)

## 📋 Deployment Steps

### Phase 1: Python Sentiment Service → Render ✅

1. Create `render.yaml` for infrastructure as code
2. Add `.python-version` file
3. Deploy to Render
4. Get production URL

### Phase 2: Update Supabase Secrets ✅

1. Update `SENTIMENT_SERVICE_URL` with production Python service URL
2. Redeploy edge functions if needed

### Phase 3: Frontend → Vercel ✅

1. Create Vercel account / link existing
2. Connect GitHub repository
3. Configure environment variables
4. Deploy

### Phase 4: Testing & Demo Prep ✅

1. Test all features end-to-end
2. Create demo data
3. Document demo flow

## 🚀 Expected Timeline

- Python Service Deploy: 10 min
- Supabase Update: 2 min
- Frontend Deploy: 5 min
- Testing: 10 min
**Total: ~30 minutes**

## 🔗 Production URLs

After deployment:
- **Frontend**: `https://investing-assistant.vercel.app`
- **Python API**: `https://investing-assistant-sentiment.onrender.com`
- **Supabase**: `https://qfvxyrbnvntqmfijhasy.supabase.co`

## ✅ Demo Checklist

- [ ] User can sign up/login
- [ ] User can upload portfolio CSV
- [ ] Positions display correctly
- [ ] Price fetching works
- [ ] News aggregation works
- [ ] Sentiment analysis works
- [ ] Daily digest generation works
- [ ] All data persists correctly
