# Sentiment Analysis Service

FastAPI service for financial sentiment analysis using FinBERT.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /sentiment` - Analyze sentiment

### Sentiment Endpoint

Request:
```json
{
  "text": "Apple stock surges after strong earnings report"
}
```

Response:
```json
{
  "score": 0.75,
  "label": "positive"
}
```

## Deployment

### Render.com (Free Tier)

1. Create a new Web Service
2. Connect your repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables if needed

Note: Free tier apps spin down after inactivity, causing cold starts.

