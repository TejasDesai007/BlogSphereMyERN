from flask import Flask, request, jsonify
from nlp.spell_corrector import correct_word
from nlp.next_word_predictor import predict_next_words
from nlp.grammar_corrector import correct_sentence

from flask_cors import CORS  # Optional, for frontend access

app = Flask(__name__)
CORS(app)  # Remove if not needed

@app.route('/')
def home():
    return jsonify({"message": "Writing Enhancement API is running."})

# ---------- Spellcheck ----------
@app.route('/api/spellcheck')
def spellcheck():
    word = request.args.get("word", "")
    if not word:
        return jsonify({"error": "Missing word parameter"}), 400
    correction, suggestions = correct_word(word)
    return jsonify({
        "correction": correction,
        "suggestions": suggestions
    })

# ---------- Next Word Prediction ----------
@app.route('/api/next-word')
def next_word():
    context = request.args.get("context", "")
    if not context:
        return jsonify({"error": "Missing context parameter"}), 400
    suggestions = predict_next_words(context)
    return jsonify({
        "suggestions": suggestions
    })

# ---------- Grammar Correction ----------
@app.route('/api/grammar', methods=["POST"])
def grammar():
    data = request.get_json()
    sentence = data.get("sentence", "")
    if not sentence:
        return jsonify({"error": "Missing sentence in request body"}), 400
    corrected = correct_sentence(sentence)
    return jsonify({
        "corrected": corrected
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
