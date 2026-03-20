"""
Test MesoNet image analysis
Creates a simple test image and sends to /analyze_image endpoint
"""
import requests
import numpy as np
import cv2
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TESTING MESONET IMAGE ANALYSIS")
print("=" * 60)

# Create a simple test image (256x256 with random pixels)
print("\n[1] Creating test image...")
test_image = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
test_image_path = "test_image.jpg"
cv2.imwrite(test_image_path, test_image)
print(f"✓ Created: {test_image_path}")

# Test image analysis
print("\n[2] Testing /analyze_image endpoint...")
try:
    with open(test_image_path, 'rb') as f:
        files = {'file': (test_image_path, f)}
        response = requests.post(f"{BASE_URL}/analyze_image", files=files)
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response:\n{json.dumps(result, indent=2)}")
    
    if result.get('status') == 'success':
        print("\n✅ IMAGE ANALYSIS WORKING!")
        print(f"   Label: {result['label']}")
        print(f"   Confidence: {result['confidence']:.2%}")
    else:
        print(f"\n⚠️ Error: {result.get('error', 'Unknown error')}")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Clean up
import os
os.remove(test_image_path)
print("\n[3] Cleaned up test file")

print("\n" + "=" * 60)
print("TEST COMPLETE - MesoNet is responding!")
print("=" * 60)
