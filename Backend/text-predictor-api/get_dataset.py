import pandas as pd
import re
import os

# Load the CSV file
print("📂 Loading blogtext.csv...")
df = pd.read_csv("data/blogtext.csv", encoding="latin1")  # Adjust encoding if needed

# Inspect which column contains the blog content
print("🧾 Columns in dataset:", df.columns)

# Assuming 'text' column contains blog content
print("🔍 Extracting blog content...")
texts = df["text"].dropna().astype(str).tolist()

def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)  # Remove URLs
    text = re.sub(r"www\S+", "", text)   # Remove URLs
    text = re.sub(r"@\w+", "", text)     # Remove mentions
    text = re.sub(r"#\w+", "", text)     # Remove hashtags
    text = re.sub(r"[^\w\s]", "", text)  # Remove punctuation
    text = re.sub(r"\s+", " ", text).strip()  # Remove extra spaces
    return text

print("🧹 Cleaning text...")
cleaned_texts = [clean_text(t) for t in texts]

# Save the cleaned blog content line by line
os.makedirs("data", exist_ok=True)
with open("data/cleaned_blogtext.txt", "w", encoding="utf-8") as f:
    for line in cleaned_texts:
        f.write(line + "\n")

print("✅ Cleaned blog content saved to data/cleaned_blogtext.txt")
