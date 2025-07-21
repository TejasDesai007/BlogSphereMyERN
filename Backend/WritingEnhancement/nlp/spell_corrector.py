from spellchecker import SpellChecker

spell = SpellChecker()

def correct_word(word):
    """
    Returns the best correction and all possible suggestions.
    """
    correction = spell.correction(word)
    suggestions = list(spell.candidates(word))
    return correction, suggestions
