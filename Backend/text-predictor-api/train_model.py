import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle

# Paths
DATA_PATH = "data/cleaned_blogtext.txt"
MODEL_DIR = "models"
CHECKPOINT_PATH = os.path.join(MODEL_DIR, "checkpoint_model.h5")
FINAL_MODEL_PATH = os.path.join(MODEL_DIR, "final_model.h5")
TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.pkl")

# Create model directory
os.makedirs(MODEL_DIR, exist_ok=True)

# Step 1: Load cleaned blog posts
print("📄 Loading cleaned text...")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    corpus = f.read().lower().split("\n")
print(f"✅ Loaded {len(corpus)} blog posts.")

# Step 2: Tokenization
print("🔤 Tokenizing text...")
tokenizer = Tokenizer()
tokenizer.fit_on_texts(corpus)
total_words = len(tokenizer.word_index) + 1

# Step 3: Generate input sequences using n-grams
print("🧱 Creating input sequences...")
input_sequences = []
for line in corpus:
    token_list = tokenizer.texts_to_sequences([line])[0]
    if len(token_list) < 3 or len(token_list) > 100:
        continue
    for i in range(1, len(token_list)):
        n_gram_seq = token_list[:i + 1]
        input_sequences.append(n_gram_seq)

print(f"🧾 Total sequences: {len(input_sequences)}")

# Step 4: Padding
print("🧩 Padding sequences...")
max_seq_len = 50
sequences = pad_sequences(input_sequences, maxlen=max_seq_len, padding='pre')
X = sequences[:, :-1]
y = sequences[:, -1]

print("🔍 Sanity check: X shape =", X.shape, ", y shape =", y.shape)

# Step 5: Build or load model
def build_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Embedding(total_words, 64, input_length=max_seq_len - 1),
        tf.keras.layers.LSTM(128),
        tf.keras.layers.Dense(total_words, activation='softmax')
    ])
    model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model

if os.path.exists(CHECKPOINT_PATH):
    print("♻️ Loading model from checkpoint...")
    model = tf.keras.models.load_model(CHECKPOINT_PATH)
else:
    print("⚙️ Building new model...")
    model = build_model()

# Step 6: Training with checkpoints
checkpoint_cb = tf.keras.callbacks.ModelCheckpoint(
    CHECKPOINT_PATH,
    save_best_only=False,
    save_weights_only=False,
    verbose=1
)

print("🚀 Training the model...")
model.fit(X, y, epochs=20, callbacks=[checkpoint_cb], verbose=1)

# Step 7: Save final model and tokenizer
print("💾 Saving final model and tokenizer...")
model.save(FINAL_MODEL_PATH)
with open(TOKENIZER_PATH, "wb") as f:
    pickle.dump(tokenizer, f)

print("✅ Training complete. Model and tokenizer saved to /models/")
