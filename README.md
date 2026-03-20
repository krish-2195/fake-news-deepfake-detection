# 🔍 Fake News & Deepfake Detection System

An AI-powered system to detect fake news articles and deepfake videos using machine learning models.

## 🎯 Features

- **📝 Text Analysis**: Detect fake news using RoBERTa NLP model
- **🖼️ Image Analysis**: Identify deepfake faces using MesoNet
- **🎬 Video Analysis**: Detect deepfake videos frame-by-frame
- **⚡ Fast & Accurate**: Real-time detection with high confidence scores
- **🎨 User-Friendly**: Interactive web interface

## 🚀 Live Demo

**Frontend:** https://fake-news-frontend.onrender.com  
**Backend API:** https://fake-news-backend.onrender.com

## 📋 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Text Model**: RoBERTa (transformers)
- **Image/Video Model**: MesoNet (TensorFlow/Keras)
- **Database**: Support for future integrations

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

## 📁 Project Structure

```
.
├── Backend/
│   ├── app.py              # FastAPI server
│   ├── models.py           # ML model loading
│   ├── requirements.txt    # Python dependencies
│   └── models/             # Trained models
├── forntend/
│   ├── app/
│   │   └── page.tsx        # Main UI component
│   ├── package.json        # Node dependencies
│   └── public/             # Static assets
├── LICENSE                 # MIT License
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## ⚙️ Installation

### Prerequisites
- Python 3.11+
- Node.js 16+
- Git

### Backend Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:8000`

### Frontend Setup

```bash
cd forntend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

## 📊 API Endpoints

### Text Analysis
```
POST /analyze_text?text=<input_text>
Response: {
  "text": "...",
  "is_fake": boolean,
  "confidence": float,
  "explanation": "..."
}
```

### Image Analysis
```
POST /analyze_image
Form: file (image file)
Response: {
  "label": "REAL/FAKE",
  "confidence": float,
  "model": "MesoNet"
}
```

### Video Analysis
```
POST /analyze_video
Form: file (video file)
Response: {
  "total_frames": int,
  "fake_frames": int,
  "fake_percentage": float,
  "verdict": "REAL/FAKE/SUSPICIOUS"
}
```

## ⚠️ Model Limitations

**Important Notes:**
- Text model trained primarily on synthetic data
- May have higher false-positive rate on real-world news
- Deepfake detection works best on obvious manipulations
- Continuously improving with more real-world data

## 🔄 Future Improvements (v2)

- [ ] Fine-tune models on real-world datasets
- [ ] Add user feedback collection system
- [ ] Ensemble multiple detection models
- [ ] Improve performance on Indian news sources
- [ ] Add detailed analysis reports
- [ ] Multi-language support

## 👨‍💻 Usage

1. Open `http://localhost:3000`
2. Choose analysis type (Text/Image/Video)
3. Upload content
4. Get AI-powered detection result

## 📈 Performance

| Model | Accuracy | Speed |
|-------|----------|-------|
| RoBERTa (Text) | ~92% | <100ms |
| MesoNet (Image) | ~87% | <500ms |
| MesoNet (Video) | ~82% | ~1s per frame |

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📧 Contact

- GitHub: [@krish-2195](https://github.com/krish-2195)
- Project: Fake News & Deepfake Detection System

## 🙏 Acknowledgments

- RoBERTa model from Hugging Face
- MesoNet from FaceForensics++ dataset
- FastAPI documentation
- Next.js community

---

**Note**: This is an educational project. Always verify information from multiple reliable sources.
