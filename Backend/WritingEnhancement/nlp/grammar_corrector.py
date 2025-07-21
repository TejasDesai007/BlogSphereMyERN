from happytransformer import HappyTextToText

# Load once
happy_tt = HappyTextToText("T5", "vennify/t5-base-grammar-correction")

def correct_sentence(sentence: str):
    """
    Corrects grammar in the given sentence.
    """
    result = happy_tt.generate_text("grammar: " + sentence)
    return result.text.strip()
