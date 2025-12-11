# Quick Setup Guide for New Supabase Project

Follow these steps to set up your Investing Assistant with a fresh Supabase project.

## 🚀 Quick Start Checklist

### ✅ Part 1: Supabase Setup (15 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: `investing-assistant`
   - Choose a strong database password
   - Select your region
   - Wait for project to initialize

2. **Save Your Credentials**
   - Go to Settings → API
   - Copy and save:
     - Project URL
     - `anon` public key
     - `service_role` key (keep secret!)

3. **Set Up Database**
   - Go to SQL Editor
   - Copy everything from `supabase/schema.sql`
   - Paste and run in SQL Editor
   - Verify tables created in Database → Tables

4. **Install Supabase CLI**
   ```powershell
   npm install -g supabase
   ```

5. **Link Your Project**
   ```powershell
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get project ref from: Settings → General → Reference ID

6. **Deploy Edge Functions**
   ```powershell
   supabase functions deploy ingest-csv
   supabase functions deploy fetch-prices
   supabase functions deploy fetch-news
   supabase functions deploy generate-digest
   supabase functions deploy daily-digest-cron
   ```

7. **Set Secrets**
   ```powershell
   # Generate a random secret
   $secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   echo $secret
   
   # Set the secrets
   supabase secrets set CRON_SECRET=$secret
   supabase secrets set SENTIMENT_SERVICE_URL=http://localhost:8000
   ```

### ✅ Part 2: Frontend Setup (5 minutes)

1. **Install Dependencies**
   ```powershell
   npm install
   ```

2. **Configure Environment**
   ```powershell
   cp .env.local.example .env.local
   ```

3. **Edit `.env.local`**
   Replace with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SENTIMENT_SERVICE_URL=http://localhost:8000
   ```

4. **Start Development Server**
   ```powershell
   npm run dev
   ```
   Visit http://localhost:3000

### ✅ Part 3: Python Sentiment Service (10 minutes)

1. **Navigate to Service Directory**
   ```powershell
   cd python-sentiment-service
   ```

2. **Create Virtual Environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```powershell
   pip install -r requirements.txt
   ```
   Note: First run will download FinBERT model (~500MB)

4. **Start Service**
   ```powershell
   python main.py
   ```
   Service runs on http://localhost:8000

### ✅ Part 4: Test Your Setup

1. **Create Account**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Create a test account

2. **Upload Portfolio**
   - Use `sample-positions.csv` or create your own
   - Format: `Symbol,Quantity,Average Cost`

3. **Verify Data**
   - Check Supabase dashboard → Database → Tables
   - You should see data in `positions` table

4. **Test Functions**
   - Trigger price fetch (should populate `prices_daily`)
   - Trigger news fetch (should populate `news`)
   - Generate digest (should create entry in `digests`)

## 🔧 Troubleshooting

### Edge Functions Not Working
- Verify they're deployed: `supabase functions list`
- Check logs: `supabase functions logs <function-name>`
- Ensure secrets are set: `supabase secrets list`

### Database Errors
- Verify schema ran successfully in SQL Editor
- Check Row Level Security (RLS) is enabled
- Ensure you're authenticated when making requests

### Authentication Issues
- Verify Supabase URL and anon key in `.env.local`
- Check browser console for errors
- Ensure auth is enabled in Supabase dashboard

### Python Service Not Responding
- Verify it's running on port 8000
- Check firewall isn't blocking the port
- Ensure all dependencies installed correctly

## 📝 Environment Variables Reference

| Variable | Where to Find | Used By |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Frontend |
| `SENTIMENT_SERVICE_URL` | Your Python service URL | Edge Functions |
| `CRON_SECRET` | Generate randomly | Edge Functions |

## 🎯 Next Steps

After setup is complete:

1. **Customize Portfolio**: Upload your real positions
2. **Set Up Cron Job**: Automate daily digests (see README)
3. **Deploy to Production**: 
   - Deploy Next.js to Vercel
   - Deploy Python service to Railway/Render
   - Update `SENTIMENT_SERVICE_URL` in Supabase secrets

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

## ❓ Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review Supabase function logs for errors
- Check browser console for frontend issues
