"""
Download and cache RoBERTa model for fake news detection.
This ensures models are available on deployment platforms like Render.
"""

import os
import sys
from pathlib import Path
from transformers import RobertaTokenizer, RobertaForSequenceClassification

def download_and_cache_models():
    """Download RoBERTa model from HuggingFace and cache locally."""
    
    model_name = "roberta-base"
    model_dir = os.path.join(os.path.dirname(__file__), 'models', 'roberta_fake_news_model')
    
    # Check if models are already cached
    if os.path.exists(model_dir):
        config_path = os.path.join(model_dir, 'config.json')
        if os.path.exists(config_path):
            print(f"✅ Models already cached at: {model_dir}")
            return True
    
    print(f"📥 Downloading RoBERTa model...")
    print(f"   This is a one-time process (~500MB)")
    print(f"   Saving to: {model_dir}")
    
    try:
        # Create directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)
        
        # Download and save tokenizer
        print("📥 Downloading tokenizer...")
        tokenizer = RobertaTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(model_dir)
        print("✅ Tokenizer saved")
        
        # Download and save model
        print("📥 Downloading model (this may take a few minutes)...")
        model = RobertaForSequenceClassification.from_pretrained(model_name, num_labels=2)
        model.save_pretrained(model_dir)
        print("✅ Model saved")
        
        print(f"✅ Models successfully cached at: {model_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Error downloading models: {e}")
        print("ℹ️  Backend will run in DEMO mode without the model")
        return False

if __name__ == "__main__":
    success = download_and_cache_models()
    sys.exit(0 if success else 1)
