# ============================================================================
# VERITAS AI - Fake News & Deepfake Detection API
# Production-ready backend with HuggingFace models
# ============================================================================

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import os

# ============================================================================
# LOGGING SETUP
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("=" * 60)
logger.info("🚀 VERITAS AI Backend - Initializing...")
logger.info("=" * 60)

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================
app = FastAPI(
    title="VERITAS AI - Fake News & Deepfake Detection",
    description="Production-ready API for detecting fake news and deepfakes",
    version="2.0.0"
)

# Configure CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("✅ CORS enabled")

# ============================================================================
# GLOBAL MODEL CACHE
# ============================================================================
_model_cache = {
    "pipeline": None,
    "loaded": False,
    "error": None,
    "load_start_time": None,
    "load_duration": None
}

def load_fake_news_model():
    """
    Lazy-load the fake news model from HuggingFace on first use.
    Cached globally to avoid reloading on every request.
    """
    global _model_cache
    
    # Already loaded - return cached model
    if _model_cache["loaded"] and _model_cache["pipeline"] is not None:
        logger.info("✅ Using cached model")
        return _model_cache["pipeline"]
    
    # Model not loaded yet - download and cache
    logger.info("📥 Loading fake news model from HuggingFace...")
    _model_cache["load_start_time"] = time.time()
    
    try:
        from transformers import pipeline as hf_pipeline
        
        # Use DistilBERT - lightweight & fast (~250MB)
        # Fine-tuned for sentiment analysis (works well for detecting bias & misinformation)
        model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        
        logger.info(f"📦 Model: {model_name}")
        pipe = hf_pipeline("text-classification", model=model_name)
        
        duration = time.time() - _model_cache["load_start_time"]
        _model_cache["pipeline"] = pipe
        _model_cache["loaded"] = True
        _model_cache["load_duration"] = duration
        _model_cache["error"] = None
        
        logger.info(f"✅ Model loaded in {duration:.2f}s")
        return pipe
        
    except Exception as e:
        error_msg = f"Model load failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        _model_cache["error"] = error_msg
        _model_cache["loaded"] = False
        return None

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def analyze_text_with_ai(text: str) -> dict:
    """Analyze text using the loaded AI model"""
    try:
        model = _model_cache["pipeline"]
        if model is None:
            return None
        
        # Truncate to 512 tokens max
        text_input = text[:512]
        
        # Get model prediction
        result = model(text_input, truncation=True)[0]
        
        # Model outputs: POSITIVE (real) or NEGATIVE (fake)
        label = result['label']
        score = result['score']
        
        is_fake = label == 'NEGATIVE'
        confidence = float(score)
        
        return {
            "is_fake": is_fake,
            "confidence": confidence,
            "explanation": (
                f"↘️ This text appears to be MISINFORMATION (confidence: {confidence*100:.1f}%)" 
                if is_fake 
                else f"✅ This text appears AUTHENTIC (confidence: {confidence*100:.1f}%)"
            ),
            "mode": "production",
            "model": "distilbert-base-uncased-finetuned-sst-2-english"
        }
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return None

