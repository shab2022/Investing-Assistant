from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import logging

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

# Load FinBERT model
try:
    logger.info("Loading FinBERT model...")
    model_name = "ProsusAI/finbert"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    model.eval()
    logger.info("FinBERT model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    tokenizer = None
    model = None


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    score: float
    label: str


def get_sentiment_score(text: str) -> float:
    """
    Get sentiment score from FinBERT model.
    Returns a score between -1 (negative) and 1 (positive).
    """
    if model is None or tokenizer is None:
        logger.warning("Model not loaded, returning neutral score")
        return 0.0

    try:
        # Tokenize and get predictions
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # FinBERT labels: positive, negative, neutral
        # Map to sentiment score: positive -> 1, neutral -> 0, negative -> -1
        positive_score = predictions[0][0].item()
        negative_score = predictions[0][1].item()
        neutral_score = predictions[0][2].item()
        
        # Convert to -1 to 1 scale
        score = positive_score - negative_score
        
        return score
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
        "model_loaded": model is not None
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

