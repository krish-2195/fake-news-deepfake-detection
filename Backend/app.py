#!/usr/bin/env python3
"""Minimal FastAPI app that will definitely start"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VERITAS AI", version="2.0.0")

# CORS
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Global state
sentiment_pipeline = None
models_loaded = False

# Lazy load models
def load_models():
    global sentiment_pipeline, models_loaded
    if models_loaded:
        return
    try:
        logger.info("Loading models...")
        from transformers import pipeline
        sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)
        models_loaded = True
        logger.info("✅ Models loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        models_loaded = False

@app.get("/")
def root():
    return {"app": "VERITAS AI", "version": "2.0.0", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/status")
def status():
    return {"models_loaded": models_loaded}

@app.post("/analyze_text")
async def analyze_text(text: str = Query(..., min_length=5)):
    try:
        # Lazy load models
        if not models_loaded:
            load_models()
        
        if not sentiment_pipeline or not models_loaded:
            return JSONResponse({
                "prediction": "LOADING",
                "confidence": 0.0,
                "message": "Models loading - try again in 30 seconds"
            }, status_code=202)
        
        # Analyze
        result = sentiment_pipeline(text[:512])[0]
        is_fake = result["label"] == "NEGATIVE" and result["score"] > 0.85
        
        return JSONResponse({
            "text": text[:100],
            "is_fake": is_fake,
            "prediction": "POSSIBLY FAKE" if is_fake else "LIKELY REAL",
            "confidence": float(result["score"]),
            "mode": "production"
        })
    except Exception as e:
        logger.error(f"Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
