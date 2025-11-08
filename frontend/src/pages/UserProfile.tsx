import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getUserProfile } from "@/api";

interface Evidence {
  feature: string;
  sentence: string;
  sentiment: string;
  score: number;
  timestamp: string;
}

interface ProfileData {
  user_id: string;
  feature_weights: {
    size: number;
    color: number;
    material: number;
    brand: number;
    price: number;
    trend: number;
    durability: number;
    shipping: number;
  };
  evidence: Evidence[];
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState('logged_user'); // Hard-coded logged-in user

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">No profile data available</p>
        </div>
      </div>
    );
  }

  const renderPreferenceBar = (name: string, value: number) => {
    const percentage = Math.round(value * 100);
    return (
      <div key={name} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium capitalize">{name.replace('_', ' ')}</span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button onClick={fetchProfile} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            User Preference Profile
          </h1>
          <p className="text-muted-foreground">
            Vector-based preference mapping using Qdrant
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            User ID: <span className="font-mono font-semibold">{profile.user_id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature Weights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>
                Feature Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderPreferenceBar('size', profile.feature_weights.size)}
              {renderPreferenceBar('color', profile.feature_weights.color)}
              {renderPreferenceBar('material', profile.feature_weights.material)}
              {renderPreferenceBar('brand', profile.feature_weights.brand)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopping Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderPreferenceBar('price', profile.feature_weights.price)}
              {renderPreferenceBar('trend', profile.feature_weights.trend)}
              {renderPreferenceBar('durability', profile.feature_weights.durability)}
              {renderPreferenceBar('shipping', profile.feature_weights.shipping)}
            </CardContent>
          </Card>

          {/* Evidence / Recent Activity */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Evidence ({profile.evidence.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No evidence yet. Interact with products to build your preference profile.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {profile.evidence.slice(-10).reverse().map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize text-sm">{item.feature}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.sentiment === 'positive' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.sentiment} ({item.score > 0 ? '+' : ''}{item.score.toFixed(2)})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.sentence}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <CardTitle>🔍 How Vector Profiling Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Feature Weights (0.0 - 1.0)</h4>
              <p className="text-sm text-muted-foreground">
                Each feature represents how important that aspect is to you. Higher values mean stronger preferences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Evidence-Based Learning</h4>
              <p className="text-sm text-muted-foreground">
                Your profile updates based on sentiment analysis of your reviews and interactions. Positive feedback 
                increases weights, negative feedback decreases them.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Similarity Matching</h4>
              <p className="text-sm text-muted-foreground">
                The system uses cosine similarity (max 1.0) to find users with similar preferences and recommend 
                products you're likely to keep (not return).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
