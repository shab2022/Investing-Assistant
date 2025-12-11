# Investing Assistant

A web application for portfolio analysis and daily financial digest using free-tier services (Supabase, Next.js, and FinBERT).

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Portfolio Import**: Upload Robinhood CSV files to import positions
- **Market Data**: Automatic price fetching from Yahoo Finance
- **News Aggregation**: Collects financial news from RSS feeds (Yahoo Finance, CNBC, Reuters)
- **Sentiment Analysis**: Analyzes news headlines using FinBERT model
- **Daily Digest**: Automated end-of-day portfolio summary with performance and relevant news
- **Real-time Dashboard**: View positions, portfolio value, and daily digests

## Tech Stack

### Frontend
- **Next.js 14** (React framework)
- **TypeScript**
- **Tailwind CSS**
- **Supabase Client** (auth and data)

### Backend
- **Supabase** (Free tier)
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions (Deno)
  - Cron jobs

### Services
- **Python FastAPI** (Sentiment analysis microservice)
- **FinBERT** (Financial sentiment analysis model)
- **Yahoo Finance API** (Market prices)
- **RSS Feeds** (Financial news)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account (free tier)
- Supabase CLI (for deploying edge functions)

### 1. Supabase Project Setup

#### Step 1.1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `investing-assistant` (or your preferred name)
   - **Database Password**: Choose a strong password (save it somewhere safe)
   - **Region**: Select the closest region to you
   - **Pricing Plan**: Free
4. Click **"Create new project"** and wait for it to finish initializing (2-3 minutes)

#### Step 1.2: Get Your Project Credentials

1. In your new Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values (you'll need them later):
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

#### Step 1.3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the schema
6. Verify tables were created by going to **Database** → **Tables**

You should see these tables:
- `positions`
- `prices_daily`
- `news`
- `digests`
- `digest_items`

#### Step 1.4: Install Supabase CLI

If you don't have the Supabase CLI installed:

```bash
# On Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

#### Step 1.5: Link to Your Project

1. In your project directory, run:
```bash
supabase login
```

2. Link to your new project:
```bash
supabase link --project-ref your-project-ref
```

To find your project ref:
- Go to your Supabase dashboard
- Settings → General
- Copy the "Reference ID"

#### Step 1.6: Deploy Edge Functions

Deploy all edge functions to your new project:

```bash
# Deploy ingest-csv function
supabase functions deploy ingest-csv

# Deploy fetch-prices function
supabase functions deploy fetch-prices

# Deploy fetch-news function
supabase functions deploy fetch-news

# Deploy generate-digest function
supabase functions deploy generate-digest

# Deploy daily-digest-cron function
supabase functions deploy daily-digest-cron
```

#### Step 1.7: Set Environment Secrets for Edge Functions

Set up the required secrets for your edge functions:

```bash
# Set sentiment service URL (use your deployed Python service URL)
supabase secrets set SENTIMENT_SERVICE_URL=http://your-python-service-url:8000

# Set a strong random secret for cron job security
supabase secrets set CRON_SECRET=your-random-secret-string
```

Generate a random secret with:
```bash
# On Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

#### Step 1.8: Set Up Cron Job (Optional - for automated daily digests)

1. In Supabase dashboard, go to **Database** → **Cron Jobs**
2. Create a new cron job:
   - **Name**: `daily-digest`
   - **Schedule**: `0 22 * * *` (runs at 10 PM daily)
   - **SQL**: 
   ```sql
   SELECT net.http_post(
     url := 'https://your-project-ref.supabase.co/functions/v1/daily-digest-cron',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
   ) AS request_id;
   ```
   Replace `your-project-ref` and `YOUR_CRON_SECRET` with your actual values

### 2. Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SENTIMENT_SERVICE_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

### 3. Python Sentiment Service Setup

1. Navigate to Python service directory:
```bash
cd python-sentiment-service
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the service:
```bash
python main.py
```

The service will run on `http://localhost:8000`

### 4. Deploy Python Service (Optional)

For production, deploy to Render.com free tier:

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Update `SENTIMENT_SERVICE_URL` in Supabase Edge Functions

### 5. Deploy Frontend (Optional)

Deploy to Vercel free tier:

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables
4. Deploy

### 6. Set Up Cron Job

In Supabase dashboard, go to Database > Cron Jobs and create:

```sql
SELECT cron.schedule(
  'daily-digest',
  '0 18 * * *',  -- 6 PM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-digest-cron',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Upload Portfolio**: Upload a Robinhood `positions.csv` file
3. **Refresh Data**: Click "Refresh Data" to fetch prices, news, and generate digest
4. **View Digest**: Switch to "Daily Digest" tab to see summaries and news

## CSV Format

The CSV should have at least these columns:
- `Symbol` (or `Ticker`)
- `Quantity` (or `Shares`)
- `Average Cost Basis` (optional)

Example:
```csv
Symbol,Quantity,Average Cost Basis
AAPL,10,150.00
GOOGL,5,2500.00
```

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Login.tsx         # Auth component
│   ├── Dashboard.tsx     # Main dashboard
│   ├── PortfolioUpload.tsx
│   ├── PositionsList.tsx
│   └── DigestView.tsx
├── lib/                   # Utilities
│   └── supabase.ts       # Supabase client
├── supabase/              # Supabase config
│   ├── schema.sql        # Database schema
│   ├── functions/        # Edge Functions
│   └── config.toml       # Supabase config
└── python-sentiment-service/  # Python microservice
    ├── main.py
    └── requirements.txt
```

## Team Members

- Shahab Alriyashi: Supabase DB schema + Edge Functions
- Warif Hussini: Frontend dashboard + additional backend
- Yousef Eltobji: Python microservice (FinBERT integration)

## Limitations

- Free data sources may have delays (Yahoo Finance ~15 min delay)
- Render free tier apps spin down when idle (cold start delays)
- RSS feeds may not cover all stocks
- Free tier rate limits apply

## License

MIT

