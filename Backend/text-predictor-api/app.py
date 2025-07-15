from flask import Flask, request, jsonify
from flask_cors import CORS  # ⬅️ Add this
import tensorflow as tf
import numpy as np
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os


app = Flask(__name__)
CORS(app)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load tokenizer using pickle
with open(os.path.join(BASE_DIR, "tokenizer.pkl"), "rb") as f:
    tokenizer = pickle.load(f)

# Load Keras model using tf.keras
model = tf.keras.models.load_model(os.path.join(BASE_DIR, "model.h5"))

@app.route("/predict", methods=["POST"])
def predict():
    print("\n===== /predict endpoint hit =====")

    data = request.get_json()
    print("Received JSON data:", data)

    input_text = data.get("text", "")
    print("Input text:", input_text)

    if not input_text:
        print("❌ No input text provided.")
        return jsonify({"error": "No input text provided"}), 400

    try:
        # Convert input to sequence
        sequence = tokenizer.texts_to_sequences([input_text])[0]
        print("Tokenized sequence:", sequence)

        padded = pad_sequences([sequence], maxlen=20, padding='pre')
        print("Padded sequence:", padded)

        # Predict the next word
        prediction = model.predict(padded)[0]
        print("Prediction array:", prediction)

        predicted_index = int(np.argmax(prediction))
        print("Predicted index:", predicted_index)

        # Map index to word
        word = None
        for w, i in tokenizer.word_index.items():
            if i == predicted_index:
                word = w
                break

        print("Predicted next word:", word)

        return jsonify({"next_word": word})
    except Exception as e:
        print("❌ Error during prediction:", str(e))
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
