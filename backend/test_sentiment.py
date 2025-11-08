#!/usr/bin/env python3
"""Test script for user profile sentiment analysis feature.

This script tests:
1. Sending chat messages with sentiment
2. Extracting sentiment features
3. Updating user profiles
4. Viewing profiles in Qdrant
"""

import asyncio
import json
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Suppress import warnings for testing
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")


async def test_sentiment_analysis():
    """Test sentiment analysis functionality."""
    print("=" * 60)
    print("Testing User Profile Sentiment Analysis")
    print("=" * 60)
    
    try:
        from llm_api.sentiment_analyzer import get_sentiment_analyzer
        
        # Check if API key is set
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "test-key":
            print("❌ GEMINI_API_KEY not set. Set it in your environment:")
            print("   export GEMINI_API_KEY='your-key-here'")
            return
        
        print(f"\n✅ Gemini API Key configured")
        
        # Initialize analyzer
        analyzer = get_sentiment_analyzer(api_key)
        print("✅ Sentiment analyzer initialized")
        
        # Test messages
        test_messages = [
            "The fit is perfect and I love the color!",
            "Too expensive for the quality",
            "핏이 정말 좋아요",  # Korean: The fit is really good
            "Great brand but shipping is slow",
            "Hi, I'm looking for shoes",  # Should extract no features
        ]
        
        print("\n" + "=" * 60)
        print("Testing Sentiment Extraction")
        print("=" * 60)
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n[Test {i}] Message: '{message}'")
            print("-" * 60)
            
            try:
                features = await analyzer.analyze_message(message)
                
                if features:
                    print(f"✅ Extracted {len(features)} feature(s):")
                    for feature in features:
                        print(f"   • {feature['feature']}: {feature['sentiment']} "
                              f"(score: {feature['score']:.2f})")
                        print(f"     Sentence: \"{feature['sentence']}\"")
                else:
                    print("ℹ️  No product features detected (generic message)")
                    
            except Exception as e:
                print(f"❌ Error analyzing message: {e}")
        
        print("\n" + "=" * 60)
        print("✅ All sentiment analysis tests completed!")
        print("=" * 60)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_profile_update():
    """Test user profile update functionality."""
    print("\n" + "=" * 60)
    print("Testing User Profile Updates")
    print("=" * 60)
    
    try:
        from vector_db.qdrant_service import get_qdrant_service
        
        # Initialize service
        qdrant = get_qdrant_service()
        print("✅ Qdrant service initialized")
        
        # Test user
        test_user = f"test-user-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Get initial profile
        print(f"\n[1] Getting initial profile for: {test_user}")
        profile = qdrant.get_user_profile(test_user)
        print(f"   Initial weights: {json.dumps(profile['feature_weights'], indent=2)}")
        
        # Add positive evidence
        print(f"\n[2] Adding positive evidence (size: 'Perfect fit!')")
        success = qdrant.add_evidence(
            user_id=test_user,
            feature="size",
            sentence="Perfect fit!",
            sentiment="positive",
            score=0.9
        )
        print(f"   {'✅' if success else '❌'} Evidence added: {success}")
        
        # Get updated profile
        profile = qdrant.get_user_profile(test_user)
        print(f"   Updated size weight: {profile['feature_weights']['size']:.3f}")
        
        # Add negative evidence
        print(f"\n[3] Adding negative evidence (price: 'Too expensive')")
        success = qdrant.add_evidence(
            user_id=test_user,
            feature="price",
            sentence="Too expensive",
            sentiment="negative",
            score=-0.7
        )
        print(f"   {'✅' if success else '❌'} Evidence added: {success}")
        
        # Get updated profile
        profile = qdrant.get_user_profile(test_user)
        print(f"   Updated price weight: {profile['feature_weights']['price']:.3f}")
        
        # Show evidence
        print(f"\n[4] Evidence history ({len(profile['evidence'])} entries):")
        for i, evidence in enumerate(profile['evidence'], 1):
            print(f"   {i}. {evidence['feature']}: {evidence['sentiment']} "
                  f"(score: {evidence['score']:.2f})")
            print(f"      \"{evidence['sentence']}\"")
        
        # Find similar users
        print(f"\n[5] Finding similar users...")
        similar = qdrant.get_similar_users(test_user, limit=3)
        if similar:
            print(f"   Found {len(similar)} similar user(s):")
            for user in similar:
                print(f"   • {user['user_id']}: similarity {user['similarity']:.3f}")
        else:
            print("   No similar users found (database may be empty)")
        
        print("\n" + "=" * 60)
        print("✅ All profile update tests completed!")
        print("=" * 60)
        print(f"\nℹ️  View this profile in Qdrant Dashboard:")
        print(f"   http://localhost:6333/dashboard")
        print(f"   Collection: user_profiles")
        print(f"   Point ID: {test_user}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests."""
    print("\n" + "🚀 " * 20)
    print("COBI User Profile Sentiment Analysis Test Suite")
    print("🚀 " * 20 + "\n")
    
    # Test 1: Sentiment Analysis
    await test_sentiment_analysis()
    
    # Test 2: Profile Updates
    await test_profile_update()
    
    print("\n" + "=" * 60)
    print("✨ All tests completed!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Open Qdrant Dashboard: http://localhost:6333/dashboard")
    print("2. Navigate to 'user_profiles' collection")
    print("3. Explore the test user profile created above")
    print("4. Try the chat interface and watch profiles update in real-time!")
    print()


if __name__ == "__main__":
    asyncio.run(main())
