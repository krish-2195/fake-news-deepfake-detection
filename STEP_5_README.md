# Step 5: Image Deepfake Detection with MesoNet

## Overview

This step trains a **MesoNet** model to detect deepfake images extracted from the 59 FaceForensics++ videos you downloaded earlier.

**Dataset:**
- ✅ 7,785 training deepfakes + 7,785 training real faces
- ✅ 1,947 validation deepfakes + 1,947 validation real faces
- ✅ Total: 19,464 training + test images

---

## Files in This Step

### 1. **Step5_MesoNet_Training.ipynb**
Jupyter notebook for training MesoNet in Google Colab

**What it does:**
- Creates and compiles MesoNet architecture
- Trains on your FaceForensics dataset
- Evaluates performance (accuracy, precision, recall, AUC)
- Saves trained model as `.h5` file

**How to use:**
1. Upload notebook to Google Colab
2. Update data paths to point to your training data
3. Run all cells
4. Download the trained `mesonet_deepfake_detector.h5` file

---

### 2. **mesonet_backend.py**
Python module for integrating MesoNet into your FastAPI backend

**Key functions:**
- `analyze_image_deepfake()` - Predict if image is real or fake
- `preprocess_image()` - Prepare image for model
- `batch_analyze_images()` - Process multiple images

---

## Getting Your Data Ready

### Step 1: Organize Training Data
Your data should already be organized in this structure:
```
C:\Users\Krish\Downloads\CelebDF\
├── train/
│   ├── real/          (7,785 images)
│   └── fake/          (7,785 images)
├── validation/
│   ├── real/          (1,947 images)
│   └── fake/          (1,947 images)
└── frames/            (all 10,232 images)
```

This was created by running:
```powershell
python organize_for_mesonet.py
```

---

## Training Instructions

### Method 1: Google Colab (Recommended - Free GPU)

**Best for:** Getting results fastest without local GPU

**Steps:**
1. Open Google Colab: https://colab.research.google.com
2. Create new notebook or upload `Step5_MesoNet_Training.ipynb`
3. Mount your Google Drive:
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
4. Upload your training data to Google Drive:
   ```
   MyDrive/CelebDF/train/  (and validation/)
   ```
5. Update paths in notebook cells:
   ```python
   TRAIN_DIR = '/content/drive/MyDrive/CelebDF/train'
   VAL_DIR = '/content/drive/MyDrive/CelebDF/validation'
   ```
6. Run all cells
7. Download these files after training:
   - `mesonet_deepfake_detector.h5` (trained model)
   - `mesonet_model_info.json` (metadata)
   - `mesonet_training_history.png` (graphs)

**Training time:** ~30-45 minutes (on Colab GPU)

---

### Method 2: Local Training (Windows)

**Best for:** Full control, iterative development

**Steps:**

1. **Set up environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   pip install tensorflow opencv-python pillow scikit-learn matplotlib
   ```

2. **Create local training script:**
   ```python
   # train_mesonet_local.py
   from Step5_MesoNet_Training import create_mesonet
   # ... (see full script below)
   ```

3. **Run training:**
   ```powershell
   python train_mesonet_local.py
   ```

**Training time:** 2-4 hours (without GPU, or 15-30 min with NVIDIA GPU)

---

## Integration with FastAPI Backend

### Step 1: Copy Trained Model
1. Download `mesonet_deepfake_detector.h5` from Colab/training
2. Place in your project root or models folder

### Step 2: Add to app.py
```python
from fastapi import FastAPI, File, UploadFile
from mesonet_backend import analyze_image_deepfake, MODEL_LOADED

app = FastAPI()

