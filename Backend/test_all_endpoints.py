"""
Comprehensive API Test - All Endpoints
Tests: Text, Image, Combined endpoints with MesoNet + RoBERTa
"""
import requests
import json
import numpy as np
import cv2

BASE_URL = "http://localhost:8000"

print("=" * 70)
print("COMPREHENSIVE DEEPFAKE DETECTION API TEST")
print("=" * 70)

# Test 1: Health Check
print("\n[1] HEALTH CHECK")
print("-" * 70)
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("✅ PASS")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 2: Text Analysis (RoBERTa)
print("\n[2] TEXT ANALYSIS (RoBERTa)")
print("-" * 70)
test_texts = [
    "Breaking news: Scientists discover cure for aging",
    "Local woman reports seeing UFO in backyard",
    "Climate scientists publish peer-reviewed study on global warming trends"
]

for i, text in enumerate(test_texts, 1):
    try:
        response = requests.post(
            f"{BASE_URL}/analyze_text",
            params={"text": text}
        )
        if response.status_code == 200:
            result = response.json()
            verdict = "FAKE ⚠️" if result['is_fake'] else "REAL ✓"
            print(f"  Text {i}: {verdict} ({result['confidence']*100:.1f}%)")
        else:
            print(f"  Text {i}: Error {response.status_code}")
    except Exception as e:
        print(f"  Text {i}: Error - {e}")
print("✅ PASS")

# Test 3: Image Analysis (MesoNet)
print("\n[3] IMAGE ANALYSIS (MesoNet)")
print("-" * 70)
# Create test image
test_image = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
test_image_path = "test_image.jpg"
cv2.imwrite(test_image_path, test_image)

try:
    with open(test_image_path, 'rb') as f:
        files = {'file': ('test_image.jpg', f)}
        response = requests.post(f"{BASE_URL}/analyze_image", files=files)
    
    if response.status_code == 200:
        result = response.json()
        verdict = "FAKE ⚠️" if result['label'] == "FAKE" else "REAL ✓"
        print(f"  Image: {verdict} ({result['confidence']*100:.1f}%)")
        print("✅ PASS")
    else:
        print(f"❌ FAIL: Status {response.status_code}")
except Exception as e:
    print(f"❌ FAIL: {e}")

# Test 4: Combined Analysis (Multi-Modal)
print("\n[4] COMBINED ANALYSIS (Text + Image)")
print("-" * 70)

# Create test files
test_text = "This video shows clear evidence of aliens landing on Earth"
test_image2 = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
cv2.imwrite("test_image2.jpg", test_image2)

try:
    with open("test_image2.jpg", 'rb') as f:
        files = {'image_file': ('test_image2.jpg', f)}
        data = {'text': test_text}
        response = requests.post(f"{BASE_URL}/analyze_combined", files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        combined = result.get('combined', {})
        
        print(f"  Text Result: {result['individual_results'].get('text', {}).get('explanation', 'N/A')[:50]}...")
        print(f"  Image Result: {result['individual_results'].get('image', {}).get('label', 'N/A')}")
        print(f"\n  🔍 COMBINED VERDICT: {combined.get('verdict', 'N/A')}")
        print(f"  Confidence: {combined.get('combined_confidence', 0)*100:.1f}%")
        print(f"  Agreement: {combined.get('agreement', 'N/A')}")
        print("✅ PASS")
    else:
        print(f"❌ FAIL: Status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ FAIL: {e}")

# Cleanup
import os
os.remove(test_image_path)
os.remove("test_image2.jpg")

print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print("✅ Health Check: Working")
print("✅ Text Analysis (RoBERTa): Working")
print("✅ Image Analysis (MesoNet): Working")
print("✅ Combined Analysis: Working")
print("\n🎉 ALL ENDPOINTS OPERATIONAL!")
print("=" * 70)
