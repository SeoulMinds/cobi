# COBI Documentation

Welcome to the COBI (SeoulMinds) documentation. This folder contains comprehensive guides for all features.

## 📚 Documentation Index

### Getting Started

- **[../README.md](../README.md)** - Main project README with setup instructions
- **[PORT_CONFIG.md](PORT_CONFIG.md)** - Port configuration reference

### User Profile Sentiment Analysis Feature

This feature automatically analyzes user chat messages to extract product preferences and update user profiles in real-time.

#### Quick Start (Start Here!)

- **[FEATURE_COMPLETE.md](FEATURE_COMPLETE.md)** ⭐
  - Implementation completion summary
  - What was delivered
  - Quick testing guide
  - **Read this first to understand what's available!**

- **[QUICKSTART_SENTIMENT.md](QUICKSTART_SENTIMENT.md)** 🚀
  - Step-by-step testing guide
  - cURL examples
  - Qdrant dashboard walkthrough
  - Troubleshooting
  - **Start here to test the feature!**

#### Deep Dive Documentation

- **[USER_PROFILE_SENTIMENT.md](USER_PROFILE_SENTIMENT.md)** 📖
  - Complete feature documentation
  - How it works (detailed)
  - API endpoints reference
  - Example workflows
  - Qdrant dashboard visualization guide
  - **Read this for comprehensive understanding**

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** 🔧
  - Technical implementation details
  - Files created/modified
  - Architecture overview
  - Data flow examples
  - Testing instructions
  - **Read this to understand the code**

- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** 🎨
  - Visual system architecture
  - Data flow diagrams
  - Qdrant dashboard views
  - Integration points
  - **Read this for visual understanding**

## 🎯 Recommended Reading Path

### For Users/Testers
1. [FEATURE_COMPLETE.md](FEATURE_COMPLETE.md) - Overview (5 min)
2. [QUICKSTART_SENTIMENT.md](QUICKSTART_SENTIMENT.md) - Testing (5 min)
3. Test the feature! 🎉

### For Developers
1. [FEATURE_COMPLETE.md](FEATURE_COMPLETE.md) - Overview (5 min)
2. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Code details (10 min)
3. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Architecture (10 min)
4. [USER_PROFILE_SENTIMENT.md](USER_PROFILE_SENTIMENT.md) - Full docs (15 min)
5. Review the code in:
   - `backend/llm_api/sentiment_analyzer.py`
   - `backend/main.py` (chat endpoint)
   - `backend/vector_db/qdrant_service.py`

### For Product Managers
1. [FEATURE_COMPLETE.md](FEATURE_COMPLETE.md) - What was delivered (5 min)
2. [USER_PROFILE_SENTIMENT.md](USER_PROFILE_SENTIMENT.md) - Feature capabilities (15 min)
3. [QUICKSTART_SENTIMENT.md](QUICKSTART_SENTIMENT.md) - See it in action (5 min)

## 🛠️ Quick Commands

### Test the Feature
```bash
# Quick verification
./scripts/verify_sentiment_feature.sh

# Automated test suite
docker exec -it cobi-backend-dev python test_sentiment.py
```

### Access Services
```bash
# Frontend
open http://localhost:3000

# Backend API Docs
open http://localhost:8001/docs

# Qdrant Dashboard
open http://localhost:6333/dashboard

# Mongo Express
open http://localhost:8081
```

### Example API Calls
```bash
# Send chat message with sentiment analysis
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Perfect fit!", "user_id": "demo-user"}'

# View user profile
curl http://localhost:8001/api/user-profile/demo-user | jq

# Find similar users
curl http://localhost:8001/api/user-profile/similar-users/demo-user | jq
```

## 📊 Feature Overview

### What It Does
- ✅ Analyzes user chat messages for product preferences
- ✅ Extracts sentiment (positive/negative) for 8 features
- ✅ Updates user profiles in Qdrant vector database
- ✅ Tracks evidence history in MongoDB
- ✅ Visualizes results in Qdrant dashboard

### Tracked Features
1. **size** - Fit and sizing preferences
2. **color** - Color preferences
3. **material** - Material quality
4. **brand** - Brand preferences
5. **price** - Price sensitivity
6. **trend** - Style/trend affinity
7. **durability** - Durability concerns
8. **shipping** - Shipping speed priority

### Key Components
- **Sentiment Analyzer** (`backend/llm_api/sentiment_analyzer.py`)
- **Qdrant Service** (`backend/vector_db/qdrant_service.py`)
- **Chat Endpoint** (`backend/main.py`)
- **Qdrant Dashboard** (http://localhost:6333/dashboard)

## 🔍 Find What You Need

| I want to... | Read this |
|--------------|-----------|
| Understand what was implemented | [FEATURE_COMPLETE.md](FEATURE_COMPLETE.md) |
| Test the feature quickly | [QUICKSTART_SENTIMENT.md](QUICKSTART_SENTIMENT.md) |
| Learn how it works in detail | [USER_PROFILE_SENTIMENT.md](USER_PROFILE_SENTIMENT.md) |
| Understand the code | [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) |
| See the architecture | [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) |
| Configure ports | [PORT_CONFIG.md](PORT_CONFIG.md) |
| Set up the project | [../README.md](../README.md) |

## 🆘 Getting Help

### Troubleshooting
- Check [QUICKSTART_SENTIMENT.md](QUICKSTART_SENTIMENT.md) - Troubleshooting section
- Check [USER_PROFILE_SENTIMENT.md](USER_PROFILE_SENTIMENT.md) - Troubleshooting section
- Run: `./scripts/verify_sentiment_feature.sh`

### Logs
```bash
# Backend logs
docker logs cobi-backend-dev

# Qdrant logs
docker logs cobi-qdrant-dev

# All services
docker compose logs
```

### Verify Services
```bash
# Check all containers
docker ps

# Check backend health
curl http://localhost:8001/health

# Check Qdrant
curl http://localhost:6333/
```

## 🎉 Quick Start (TL;DR)

```bash
# 1. Ensure services are running
./compose_up.sh

# 2. Run verification
./scripts/verify_sentiment_feature.sh

# 3. Open Qdrant Dashboard
open http://localhost:6333/dashboard

# 4. Send a test message
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Perfect fit and I love the color!", "user_id": "demo-user"}'

# 5. View the profile in dashboard
# Navigate to: Collections → user_profiles → demo-user
```

## 📝 Notes

- All documentation is in Markdown format
- Code examples use cURL for portability
- Screenshots would be in `/docs/images/` (not created yet)
- API examples assume localhost deployment

## 🔗 External Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

---

**Last Updated**: November 9, 2025  
**Project**: COBI (SeoulMinds)  
**Feature**: User Profile Sentiment Analysis