@app.post("/analyze_image")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze image for deepfakes using MesoNet"""
    if not MODEL_LOADED:
        return {"error": "Model not loaded", "status": 500}
    
    contents = await file.read()
    result = analyze_image_deepfake(contents)
    return result
```

### Step 3: Test the Endpoint
```bash
# Using curl
curl -X POST http://localhost:8000/analyze_image \
  -F "file=@test_image.jpg"

# Expected response:
# {
#   "label": "FAKE",
#   "confidence": 0.895,
#   "raw_prediction": 0.895,
#   "model": "MesoNet",
#   "status": "success"
# }
```

---

## Integration with React Frontend

### Add Image Upload Component
```jsx
// components/ImageDeepfakeAnalyzer.jsx
import React, { useState } from 'react';

export default function ImageDeepfakeAnalyzer() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze_image', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
      setImage(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-analyzer">
      <h2>Image Deepfake Detector</h2>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
      />
      
      {image && <img src={image} alt="Uploaded" style={{maxWidth: '300px'}} />}
      
      {loading && <p>Analyzing...</p>}
      
      {result && (
        <div className="result">
          <p>Verdict: <strong>{result.label}</strong></p>
          <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## Model Performance

### Expected Results on FaceForensics++ Data
- **Accuracy:** 85-92%
- **Precision:** 87-94% (false positives)
- **Recall:** 83-89% (false negatives)
- **AUC:** 0.90-0.96

**Performance varies based on:**
- Number of training epochs
- Batch size used
- Image quality in dataset
- Model regularization (dropout rate)

---

## MesoNet Architecture Details

### Design
- Specifically designed for deepfake detection
- Lightweight (25K parameters)
- Fast inference (~10ms per image)
- Focuses on artifact detection

### Key Features
- Detects compression artifacts
- Identifies blurring patterns
- Catches face warping artifacts
- Works on small image patches

### Comparison
| Model | Params | Speed | Accuracy | Best For |
|-------|--------|-------|----------|----------|
| MesoNet | 25K | Very Fast | 90%+ | Deepfake specialist |
| EfficientNet-B0 | 5.3M | Fast | 92%+ | General purpose |
| ResNet-50 | 25M | Slower | 93%+ | High accuracy needed |

---

## Troubleshooting

### Model Not Loading
```
ERROR: mesonet_deepfake_detector.h5 not found
```
**Solution:** Download the trained model file from Google Drive and place in project root

### CUDA/GPU Errors
```
ERROR: Could not load dynamic library 'cudart64_110.dll'
```
**Solution:** Set `CUDA_VISIBLE_DEVICES` to CPU-only:
```python
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
```

### Out of Memory
**Solution:** Reduce batch size in training:
```python
BATCH_SIZE = 16  # Instead of 32
```

### Poor Accuracy
**Solution:** Try these improvements:
1. Increase epochs: `EPOCHS = 50` (instead of 30)
2. Use data augmentation (already enabled)
3. Add more training data (download more FaceForensics videos)
4. Fine-tune learning rate: `lr=0.0005`

---

## Next Steps

### Step 6: Video Deepfake Detection
- Use same frames from multiple consecutive video frames
- Apply temporal CNN networks
- Combine image predictions across video timeline

### Step 7: Combined Analysis
- Merge text analysis (Step 4)
- Merge image analysis (Step 5)
- Merge video analysis (Step 6)
- Create unified deepfake detection score

---

## Additional Resources

- **MesoNet Paper:** "MesoNet: a Compact Facial Video Forgery Detection Network"
- **FaceForensics++:** https://github.com/ondyari/FaceForensics
- **TensorFlow Training:** https://www.tensorflow.org/tutorials
- **Deepfake Detection Literature:** State-of-the-art detection methods

---

## Summary Checklist

- [ ] Data organized into train/validation folders
- [ ] Notebook created: `Step5_MesoNet_Training.ipynb`
- [ ] Backend module created: `mesonet_backend.py`
- [ ] Model trained and downloaded from Colab
- [ ] Model integrated into `/analyze_image` endpoint
- [ ] ImageDeepfakeAnalyzer component added to React frontend
- [ ] End-to-end testing completed
- [ ] Ready for Step 6 (Video Deepfake Detection)

---

**Step 5 Complete! ✅ You now have image deepfake detection in your system.**

Next: Proceed to Step 6 for video deepfake detection using temporal analysis.