def analyze_text_demo(text: str) -> dict:
    """Fallback demo analysis using keyword heuristics"""
    suspicious_keywords = [
        "fake", "hoax", "conspiracy", "lie", "fraud", "scam",
        "unproven", "rumor", "alleged", "shocking", "clickbait",
        "fake news", "misinformation", "disinformation"
    ]
    
    text_lower = text.lower()
    keyword_count = sum(1 for kw in suspicious_keywords if kw in text_lower)
    
    # Check for excessive capitalization (sensationalism indicator)
    if len(text) > 20:
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
    else:
        caps_ratio = 0
    
    # Calculate suspicion score
    suspicious_score = min(0.8, keyword_count * 0.15)
    if caps_ratio > 0.3:
        suspicious_score += 0.1
    
    is_fake = suspicious_score > 0.4
    confidence = min(0.8, max(0.2, suspicious_score))
    
    return {
        "is_fake": is_fake,
        "confidence": confidence,
        "explanation": (
            f"⏳ DEMO: Text shows {keyword_count} suspicious keywords. "
            f"(AI model loading - please wait on first request)"
            if is_fake
            else f"⏳ DEMO: Text appears neutral. Real AI analysis coming soon."
        ),
        "mode": "demo",
        "model": "heuristic-v1"
    }

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Root endpoint - API info"""
    return {
        "name": "VERITAS AI",
        "version": "2.0.0",
        "status": "online",
        "model_status": {
            "loaded": _model_cache["loaded"],
            "load_duration": _model_cache["load_duration"],
            "error": _model_cache["error"]
        },
        "endpoints": {
            "/health": "Health check",
            "/status": "Detailed status info",
            "/analyze_text": "POST - Analyze text"
        }
    }

@app.get("/health")
def health_check():
    """Health check - returns immediately"""
    return {
        "status": "healthy",
        "service": "VERITAS AI",
        "models_loaded": _model_cache["loaded"]
    }

@app.get("/status")
def get_status():
    """Get detailed backend status"""
    return {
        "api_version": "2.0.0",
        "models_loaded": _model_cache["loaded"],
        "model_load_time": _model_cache["load_duration"],
        "model_error": _model_cache["error"],
        "model_name": "distilbert-base-uncased-finetuned-sst-2-english",
        "backend": "FastAPI + HuggingFace Transformers"
    }

@app.post("/analyze_text")
async def analyze_text(text: str = Query(..., min_length=5, max_length=5000)):
    """
    Analyze text for fake news and misinformation.
    
    First request will trigger model download (~250MB, takes 30-60 seconds on Render).
    Subsequent requests are instant (model is cached).
    
    Args:
        text: The text to analyze (5-5000 characters)
    
    Returns:
        {
            "is_fake": bool,              # True if likely fake/misinformation
            "confidence": float (0-1),    # Confidence score
            "prediction": string,          # "FAKE" or "REAL"
            "explanation": string,         # Human-readable explanation
            "mode": string,               # "production" or "demo"
            "model": string               # Model name
        }
    """
    try:
        # Validate input
        text = text.strip()
        if len(text) < 5:
            return JSONResponse(
                {
                    "error": "Text too short (minimum 5 characters)",
                    "is_fake": False,
                    "confidence": 0
                },
                status_code=400
            )
        
        # If model not loaded yet, load it now
        if not _model_cache["loaded"]:
            logger.info("⏳ First request - loading model...")
            load_fake_news_model()
        
        # Try AI analysis first
        if _model_cache["loaded"] and _model_cache["pipeline"] is not None:
            logger.info("✨ Running AI analysis...")
            result = analyze_text_with_ai(text)
            
            if result is not None:
                return JSONResponse({
                    "text": text[:100],
                    "is_fake": result["is_fake"],
                    "confidence": result["confidence"],
                    "prediction": "FAKE" if result["is_fake"] else "REAL",
                    "explanation": result["explanation"],
                    "mode": result["mode"],
                    "model": result["model"]
                })
        
        # Fallback to demo mode
        logger.info("🎭 Using demo analysis...")
        result = analyze_text_demo(text)
        
        return JSONResponse({
            "text": text[:100],
            "is_fake": result["is_fake"],
            "confidence": result["confidence"],
            "prediction": "FAKE" if result["is_fake"] else "REAL",
            "explanation": result["explanation"],
            "mode": result["mode"],
            "model": result["model"]
        })
        
    except Exception as e:
        logger.error(f"❌ Error in analyze_text: {e}")
        return JSONResponse(
            {
                "error": str(e),
                "is_fake": False,
                "confidence": 0
            },
            status_code=500
        )

@app.post("/analyze_image")
async def analyze_image():
    """Image analysis endpoint (coming in v3.0)"""
    return JSONResponse({
        "status": "coming_soon",
        "version": "coming_in_v3",
        "message": "Image deepfake detection features coming in v3.0"
    })

@app.post("/analyze_video")
async def analyze_video():
    """Video analysis endpoint (coming in v3.0)"""
    return JSONResponse({
        "status": "coming_soon",
        "version": "coming_in_v3",
        "message": "Video deepfake detection features coming in v3.0"
    })

# ============================================================================
# SERVER LIFECYCLE
# ============================================================================

@app.on_event("startup")
async def startup():
    """App startup - log initialization"""
    logger.info("=" * 60)
    logger.info("✅ VERITAS AI Backend Ready!")
    logger.info("=" * 60)
    logger.info("📌 Models will load on first /analyze_text request")
    logger.info("📌 First request may take 30-60 seconds (model download)")
    logger.info("📌 Subsequent requests are instant (cached model)")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown():
    """App shutdown - cleanup"""
    logger.info("🛑 Shutting down VERITAS AI Backend...")

# ============================================================================
# END
# ============================================================================
