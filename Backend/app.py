# Import FastAPI and dependencies
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware  # Allow React frontend to communicate with backend
import os
from dotenv import load_dotenv  # Load environment variables from .env file
from models import predict_fake_news  # Import the prediction model

# Load environment variables from .env file (if exists)
load_dotenv()

# Create the FastAPI application instance
app = FastAPI(title="Fake News & Deepfake Detection API")

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the React frontend (running on localhost:3000) to make requests to this backend (localhost:8000)
# Without this, browser security would block requests from different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3000", "*"],  # Allow React frontend + testing
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Import heavy libraries ONLY when needed (lazy loading)
# This prevents startup timeout on Render
import cv2                                    # Image/video processing
import numpy as np                            # Numerical operations
import tempfile                               # Create temp files for videos
from typing import Dict, List, Tuple         # Type hints for clarity

# Lazy load models - only load when first request comes in
mesonet_model = None

def get_mesonet_model():
    """Lazy load MesoNet model only when needed"""
    global mesonet_model
    if mesonet_model is None:
        try:
            from tensorflow import keras
            mesonet_model = keras.models.load_model("../mesonet_deepfake_detector.h5")
            print("✅ MesoNet model loaded successfully")
        except Exception as e:
            print(f"⚠️ Warning: MesoNet model not loaded: {e}")
            mesonet_model = None
    return mesonet_model

# ENDPOINT 1: Health Check
# Simple endpoint to verify the backend is running
# GET request to http://localhost:8000/health
@app.get("/health")
def health_check():
    """Check if backend is running"""
    return {"status": "Backend is running"}

# ENDPOINT 2: Analyze Text with RoBERTa Model
# Analyzes text using the trained RoBERTa fake news classifier
# POST request to http://localhost:8000/analyze_text?text=<input_text>
@app.post("/analyze_text")
def analyze_text(text: str):
    """
    Analyze text for fake news using the RoBERTa model.
    
    Args:
        text (str): The news text to analyze
    
    Returns:
        dict: Contains is_fake, confidence, and explanation from the model
    """
    # Validate input
    if not text or len(text.strip()) == 0:
        return {
            "is_fake": False,
            "confidence": 0.0,
            "explanation": "Empty text provided. Please enter text to analyze."
        }
    
    try:
        # Call the RoBERTa model to get prediction
        prediction = predict_fake_news(text)
        
        # Return the model's prediction
        return {
            "text": text,
            "is_fake": prediction["is_fake"],
            "confidence": prediction["confidence"],
            "explanation": prediction["explanation"]
        }
    
    except Exception as e:
        # Handle any errors during prediction
        return {
            "is_fake": False,
            "confidence": 0.0,
            "explanation": f"Error during analysis: {str(e)}"
        }

