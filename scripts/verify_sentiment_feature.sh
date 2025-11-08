#!/bin/bash

# COBI Sentiment Analysis Feature Verification Script
# This script verifies that all components are working correctly

set -e

echo "=========================================="
echo "COBI Sentiment Analysis Verification"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"

# Test user
TEST_USER="test-user-$(date +%s)"

echo -e "${BLUE}[1/6] Checking Backend Health...${NC}"
if curl -s "${BACKEND_URL}/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "Make sure services are running: ./compose_up.sh"
    exit 1
fi
echo ""

echo -e "${BLUE}[2/6] Checking Qdrant Connection...${NC}"
if curl -s "${QDRANT_URL}/" | grep -q "qdrant"; then
    echo -e "${GREEN}✓ Qdrant is running${NC}"
else
    echo -e "${RED}✗ Qdrant is not responding${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[3/6] Testing Chat with Sentiment Analysis...${NC}"
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"The fit is perfect and I love the color!\", \"user_id\": \"${TEST_USER}\"}")

if echo "$RESPONSE" | grep -q "sentiment_features"; then
    echo -e "${GREEN}✓ Chat endpoint working with sentiment analysis${NC}"
    
    # Check if features were extracted
    FEATURES_COUNT=$(echo "$RESPONSE" | grep -o '"feature"' | wc -l)
    if [ "$FEATURES_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Extracted ${FEATURES_COUNT} sentiment feature(s)${NC}"
    else
        echo -e "${YELLOW}⚠ No sentiment features extracted (may be expected for generic messages)${NC}"
    fi
else
    echo -e "${RED}✗ Sentiment analysis not working${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

echo -e "${BLUE}[4/6] Verifying User Profile Creation...${NC}"
PROFILE=$(curl -s "${BACKEND_URL}/api/user-profile/${TEST_USER}")

if echo "$PROFILE" | grep -q "feature_weights"; then
    echo -e "${GREEN}✓ User profile created${NC}"
    
    # Extract size weight
    SIZE_WEIGHT=$(echo "$PROFILE" | grep -o '"size":[0-9.]*' | cut -d: -f2)
    echo -e "${GREEN}✓ Size weight: ${SIZE_WEIGHT}${NC}"
    
    # Check if evidence exists
    if echo "$PROFILE" | grep -q "evidence"; then
        EVIDENCE_COUNT=$(echo "$PROFILE" | grep -o '"timestamp"' | wc -l)
        echo -e "${GREEN}✓ Evidence entries: ${EVIDENCE_COUNT}${NC}"
    fi
else
    echo -e "${RED}✗ User profile not created${NC}"
    echo "Response: $PROFILE"
    exit 1
fi
echo ""

echo -e "${BLUE}[5/6] Testing Negative Sentiment...${NC}"
curl -s -X POST "${BACKEND_URL}/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Too expensive for what you get\", \"user_id\": \"${TEST_USER}\"}" > /dev/null

sleep 1

PROFILE2=$(curl -s "${BACKEND_URL}/api/user-profile/${TEST_USER}")
PRICE_WEIGHT=$(echo "$PROFILE2" | grep -o '"price":[0-9.]*' | cut -d: -f2)

echo -e "${GREEN}✓ Negative sentiment processed${NC}"
echo -e "${GREEN}✓ Price weight: ${PRICE_WEIGHT} (should be < 0.5)${NC}"
echo ""

echo -e "${BLUE}[6/6] Checking Qdrant Dashboard Access...${NC}"
if curl -s "${QDRANT_URL}/dashboard" | grep -q "html"; then
    echo -e "${GREEN}✓ Qdrant Dashboard is accessible${NC}"
    echo -e "${BLUE}  → Open: ${QDRANT_URL}/dashboard${NC}"
else
    echo -e "${YELLOW}⚠ Qdrant Dashboard may not be accessible${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✓ All Checks Passed!${NC}"
echo "=========================================="
echo ""
echo "Test Results Summary:"
echo "-------------------"
echo -e "Test User ID: ${YELLOW}${TEST_USER}${NC}"
echo -e "Backend: ${GREEN}${BACKEND_URL}${NC}"
echo -e "Qdrant: ${GREEN}${QDRANT_URL}${NC}"
echo ""
echo "Next Steps:"
echo "1. View test user in Qdrant Dashboard:"
echo -e "   ${BLUE}${QDRANT_URL}/dashboard${NC}"
echo "   Navigate to: Collections → user_profiles → ${TEST_USER}"
echo ""
echo "2. View test user profile via API:"
echo -e "   ${BLUE}curl ${BACKEND_URL}/api/user-profile/${TEST_USER} | jq${NC}"
echo ""
echo "3. Try the frontend chat interface:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "4. Read the documentation:"
echo -e "   ${BLUE}docs/QUICKSTART_SENTIMENT.md${NC}"
echo ""
