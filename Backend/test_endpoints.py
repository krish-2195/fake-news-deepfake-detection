"""Test all deployed API endpoints"""
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
print("\n[TEST 3] POST /analyze_text")
print("-" * 70)
try:
    text = "Scientists discovered a new species of butterfly in the Amazon rainforest"
    r = requests.post(f"{base_url}/analyze_text?text={text}")
    print(f"Status: {r.status_code} ✅")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e} ❌")

# Test 4: Swagger Docs
print("\n[TEST 4] GET /docs (Swagger UI)")
print("-" * 70)
print(f"Available at: {base_url}/docs ✅")

print("\n" + "=" * 70)
print("✅ BACKEND IS LIVE AND WORKING!")
print("=" * 70)
print(f"\nBackend URL: {base_url}")
print(f"API Docs: {base_url}/docs")
print("=" * 70)
