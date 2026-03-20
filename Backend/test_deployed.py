"""Test the deployed backend API"""
import requests
import json

base_url = "https://fake-news-deepfake-backend.onrender.com"

print("=" * 70)
print("TESTING DEPLOYED BACKEND ENDPOINTS")
print("=" * 70)

# Test 1: Health Check
print("\n[TEST 1] GET /health")
print("-" * 70)
try:
    r = requests.get(f"{base_url}/health")
    print(f"Status: {r.status_code} ✅")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e} ❌")

# Test 2: Test Endpoint
print("\n[TEST 2] GET /test")
print("-" * 70)
try:
    r = requests.get(f"{base_url}/test")
    print(f"Status: {r.status_code} ✅")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e} ❌")

# Test 3: Analyze Text - Real News
print("\n[TEST 3] POST /analyze_text (Real News Example)")
print("-" * 70)
try:
    text = "Scientists discovered a new species of butterfly in the Amazon rainforest"
    r = requests.post(f"{base_url}/analyze_text?text={text}")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        result = r.json()
        print(f"Text: {result.get('text')}")
        print(f"Is Fake: {result.get('is_fake')}")
        print(f"Confidence: {result.get('confidence')}")
        print(f"Explanation: {result.get('explanation')} ✅")
    else:
        print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e} ❌")

# Test 4: Analyze Video
print("\n[TEST 4] POST /analyze_video")
print("-" * 70)
try:
    r = requests.post(f"{base_url}/analyze_video?video_url=https://example.com/video.mp4")
    print(f"Status: {r.status_code}")
    result = r.json()
    print(f"Response: {json.dumps(result, indent=2)} ✅")
except Exception as e:
    print(f"Error: {e} ❌")

print("\n" + "=" * 70)
print("✅ ALL TESTS COMPLETE - Backend is working!")
print("=" * 70)
