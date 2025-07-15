from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

app = Flask(__name__)
CORS(app)

# Load tokenizer and model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "models", "tokenizer.pkl"), "rb") as f:
    tokenizer = pickle.load(f)

model = tf.keras.models.load_model(os.path.join(BASE_DIR, "models", "final_model.h5"))

max_seq_len = 50
TOTAL_WORDS = len(tokenizer.word_index) + 1

def predict_next_word(seed_text):
    """Predict only the next word based on the seed text"""
    try:
        # Tokenize the input text
        token_list = tokenizer.texts_to_sequences([seed_text])[0]
        
        # Pad the sequence
        token_list = pad_sequences([token_list], maxlen=max_seq_len - 1, padding='pre')
        
        # Get prediction probabilities
        predicted = model.predict(token_list, verbose=0)
        
        # Get the most likely next word
        predicted_index = np.argmax(predicted)
        
        # Handle case where model predicts unknown token
        if predicted_index == 0:
            return None
            
        # Find the word corresponding to the predicted index
        for word, index in tokenizer.word_index.items():
            if index == predicted_index:
                return word
                
        return None
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return None

@app.route("/generate", methods=["POST"])
def generate_next_word():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        input_text = data.get("text", "").strip()
        
        # Log the input
        print(f"\nReceived text: '{input_text}'")
        
        if not input_text:
            print("Error: Input text is missing or empty.")
            return jsonify({"error": "Input text is required"}), 400
        
        # Get the predicted next word
        next_word = predict_next_word(input_text)
        
        if next_word:
            print(f"Predicted next word: '{next_word}'")
            response = {"next_word": next_word}
        else:
            print("No prediction available")
            response = {"next_word": ""}
            
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in generate_next_word: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == "__main__":
    print("Starting Flask server...")
    print(f"Model loaded: {model is not None}")
    print(f"Tokenizer loaded: {tokenizer is not None}")
    print(f"Vocabulary size: {TOTAL_WORDS}")
    app.run(host="0.0.0.0", port=5002, debug=True)