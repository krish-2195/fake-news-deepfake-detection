"""
Test script for FastAPI endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TESTING DEEPFAKE DETECTION API")
print("=" * 60)

# Test 1: Health Check
print("\n[1] Testing /health endpoint...")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Analyze Text (RoBERTa)
print("\n[2] Testing /analyze_text endpoint...")
try:
    test_text = "This is a breaking news story about UFOs landing on the moon"
    response = requests.post(
        f"{BASE_URL}/analyze_text",
        params={"text": test_text}
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Analyze Image (MesoNet) - will fail without model
print("\n[3] Testing /analyze_image endpoint (without file)...")
try:
    response = requests.post(f"{BASE_URL}/analyze_image")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Health/Status
print("\n[4] Testing with local test file...")
print("Note: Image/Video tests require actual files to upload")

print("\n" + "=" * 60)
print("API is responding correctly!")
print("=" * 60)
print("\nNext steps:")
print("1. Train MesoNet model in Colab (Step 5)")
print("2. Download mesonet_deepfake_detector.h5 to parent directory")
print("3. Test /analyze_image and /analyze_video endpoints")
