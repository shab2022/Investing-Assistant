from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sentiment Analysis Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HuggingFace Inference API settings
HF_API_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert"
HF_TOKEN = os.environ.get("HUGGINGFACE_TOKEN", "")  # Optional, works without token but may have rate limits

logger.info("Using HuggingFace Inference API for FinBERT")


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    score: float
    label: str


def get_sentiment_score(text: str) -> float:
    """
    Get sentiment score from FinBERT model via HuggingFace Inference API.
    Returns a score between -1 (negative) and 1 (positive).
    """
    try:
        headers = {}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"
        
        # Call HuggingFace API
        response = requests.post(
            HF_API_URL,
            headers=headers,
            json={"inputs": text},
            timeout=30
        )
        
        logger.info(f"HF API Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"HF API Response: {result}")
            
            # Parse the response - HF returns list of predictions
            if isinstance(result, list) and len(result) > 0:
                predictions = result[0]
                
                # Find scores for each label
                positive_score = 0.0
                negative_score = 0.0
                
                for pred in predictions:
                    label = pred.get("label", "").lower()
                    score = pred.get("score", 0.0)
                    
                    if "positive" in label:
                        positive_score = score
                    elif "negative" in label:
                        negative_score = score
                
                # Convert to -1 to 1 scale
                sentiment_score = positive_score - negative_score
                logger.info(f"Calculated sentiment: {sentiment_score} (pos:{positive_score}, neg:{negative_score})")
                return sentiment_score
        
        logger.warning(f"API returned status {response.status_code}: {response.text}")
        return 0.0
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return 0.0


@app.get("/")
def root():
    return {"message": "Sentiment Analysis Service", "model": "FinBERT"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_type": "huggingface_inference_api"
    }


@app.post("/sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of financial text.
    Returns score between -1 (negative) and 1 (positive).
    """
    score = get_sentiment_score(request.text)
    
    # Determine label
    if score > 0.1:
        label = "positive"
    elif score < -0.1:
        label = "negative"
    else:
        label = "neutral"
    
    return SentimentResponse(score=score, label=label)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

