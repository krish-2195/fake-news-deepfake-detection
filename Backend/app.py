# FastAPI Backend - Fake News & Deepfake Detection API
# Optimized for Render deployment with lazy model loading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import sys

# Add logging to diagnose startup issues
print("[STARTUP] Initializing app...")
sys.stdout.flush()

# Lifespan handler to keep app running
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] App lifespan starting...")
    sys.stdout.flush()
    yield
    print("[SHUTDOWN] App lifespan ending...")
    sys.stdout.flush()

# Create the FastAPI application (FAST - no heavy imports here!)
app = FastAPI(
    title="Fake News & Deepfake Detection API",
    description="API for detecting fake news and deepfakes",
    version="1.0.0",
    lifespan=lifespan
)

print("[STARTUP] FastAPI app created...")
sys.stdout.flush()

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fake-news-deepfake-detection.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# GLOBAL CACHE: Models loaded once and reused for all requests
# ============================================================================
_models_cache = {
    "roberta_loaded": False,
    "tokenizer": None,
    "model": None,
    "models_available": False,
}

def get_models():
    """
    Lazy-load models on first request.
    Subsequent requests reuse cached models.
    Falls back gracefully if models are not available (e.g., on Render).
    """
    global _models_cache
    
    # Return cached models if already loaded
    if _models_cache["roberta_loaded"]:
        return _models_cache["tokenizer"], _models_cache["model"]
    
    # Load models only once
    print("[STARTUP] Loading RoBERTa model for first request...")
    try:
        from transformers import RobertaTokenizer, RobertaForSequenceClassification
        import torch
        
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'roberta_fake_news_model')
        
        # Check if models actually exist before trying to load
        if not os.path.exists(model_path):
            print(f"[WARNING] Models not found at {model_path}")
            print("[INFO] Running in DEMO mode without local models")
            _models_cache["models_available"] = False
            return None, None
        
        tokenizer = RobertaTokenizer.from_pretrained(model_path)
        model = RobertaForSequenceClassification.from_pretrained(model_path)
        model.eval()  # Set to evaluation mode
        
        # Cache for future use
        _models_cache["tokenizer"] = tokenizer
        _models_cache["model"] = model
        _models_cache["roberta_loaded"] = True
        _models_cache["models_available"] = True
        
        print("[STARTUP] ✅ RoBERTa model loaded successfully!")
        return tokenizer, model
        
    except Exception as e:
        print(f"[ERROR] Failed to load RoBERTa model: {e}")
        print("[INFO] Running in DEMO mode without models")
        _models_cache["models_available"] = False
        return None, None

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Root endpoint - Shows API info and available endpoints"""
    return {
        "name": "Fake News & Deepfake Detection API",
        "version": "1.0.0",
        "status": "Online",
        "description": "API for detecting fake news and deepfakes using machine learning",
        "endpoints": {
            "/": "API info (this page)",
            "/health": "Health check endpoint",
            "/test": "Test endpoint",
            "/analyze_text": "POST - Analyze text for fake news",
            "/analyze_video": "POST - Analyze video for deepfakes",
            "/docs": "Interactive Swagger UI documentation",
            "/redoc": "ReDoc documentation"
        },
        "backend_url": "https://fake-news-deepfake-backend.onrender.com",
        "try_it": "/analyze_text?text=test"
    }

@app.get("/health")
def health_check():
    """Health check endpoint - Returns immediately, no model loading"""
    return {
        "status": "healthy",
        "service": "Fake News & Deepfake Detection API",
        "version": "1.0.0"
    }

@app.get("/test")
def test():
    """Simple test endpoint"""
    return {
        "message": "API is working correctly",
        "endpoints": {
            "/health": "Health check",
            "/analyze_text": "Analyze text for fake news",
            "/analyze_video": "Analyze video for deepfakes",
            "/docs": "Interactive API documentation"
        }
    }

@app.post("/analyze_text")
async def analyze_text(text: str):
    """
    Analyze text for fake news using RoBERTa model.
    Falls back to demo mode if models are not available.
    
    Args:
        text: News article text to analyze
    
    Returns:
        JSON with:
            - is_fake: Boolean (True = fake, False = real)
            - confidence: Float (0-1 confidence score)
            - explanation: Human-readable explanation
            - mode: "production" (models loaded) or "demo" (no models)
    """
    try:
        # Validate input
        if not text or len(text.strip()) < 5:
            return {"error": "Text too short", "is_fake": None}
        
        if len(text) < 10:
            raise HTTPException(status_code=400, detail="Text must be at least 10 characters")
        
        # Load models (will use cache after first load)
        tokenizer, model = get_models()
        
        # If models not available, run in DEMO mode
        if tokenizer is None or model is None:
            print(f"[DEMO] Analyzing in demo mode (no models available)")
            
            # Simple heuristic for demo: check for suspicious keywords
            suspicious_keywords = [
                "fake", "hoax", "conspiracy", "lie", "fraud", "scam", 
                "unproven", "unverified", "alleged", "rumor", "claim"
            ]
            text_lower = text.lower()
            suspicious_count = sum(1 for keyword in suspicious_keywords if keyword in text_lower)
            
            is_fake = suspicious_count >= 2
            confidence = min(0.7, suspicious_count * 0.15)
            
            if is_fake:
                explanation = f"DEMO MODE: This text contains {suspicious_count} suspicious keywords. This is a DEMO response (actual model not available)."
            else:
                explanation = f"DEMO MODE: This text appears neutral. This is a DEMO response (actual model not available)."
            
            return {
                "text": text[:100] + "..." if len(text) > 100 else text,
                "is_fake": is_fake,
                "confidence": round(confidence, 3),
                "explanation": explanation,
                "model": "DEMO (RoBERTa not loaded)",
                "mode": "demo",
                "status": "success",
                "note": "Deploy with models folder to use production RoBERTa model"
            }
        
        # PRODUCTION MODE: Use actual models
        import torch
        
        # Tokenize input
        inputs = tokenizer(
            text[:512],  # Limit to 512 chars for efficiency
            max_length=128,
            truncation=True,
            padding=True,
            return_tensors='pt'
        )
        
        # Get model prediction
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Calculate probabilities
        logits = outputs.logits[0]
        probabilities = torch.softmax(logits, dim=0)
        predicted_class = torch.argmax(logits).item()
        confidence = probabilities[predicted_class].item()
        
        # Interpret results (0 = fake, 1 = real)
        is_fake = (predicted_class == 0)
        
        if is_fake:
            explanation = f"Model predicts FAKE news with {confidence*100:.1f}% confidence. Exercise caution with this content."
        else:
            explanation = f"Model predicts REAL news with {confidence*100:.1f}% confidence. This appears to be legitimate."
        
        return {
            "text": text[:100] + "..." if len(text) > 100 else text,
            "is_fake": is_fake,
            "confidence": round(confidence, 3),
            "explanation": explanation,
            "model": "RoBERTa Fine-Tuned",
            "mode": "production",
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Text analysis failed: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

@app.post("/analyze_video")
def analyze_video(video_url: str):
    """
    Analyze video for deepfakes (placeholder for now).
    
    Args:
        video_url: URL of video to analyze
    
    Returns:
        JSON with analysis results
    """
    try:
        if not video_url:
            raise HTTPException(status_code=400, detail="Video URL cannot be empty")
        
        # Placeholder - deepfake detection model loading would go here
        return {
            "video_url": video_url,
            "is_deepfake": False,
            "confidence": 0.0,
            "explanation": "Deepfake detection coming soon",
            "status": "model_not_ready"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Video analysis failed: {e}")
        return {
            "error": str(e),
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
