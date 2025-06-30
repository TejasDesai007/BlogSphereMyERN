# train_rnn.py

from keras.preprocessing.text import Tokenizer
from keras.utils import pad_sequences, to_categorical
from keras.models import Sequential
from keras.layers import Embedding, LSTM, Dense
import numpy as np
import pickle

# 1. Sample Data
data = """i love writing code in javascript and building full stack applications using react node express and mongo"""

# 2. Tokenization
tokenizer = Tokenizer()
tokenizer.fit_on_texts([data])
total_words = len(tokenizer.word_index) + 1

# 3. Create Input Sequences
input_sequences = []
words = data.split()
for i in range(1, len(words)):
    n_gram_sequence = words[:i+1]
    token_list = tokenizer.texts_to_sequences([' '.join(n_gram_sequence)])[0]
    input_sequences.append(token_list)

# 4. Padding
max_seq_len = max(len(x) for x in input_sequences)
input_sequences = pad_sequences(input_sequences, maxlen=max_seq_len, padding='pre')

# 5. Split input and labels
X = input_sequences[:, :-1]
y = input_sequences[:, -1]
y = to_categorical(y, num_classes=total_words)

# 6. Build the Model
model = Sequential()
model.add(Embedding(total_words, 10, input_length=max_seq_len - 1))
model.add(LSTM(100))
model.add(Dense(total_words, activation='softmax'))

model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
model.fit(X, y, epochs=100, verbose=1)

# 7. Save model and tokenizer
model.save("../backend/text-predictor-api/text_predictor_rnn.h5")
with open("../backend/text-predictor-api/tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

print("✅ Model and tokenizer saved!")
