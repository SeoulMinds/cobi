"""Qdrant Vector Database Service for User Preference Profiles.

Manages user feature weights and evidence based on sentiment analysis.
Tracks feature importance like size, color, material, brand, price, etc.
"""
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

# Feature dimensions mapping (8 core features for demo)
FEATURE_DIMENSIONS = {
    "size": 0,
    "color": 1,
    "material": 2,
    "brand": 3,
    "price": 4,
    "trend": 5,
    "durability": 6,
    "shipping": 7,
}

VECTOR_SIZE = 8  # Total feature dimensions


def _user_id_to_uuid(user_id: str) -> str:
    """
    Convert a user_id string to a valid UUID for Qdrant.
    Uses UUID v5 (namespace-based) for consistent conversion.
    
    Args:
        user_id: User identifier string (can contain any characters)
        
    Returns:
        UUID string that Qdrant will accept
    """
    # Use DNS namespace for consistent UUID generation
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    return str(uuid.uuid5(namespace, user_id))


class QdrantService:
    def __init__(self):
        """Initialize Qdrant client."""
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = int(os.getenv("QDRANT_PORT", "6333"))
        
        self.client = QdrantClient(host=qdrant_host, port=qdrant_port)
        self.collection_name = "user_profiles"
        
        # Initialize collection
        self._initialize_collection()
    
    def _initialize_collection(self):
        """Create collection if it doesn't exist."""
        try:
            collections = self.client.get_collections().collections
            collection_exists = any(c.name == self.collection_name for c in collections)
            
            if not collection_exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                )
                print(f"Created collection: {self.collection_name}")
        except Exception as e:
            print(f"Error initializing collection: {e}")
    
    def _create_default_weights(self) -> List[float]:
        """Create default feature weights (all 0.5)."""
        return [0.5] * VECTOR_SIZE
    
    def sync_from_mongodb_data(self, user_id: str, mongodb_profile: Dict) -> bool:
        """Sync user profile data from MongoDB to Qdrant.
        
        Args:
            user_id: User identifier
            mongodb_profile: Profile data from MongoDB with structure:
                {
                    "user_id": "...",
                    "feature_weights": {...},
                    "evidence": [...]
                }
        
        Returns:
            True if successful
        """
        try:
            if "feature_weights" not in mongodb_profile:
                return False
            
            # Convert user_id to UUID for Qdrant compatibility
            point_id = _user_id_to_uuid(user_id)
            
            # Convert feature weights dict to vector
            feature_weights = mongodb_profile["feature_weights"]
            vector = [
                feature_weights.get(f, 0.5) for f in sorted(FEATURE_DIMENSIONS.keys())
            ]
            
            # Get evidence if available
            evidence = mongodb_profile.get("evidence", [])
            
            # Store user_id in payload so we can retrieve it later
            payload = {
                "user_id": user_id,  # Store original user_id
                "evidence": evidence
            }
            
            # Upsert to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,  # Use UUID
                        vector=vector,
                        payload=payload,
                    )
                ],
            )
            
            return True
        except Exception as e:
            print(f"Error syncing from MongoDB: {e}")
            return False
    
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile with feature weights and evidence.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with structure:
            {
                "user_id": "u_001",
                "feature_weights": {"size": 0.87, "color": 0.72, ...},
                "evidence": [{"feature": "size", "sentence": "...", ...}]
            }
        """
        try:
            # Convert user_id to UUID for Qdrant lookup
            point_id = _user_id_to_uuid(user_id)
            
            results = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[point_id]
            )
            
            if results:
                vector = results[0].vector
                payload = results[0].payload
                evidence = payload.get("evidence", [])
                
                # Ensure all weights are between 0.0 and 1.0
                feature_weights = {
                    feature: max(0.0, min(1.0, float(vector[idx])))
                    for feature, idx in FEATURE_DIMENSIONS.items()
                }
                
                return {
                    "user_id": user_id,  # Return original user_id
                    "feature_weights": feature_weights,
                    "evidence": evidence,
                }
            else:
                # Initialize new profile
                default_vector = self._create_default_weights()
                point_id = _user_id_to_uuid(user_id)
                
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        PointStruct(
                            id=point_id,
                            vector=default_vector,
                            payload={"user_id": user_id, "evidence": []},
                        )
                    ],
                )
                
                return {
                    "user_id": user_id,
                    "feature_weights": {
                        feature: 0.5 for feature in FEATURE_DIMENSIONS.keys()
                    },
                    "evidence": [],
                }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            # Return default on error
            return {
                "user_id": user_id,
                "feature_weights": {
                    feature: 0.5 for feature in FEATURE_DIMENSIONS.keys()
                },
                "evidence": [],
            }
    
    def add_evidence(
        self, 
        user_id: str, 
        feature: str, 
        sentence: str, 
        sentiment: str,
        score: float
    ) -> bool:
        """Add evidence and update feature weight.
        
        Args:
            user_id: User identifier
            feature: Feature name (size, color, material, etc.)
            sentence: User's sentence/review text
            sentiment: "positive" or "negative"
            score: Sentiment score (-1.0 to 1.0)
            
        Returns:
            True if successful
        """
        try:
            if feature not in FEATURE_DIMENSIONS:
                return False
            
            # Get current profile
            profile = self.get_user_profile(user_id)
            if not profile:
                return False
            
            # Create evidence entry
            evidence_entry = {
                "feature": feature,
                "sentence": sentence,
                "sentiment": sentiment,
                "score": score,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            # Update evidence list
            evidence_list = profile["evidence"]
            evidence_list.append(evidence_entry)
            
            # Keep only last 50 evidence entries per user
            if len(evidence_list) > 50:
                evidence_list = evidence_list[-50:]
            
            # Update feature weight using exponential moving average
            current_weight = profile["feature_weights"][feature]
            learning_rate = 0.3
            
            # Normalize score to 0-1 range (score comes in as -1.0 to 1.0)
            normalized_score = (score + 1.0) / 2.0
            
            # Update weight: blend old weight with new score
            new_weight = current_weight * (1 - learning_rate) + normalized_score * learning_rate
            new_weight = max(0.0, min(1.0, new_weight))  # Clamp to [0, 1]
            
            # Update vector
            feature_idx = FEATURE_DIMENSIONS[feature]
            updated_vector = [
                profile["feature_weights"][f] for f in sorted(FEATURE_DIMENSIONS.keys())
            ]
            updated_vector[feature_idx] = new_weight
            
            # Convert user_id to UUID for Qdrant
            point_id = _user_id_to_uuid(user_id)
            
            # Upsert to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,  # Use UUID
                        vector=updated_vector,
                        payload={"user_id": user_id, "evidence": evidence_list},
                    )
                ],
            )
            
            return True
            
        except Exception as e:
            print(f"Error adding evidence: {e}")
            return False
    
    def update_feature_weights(
        self, 
        user_id: str, 
        weights: Dict[str, float]
    ) -> bool:
        """Directly update feature weights.
        
        Args:
            user_id: User identifier
            weights: Dict of feature -> weight (0.0 to 1.0)
            
        Returns:
            True if successful
        """
        try:
            profile = self.get_user_profile(user_id)
            if not profile:
                return False
            
            # Update weights (clamp to 0-1 range)
            for feature, weight in weights.items():
                if feature in FEATURE_DIMENSIONS:
                    profile["feature_weights"][feature] = max(0.0, min(1.0, weight))
            
            # Convert to vector
            updated_vector = [
                profile["feature_weights"][f] for f in sorted(FEATURE_DIMENSIONS.keys())
            ]
            
            # Convert user_id to UUID for Qdrant
            point_id = _user_id_to_uuid(user_id)
            
            # Upsert to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,  # Use UUID
                        vector=updated_vector,
                        payload={"user_id": user_id, "evidence": profile["evidence"]},
                    )
                ],
            )
            
            return True
            
        except Exception as e:
            print(f"Error updating feature weights: {e}")
            return False
    
    def get_similar_users(self, user_id: str, limit: int = 5) -> List[Dict]:
        """Find users with similar preference profiles.
        
        Args:
            user_id: User identifier
            limit: Number of similar users to return
            
        Returns:
            List of similar user profiles with similarity scores (0.0 to 1.0)
        """
        try:
            profile = self.get_user_profile(user_id)
            if not profile:
                return []
            
            # Get vector
            query_vector = [
                profile["feature_weights"][f] for f in sorted(FEATURE_DIMENSIONS.keys())
            ]
            
            # Search for similar vectors
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit + 1,  # +1 because user itself will be in results
            )
            
            # Filter out the query user and format results
            similar_users = []
            query_point_id = _user_id_to_uuid(user_id)
            
            for result in results:
                # Skip if it's the same user (compare UUIDs)
                if result.id == query_point_id:
                    continue
                    
                # Get the original user_id from payload
                result_user_id = result.payload.get("user_id", str(result.id))
                
                # Cosine similarity is already 0-1 range
                similarity = max(0.0, min(1.0, float(result.score)))
                
                similar_users.append({
                    "user_id": result_user_id,  # Use original user_id from payload
                    "similarity": similarity,  # Guaranteed to be 0.0 to 1.0
                    "feature_weights": {
                        feature: max(0.0, min(1.0, float(result.vector[idx])))
                        for feature, idx in FEATURE_DIMENSIONS.items()
                    },
                })
            
            return similar_users[:limit]
            
        except Exception as e:
            print(f"Error finding similar users: {e}")
            return []
    
    def get_feature_dimensions(self) -> Dict[str, int]:
        """Get all available feature dimensions."""
        return FEATURE_DIMENSIONS.copy()
    
    def extract_product_preferences(self, product: Dict) -> Dict[str, float]:
        """Extract preference signals from a product interaction.
        
        This is a simplified extraction for demo purposes.
        In production, use NLP/ML to extract features from reviews.
        """
        preferences = {}
        
        # Extract basic signals from product data
        if "tags" in product and isinstance(product["tags"], list):
            for tag in product["tags"]:
                tag_lower = tag.lower()
                # Map tags to features
                if any(word in tag_lower for word in ["fit", "size", "sizing"]):
                    preferences["size"] = 0.7
                elif any(word in tag_lower for word in ["color", "colour"]):
                    preferences["color"] = 0.7
                elif any(word in tag_lower for word in ["material", "fabric", "quality"]):
                    preferences["material"] = 0.7
        
        # Extract price preference
        if "price" in product:
            price = product["price"]
            # Normalize price importance
            if price < 50:
                preferences["price"] = 0.3
            elif price < 150:
                preferences["price"] = 0.5
            else:
                preferences["price"] = 0.8
        
        return preferences


# Singleton instance
_qdrant_service: Optional[QdrantService] = None


def get_qdrant_service() -> QdrantService:
    """Get or create QdrantService singleton."""
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service
