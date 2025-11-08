"""Sentiment analysis for user responses to extract feature preferences.

Analyzes user messages to identify:
- Which product features they mention (size, color, material, brand, price, trend, durability, shipping)
- Their sentiment towards each feature (positive/negative)
- Sentiment score (-1.0 to 1.0)
"""
import re
from typing import Dict, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
import json


# Feature keywords mapping
FEATURE_KEYWORDS = {
    "size": ["size", "fit", "fitting", "fits", "큰", "작은", "사이즈", "핏", "맞음"],
    "color": ["color", "colour", "색", "색상", "컬러"],
    "material": ["material", "fabric", "quality", "재질", "소재", "품질"],
    "brand": ["brand", "브랜드", "메이커"],
    "price": ["price", "cost", "expensive", "cheap", "affordable", "가격", "비싸", "저렴"],
    "trend": ["trendy", "fashionable", "style", "트렌디", "유행", "스타일"],
    "durability": ["durable", "lasting", "quality", "strong", "내구성", "튼튼", "오래"],
    "shipping": ["shipping", "delivery", "배송", "빠른"],
}

SENTIMENT_ANALYSIS_PROMPT = """You are a sentiment analysis expert for e-commerce product reviews.

Analyze the user's message and extract:
1. Which product features they mention (size, color, material, brand, price, trend, durability, shipping)
2. Their sentiment about each feature (positive or negative)
3. A sentiment score from -1.0 (very negative) to 1.0 (very positive)

Return ONLY a JSON object with this exact structure:
{
  "features": [
    {
      "feature": "size",
      "sentence": "the exact sentence mentioning this feature",
      "sentiment": "positive",
      "score": 0.8
    }
  ]
}

If no product features are mentioned, return: {"features": []}

Examples:

User: "The fit is perfect and I love the color!"
Response: {
  "features": [
    {"feature": "size", "sentence": "The fit is perfect", "sentiment": "positive", "score": 0.9},
    {"feature": "color", "sentence": "I love the color", "sentiment": "positive", "score": 0.9}
  ]
}

User: "Too expensive for the quality"
Response: {
  "features": [
    {"feature": "price", "sentence": "Too expensive", "sentiment": "negative", "score": -0.7},
    {"feature": "material", "sentence": "for the quality", "sentiment": "negative", "score": -0.6}
  ]
}

User: "핏이 정말 좋아요" (Korean: The fit is really good)
Response: {
  "features": [
    {"feature": "size", "sentence": "핏이 정말 좋아요", "sentiment": "positive", "score": 0.9}
  ]
}

User: "Hi, I'm looking for shoes"
Response: {"features": []}

Now analyze this message:"""


class SentimentAnalyzer:
    """Analyzes user messages for product feature sentiment."""
    
    def __init__(self, gemini_api_key: str):
        """Initialize the sentiment analyzer with Gemini."""
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=gemini_api_key,
            temperature=0.1,  # Low temperature for consistent analysis
            max_output_tokens=1000,
            convert_system_message_to_human=True,
        )
    
    async def analyze_message(self, user_message: str) -> List[Dict]:
        """
        Analyze a user message for product feature sentiment.
        
        Args:
            user_message: The user's message to analyze
            
        Returns:
            List of feature sentiment objects:
            [
                {
                    "feature": "size",
                    "sentence": "The fit is perfect",
                    "sentiment": "positive",
                    "score": 0.9
                },
                ...
            ]
        """
        try:
            # Build prompt
            messages = [
                SystemMessage(content=SENTIMENT_ANALYSIS_PROMPT),
                HumanMessage(content=user_message)
            ]
            
            # Get response from Gemini
            response = await self.llm.ainvoke(messages)
            
            # Parse JSON response
            content = response.content.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            return result.get("features", [])
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse sentiment analysis JSON: {e}")
            print(f"Raw response: {response.content if 'response' in locals() else 'N/A'}")
            return []
        except Exception as e:
            print(f"Error in sentiment analysis: {e}")
            return []
    
    def _keyword_based_analysis(self, user_message: str) -> List[Dict]:
        """
        Fallback keyword-based sentiment analysis.
        
        Uses simple keyword matching and sentiment words.
        Less accurate than LLM-based analysis but always available.
        """
        message_lower = user_message.lower()
        features = []
        
        # Positive and negative sentiment words
        positive_words = ["good", "great", "excellent", "perfect", "love", "amazing", 
                         "좋", "완벽", "최고", "훌륭"]
        negative_words = ["bad", "poor", "terrible", "hate", "disappointing", "worst",
                         "나쁜", "별로", "실망", "안좋"]
        
        # Check each feature
        for feature, keywords in FEATURE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    # Extract sentence containing the keyword
                    sentences = re.split(r'[.!?]', user_message)
                    relevant_sentence = next(
                        (s for s in sentences if keyword in s.lower()),
                        user_message
                    ).strip()
                    
                    # Determine sentiment
                    has_positive = any(pos in message_lower for pos in positive_words)
                    has_negative = any(neg in message_lower for neg in negative_words)
                    
                    if has_positive and not has_negative:
                        sentiment = "positive"
                        score = 0.7
                    elif has_negative and not has_positive:
                        sentiment = "negative"
                        score = -0.7
                    else:
                        sentiment = "positive"
                        score = 0.5  # Neutral default
                    
                    features.append({
                        "feature": feature,
                        "sentence": relevant_sentence,
                        "sentiment": sentiment,
                        "score": score
                    })
                    break  # Only count each feature once
        
        return features


# Singleton instance
_sentiment_analyzer: Optional[SentimentAnalyzer] = None


def get_sentiment_analyzer(gemini_api_key: str) -> SentimentAnalyzer:
    """Get or create the sentiment analyzer singleton."""
    global _sentiment_analyzer
    
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer(gemini_api_key)
    
    return _sentiment_analyzer
