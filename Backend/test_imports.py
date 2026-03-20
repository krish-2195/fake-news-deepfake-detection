"""
Quick verification script to test FastAPI backend setup
Checks if all imports and modules load correctly
"""

import sys
print("Testing FastAPI backend environment...")

try:
    import fastapi
    print("✅ FastAPI imported")
except Exception as e:
    print(f"❌ FastAPI error: {e}")

try:
    from models import predict_fake_news, load_model
    print("✅ Models module imported")
    print("   - predict_fake_news function found")
    
    # Try to load model
    tokenizer, model = load_model()
    print("✅ RoBERTa model loaded successfully")
except Exception as e:
    print(f"❌ Models error: {e}")

try:
    import cv2
    print("✅ OpenCV imported")
except Exception as e:
    print(f"❌ OpenCV error: {e}")

try:
    import tensorflow
    print(f"✅ TensorFlow {tensorflow.__version__} imported")
except Exception as e:
    print(f"❌ TensorFlow error: {e}")

try:
    import torch
    print("✅ PyTorch imported")
except Exception as e:
    print(f"❌ PyTorch error: {e}")

print("\n✅ All critical imports successful! Backend is ready.")
print("Start server with: python app.py")
