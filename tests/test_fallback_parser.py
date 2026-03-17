import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from engine.intent_parser import rule_based_fallback, parse_intent
from unittest.mock import patch

def test_fallback():
    print("Testing Keyword Detection...")
    
    test_cases = [
        ("summarize this doc", "summarize_text"),
        ("researching AI", "research_topic"),
        ("calculate 2+2", "calculate_math"),
        ("translate to spanish", "translate_text"),
        ("analyze sentiment of this", "analyze_sentiment"),
        ("something random", "general_task")
    ]
    
    for req, expected_intent in test_cases:
        result = rule_based_fallback(req)
        print(f"Request: '{req}' -> Intent: {result['intent']}")
        assert result['intent'] == expected_intent
        assert "original_request" in result
        assert "required_capability" in result

    print("\nTesting parse_intent fallback on error...")
    # Mock model.generate_content to raise an exception
    with patch('google.generativeai.GenerativeModel.generate_content') as mock_gen:
        mock_gen.side_effect = Exception("429 Quota Exceeded")
        
        result = parse_intent("summarize this")
        print(f"Result on 429: {result['intent']} (Warning: {result.get('warning')})")
        assert result['intent'] == "summarize_text"
        assert "warning" in result

    print("\n✅ Fallback tests passed!")

if __name__ == "__main__":
    test_fallback()