# Helper function to preprocess images
def preprocess_image(image_array: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    WHAT IT DOES:
    1. Resize image to 256×256 (MesoNet requirement)
    2. Normalize pixel values from 0-255 to 0-1 (improves neural network performance)
    3. Convert BGR (OpenCV format) to RGB (standard format)
    
    INPUT: Raw image from file
    OUTPUT: Cleaned image ready for MesoNet model
    """
    # Step 1: Resize to 256×256
    resized = cv2.resize(image_array, (256, 256))
    
    # Step 2: Normalize to 0-1 range (divide by 255)
    normalized = resized.astype('float32') / 255.0
    
    # Step 3: Convert BGR → RGB (OpenCV uses BGR by default, but MesoNet expects RGB)
    normalized = cv2.cvtColor(normalized, cv2.COLOR_BGR2RGB)
    
    return resized, normalized

# Function to predict an image
def predict_image(image_array: np.ndarray) -> Dict:
    """
    WHAT IT DOES:
    1. Takes an image
    2. Sends it through MesoNet model
    3. Returns: REAL or FAKE + confidence score
    
    INPUT: Image array (from file upload)
    OUTPUT: {"label": "FAKE", "confidence": 0.92, "raw_prediction": 0.92}
    """
    # Step 0: Get (or load) the model
    model = get_mesonet_model()
    if model is None:
        return {
            "label": "UNKNOWN",
            "confidence": 0.0,
            "raw_prediction": None,
            "error": "MesoNet model not available"
        }
    
    # Step 1: Preprocess the image
    _, normalized = preprocess_image(image_array)
    
    # Step 2: Add batch dimension (model expects batches)
    # From shape (256, 256, 3) → (1, 256, 256, 3)
    img_batch = np.expand_dims(normalized, axis=0)
    
    # Step 3: Run prediction
    # Model outputs: 0 = REAL, 1 = FAKE
    prediction = model.predict(img_batch, verbose=0)[0][0]
    
    # Step 4: Calculate confidence (how sure is the model?)
    # If prediction is 0.90 → confidence is how far from 0.5 decision boundary
    if prediction > 0.5:
        confidence = prediction           # If saying FAKE (0.9), confidence = 0.9
    else:
        confidence = 1 - prediction       # If saying REAL (0.1), confidence = 0.9
    
    # Step 5: Convert to readable label
    label = "FAKE" if prediction > 0.5 else "REAL"
    
    return {
        "label": label,
        "confidence": float(confidence),
        "raw_prediction": float(prediction)
    }

# Function to extract video frames
def extract_video_frames(video_path: str, frame_skip: int = 5) -> List[np.ndarray]:
    """Extract every 5th frame from video (max 30 frames)"""
    frames = []
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise Exception("Could not open video file")
    
    frame_count = 0
    extracted_count = 0
    max_frames = 30
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_skip == 0 and extracted_count < max_frames:
                frames.append(frame)
                extracted_count += 1
            
            frame_count += 1
    finally:
        cap.release()
    
    if len(frames) == 0:
        raise Exception("No frames could be extracted from video")
    
    return frames

# Function to analyze video frames
def analyze_video_frames(frames: List[np.ndarray]) -> Dict:
    """
    WHAT IT DOES:
    1. Runs MesoNet on each frame
    2. Collects all predictions
    3. Averages them together
    4. Returns OVERALL verdict for entire video
    
    LOGIC:
    - If 70% of frames are FAKE → video is FAKE
    - If 30% of frames are FAKE → video is INCONCLUSIVE
    - If 0% of frames are FAKE → video is REAL
    
    INPUT: List of 30 frame arrays
    OUTPUT: {"label": "FAKE", "confidence": 0.88, "fake_frames": 25, "real_frames": 5}
    """
    frame_predictions = []
    
    # Analyze each frame
    for i, frame in enumerate(frames):
        try:
            pred = predict_image(frame)
            frame_predictions.append({
                "frame": i,
                "label": pred["label"],
                "confidence": pred["confidence"],
                "raw_prediction": pred["raw_prediction"]  # 0-1 score
            })
        except:
            continue  # Skip if frame analysis fails
    
    # Aggregate predictions
    # Example: [0.1, 0.9, 0.95, 0.05] → average = 0.50
    avg_prediction = np.mean([p["raw_prediction"] for p in frame_predictions])
    
    # Convert to confidence (distance from 0.5)
    confidence = avg_prediction if avg_prediction > 0.5 else 1 - avg_prediction
    
    # Convert to label
    label = "FAKE" if avg_prediction > 0.5 else "REAL"
    
    # Count frames
    fake_frames = sum(1 for p in frame_predictions if p["label"] == "FAKE")
    real_frames = sum(1 for p in frame_predictions if p["label"] == "REAL")
    fake_percentage = (fake_frames / len(frame_predictions)) * 100
    
    return {
        "label": label,
        "confidence": float(confidence),
        "avg_raw_prediction": float(avg_prediction),
        "total_frames_analyzed": len(frame_predictions),
        "fake_frames": fake_frames,
        "real_frames": real_frames,
        "fake_percentage": float(fake_percentage)
    }


@app.post("/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    """
    WHAT IT DOES:
    User uploads image file → Backend analyzes → Returns REAL/FAKE
    
    STEP BY STEP:
    1. Receive image file from user
    2. Convert file to numpy array
    3. Run predict_image() function
    4. Return JSON response
    
    EXAMPLE REQUEST:
    POST /analyze_image
    Content-Type: multipart/form-data
    body: [image.jpg file]
    
    EXAMPLE RESPONSE:
    {
        "filename": "photo.jpg",
        "label": "FAKE",
        "confidence": 0.94,
        "status": "success"
    }
    """
    try:
        # Step 1: Read uploaded file bytes
        contents = await file.read()
        
        # Step 2: Convert bytes to numpy array
        # np.frombuffer: convert bytes to array
        # np.uint8: 0-255 integer format (standard for images)
        nparr = np.frombuffer(contents, np.uint8)
        
        # Step 3: Decode image (jpg/png → pixel array)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise Exception("Could not decode image")
        
        # Step 4: Get prediction
        prediction = predict_image(img)
        
        # Step 5: Return result
        return {
            "filename": file.filename,
            "label": prediction["label"],
            "confidence": prediction["confidence"],
            "raw_prediction": prediction["raw_prediction"],
            "status": "success"
        }
    
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }


@app.post("/analyze_video")
async def analyze_video(file: UploadFile = File(...)):
    """
    WHAT IT DOES:
    User uploads video → Extract frames → Analyze each → Return verdict
    
    STEP BY STEP:
    1. Save uploaded video to temp file
    2. Extract frames using extract_video_frames()
    3. Analyze all frames using analyze_video_frames()
    4. Delete temp file
    5. Return results
    
    EXAMPLE RESPONSE:
    {
        "filename": "video.mp4",
        "label": "FAKE",
        "confidence": 0.87,
        "total_frames_analyzed": 30,
        "fake_frames": 23,
        "real_frames": 7,
        "fake_percentage": 76.7,
        "status": "success"
    }
    """
    try:
        # Step 1: Save video to temporary file
        # (Can't analyze from memory, need file path for cv2.VideoCapture)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        
        try:
            # Step 2: Extract frames from video
            print(f"Extracting frames from {file.filename}...")
            frames = extract_video_frames(tmp_path, frame_skip=5)
            print(f"Extracted {len(frames)} frames")
            
            # Step 3: Analyze all frames
            print(f"Analyzing frames...")
            result = analyze_video_frames(frames)
            
            # Step 4: Return results
            return {
                "filename": file.filename,
                "label": result["label"],
                "confidence": result["confidence"],
                "total_frames_analyzed": result["total_frames_analyzed"],
                "fake_frames": result["fake_frames"],
                "real_frames": result["real_frames"],
                "fake_percentage": result["fake_percentage"],
                "status": "success"
            }
        
        finally:
            # Step 5: Clean up temp file (important!)
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

@app.post("/analyze_combined")
async def analyze_combined(
    text: str = None,                    # Optional: text to analyze
    image_file: UploadFile = File(None), # Optional: image to analyze
    video_file: UploadFile = File(None)  # Optional: video to analyze
):
    """
    WHAT IT DOES: 
    🌟 THE MAIN FEATURE 🌟
    
    User can upload ANY COMBINATION:
    - Just text
    - Just image
    - Just video
    - Text + image
    - Text + video
    - Image + video
    - All three!
    
    Backend analyzes everything and returns COMBINED VERDICT
    
    VOTING LOGIC:
    - If 2 or more models say FAKE → "LIKELY FAKE ⚠️"
    - If 0 models say FAKE → "LIKELY REAL ✅"
    - If mixed → "INCONCLUSIVE ❓"
    
    EXAMPLE 1: User uploads text + video
    - RoBERTa says: FAKE (85% confidence)
    - MesoNet says: FAKE (90% confidence)
    → COMBINED: "LIKELY FAKE ⚠️" (2/2 models agree)
    
    EXAMPLE 2: User uploads text + video
    - RoBERTa says: REAL (75% confidence)
    - MesoNet says: FAKE (85% confidence)
    → COMBINED: "INCONCLUSIVE ❓" (1/2 agree)
    """
    
    results = {}
    
    # ===== ANALYZE TEXT (if provided) =====
    if text:
        try:
            # Use existing RoBERTa model
            prediction = predict_fake_news(text)
            results["text"] = {
                "is_fake": prediction["is_fake"],
                "confidence": prediction["confidence"],
                "explanation": prediction["explanation"],
                "status": "success"
            }
        except Exception as e:
            results["text"] = {
                "is_fake": False,
                "confidence": 0.0,
                "error": str(e),
                "status": "error"
            }
    
    # ===== ANALYZE IMAGE (if provided) =====
    if image_file:
        try:
            contents = await image_file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise Exception("Could not decode image")
            
            prediction = predict_image(img)
            results["image"] = {
                "label": prediction["label"],
                "confidence": prediction["confidence"],
                "raw_prediction": prediction["raw_prediction"],
                "status": "success"
            }
        except Exception as e:
            results["image"] = {
                "label": "ERROR",
                "confidence": 0.0,
                "error": str(e),
                "status": "error"
            }
    
    # ===== ANALYZE VIDEO (if provided) =====
    if video_file:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                contents = await video_file.read()
                tmp.write(contents)
                tmp_path = tmp.name
            
            try:
                frames = extract_video_frames(tmp_path, frame_skip=5)
                result = analyze_video_frames(frames)
                results["video"] = {
                    "label": result["label"],
                    "confidence": result["confidence"],
                    "total_frames_analyzed": result["total_frames_analyzed"],
                    "fake_frames": result["fake_frames"],
                    "real_frames": result["real_frames"],
                    "fake_percentage": result["fake_percentage"],
                    "status": "success"
                }
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        
        except Exception as e:
            results["video"] = {
                "label": "ERROR",
                "confidence": 0.0,
                "error": str(e),
                "status": "error"
            }
    
    # ===== CALCULATE COMBINED VERDICT =====
    
    # Collect all verdicts
    verdicts = []
    confidences = []
    
    # Count what each model says
    if "text" in results and results["text"]["status"] == "success":
        confid = results["text"]["confidence"]
        confidences.append(confid)
        # is_fake: True → "FAKE", False → "REAL"
        verdicts.append("FAKE" if results["text"]["is_fake"] else "REAL")
    
    if "image" in results and results["image"]["status"] == "success":
        confid = results["image"]["confidence"]
        confidences.append(confid)
        verdicts.append(results["image"]["label"])
    
    if "video" in results and results["video"]["status"] == "success":
        confid = results["video"]["confidence"]
        confidences.append(confid)
        verdicts.append(results["video"]["label"])
    
    # Apply voting logic
    fake_count = sum(1 for v in verdicts if v == "FAKE")
    total_models = len(verdicts)
    combined_confidence = np.mean(confidences) if confidences else 0.0
    
    # Decision rule
    if fake_count >= total_models / 2:
        combined_verdict = "🚨 LIKELY FAKE"
    elif fake_count == 0:
        combined_verdict = "✅ LIKELY REAL"
    else:
        combined_verdict = "❓ INCONCLUSIVE"
    
    # ===== RETURN RESPONSE =====
    return {
        "individual_results": results,
        "combined": {
            "verdict": combined_verdict,
            "combined_confidence": float(combined_confidence),
            "total_models_used": len(results),
            "models_detecting_fake": fake_count,
            "agreement": f"{fake_count}/{total_models} models detected FAKE",
            "recommendation": "HIGH CONFIDENCE - Take action!" if combined_confidence > 0.85 
                            else "LIKELY FAKE - Verify further" if fake_count > 0 
                            else "Appears authentic"
        },
        "status": "success" if len(results) > 0 else "error",
        "analysis_time_estimate": "10-15 seconds per video, <1 second for images/text"
    }


# Main entry point - Run the server
# Execute with: python app.py
# The server will start at http://localhost:8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

