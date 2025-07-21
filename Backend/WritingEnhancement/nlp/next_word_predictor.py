from transformers import pipeline

# Load GPT-2 once
generator = pipeline("text-generation", model="gpt2")

def predict_next_words(prompt: str, max_words=5):
    """
    Predicts the next few words after a given prompt.
    """
    result = generator(prompt, max_length=len(prompt.split()) + max_words, num_return_sequences=1, do_sample=True)
    full_text = result[0]["generated_text"]
    # Return only the predicted part (after the original prompt)
    predicted_part = full_text[len(prompt):].strip()
    return predicted_part.split()[:max_words]
