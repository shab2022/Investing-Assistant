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

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `supabase/schema.sql`
3. Go to Edge Functions and deploy:
   - `ingest-csv`
   - `fetch-prices`
   - `fetch-news`
   - `generate-digest`
   - `daily-digest-cron`
4. Set up environment variables in Supabase dashboard:
   - `SENTIMENT_SERVICE_URL` (your Python service URL)
   - `CRON_SECRET` (for cron job security)

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

