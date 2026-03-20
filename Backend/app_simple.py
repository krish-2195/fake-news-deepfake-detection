# Minimal FastAPI app - just to get the server running on Render
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI application
app = FastAPI(title="Fake News & Deepfake Detection API")

# Configure CORS  
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENDPOINT 1: Health Check
@app.get("/health")
def health_check():
    """Check if backend is running"""
    return {"status": "API is running"}

# ENDPOINT 2: Simple test endpoint
@app.get("/test")
def test():
    """Simple test endpoint"""
    return {"message": "API is working correctly"}

# ENDPOINT 3: Analyze text (basic)
@app.post("/analyze_text")
def analyze_text(text: str):
    """Analyze text (placeholder)"""
    try:
        from models import predict_fake_news
        result = predict_fake_news(text)
        return {
            "text": text,
            "is_fake": result["is_fake"],
            "confidence": result["confidence"],
            "explanation": result["explanation"]
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
