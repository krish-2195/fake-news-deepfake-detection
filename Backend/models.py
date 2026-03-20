# Import necessary libraries for loading and using the RoBERTa model
from transformers import RobertaTokenizer, RobertaForSequenceClassification
import torch
import os

# Define the path to the trained model folder
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'roberta_fake_news_model')

# Global variables to store tokenizer and model (loaded once at startup)
tokenizer = None
model = None

def load_model():
    """
    Load the RoBERTa model and tokenizer from disk.
    Only loads once - subsequent calls return cached versions.
    """
    global tokenizer, model
    
    # If already loaded, return existing instances
    if tokenizer is None or model is None:
        print(f"Loading RoBERTa model from {MODEL_PATH}...")
        
        # Load tokenizer (converts text to tokens)
        tokenizer = RobertaTokenizer.from_pretrained(MODEL_PATH)
        
        # Load trained model (fine-tuned on fake news dataset)
        model = RobertaForSequenceClassification.from_pretrained(MODEL_PATH)
        
        # Set model to evaluation mode (disable dropout, batch norm, etc.)
        model.eval()
        
        print("Model loaded successfully!")
    
    return tokenizer, model

def predict_fake_news(text: str) -> dict:
    """
    Predict if text is fake or real using the trained RoBERTa model.
    
    Args:
        text (str): The news text to analyze
    
    Returns:
        dict: Contains:
            - 'is_fake' (bool): True if predicted as fake, False if real
            - 'confidence' (float): Confidence score (0-1, where 1 = 100% confident)
            - 'explanation' (str): Human-readable explanation of the prediction
    """
    
    # Load model and tokenizer
    tokenizer, model = load_model()
    
    # Tokenize the input text
    # Converts text into token IDs that the model understands
    inputs = tokenizer(
        text,
        max_length=128,        # Maximum sequence length
        truncation=True,       # Truncate if text is longer than 128 tokens
        padding=True,          # Pad if text is shorter than 128 tokens
        return_tensors='pt'    # Return PyTorch tensors
    )
    
    # Get prediction from the model
    # Use torch.no_grad() to disable backprop (we're only inferencing, not training)
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Extract logits (raw, unnormalized scores from the model)
    logits = outputs.logits[0]  # [0] gets the first (and only) sample in batch
    
    # Convert logits to probabilities using softmax (0-1 range)
    probabilities = torch.softmax(logits, dim=0)
    
    # Get the predicted class (0 = fake, 1 = real)
    predicted_class = torch.argmax(logits).item()
    
    # Get the confidence score (probability of predicted class)
    confidence = probabilities[predicted_class].item()
    
    # Determine if fake (class 0 = fake, class 1 = real)
    is_fake = (predicted_class == 0)
    
    # Create human-readable explanation
    if is_fake:
        explanation = f"Model predicts this is FAKE news with {confidence*100:.1f}% confidence. Be skeptical of this content."
    else:
        explanation = f"Model predicts this is REAL news with {confidence*100:.1f}% confidence. This appears to be legitimate."
    
    # Return prediction results
    return {
        "is_fake": is_fake,
        "confidence": confidence,
        "explanation": explanation
    }
