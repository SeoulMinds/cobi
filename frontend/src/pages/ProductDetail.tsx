import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from "@/components/Header";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, ArrowLeft, Star, Maximize2 } from "lucide-react";
import { getProduct, Product } from "@/api";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProduct(id);
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error || 'Product not found'}
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const displayImages = product.images && product.images.length > 0 ? product.images : [];
  const displayCategory = Array.isArray(product.category) 
    ? product.category.join(' > ') 
    : (product.category || product.brand || 'Product');

    // Render fullscreen view (no chat)
    if (isFullScreen) {
        return (
            <div className="min-h-screen bg-background">
                <Header />

                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button onClick={() => navigate('/')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                        <Button onClick={() => setIsFullScreen(false)} variant="outline">
                            Exit Fullscreen
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <Card className="overflow-hidden">
                                <div className="aspect-square bg-muted">
                                    {displayImages.length > 0 ? (
                                        <img
                                            src={displayImages[selectedImage]}
                                            alt={product.title || 'Product'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />
                                    )}
                                </div>
                            </Card>

                            {displayImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {displayImages.slice(0, 4).map((image, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`aspect-square border-2 rounded overflow-hidden ${selectedImage === idx ? 'border-primary' : 'border-border'
                                                }`}
                                        >
                                            <img src={image} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                                    {displayCategory}
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                                    {product.title || 'Product'}
                                </h1>
                                {product.brand && (
                                    <p className="text-lg text-muted-foreground">by {product.brand}</p>
                                )}
                            </div>

                            {/* Ratings */}
                            {product.ratings && product.ratings.average && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < Math.floor(product.ratings!.average!)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {product.ratings.average.toFixed(1)} ({product.ratings.count || 0} reviews)
                                    </span>
                                </div>
                            )}

                            {/* Price */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-baseline gap-3 mb-4">
                                        <span className="text-4xl font-bold text-foreground">
                                            ${product.price || 0}
                                        </span>
                                        {product.original_price && product.original_price > (product.price || 0) && (
                                            <>
                                                <span className="text-xl text-muted-foreground line-through">
                                                    ${product.original_price}
                                                </span>
                                                <Badge variant="destructive">
                                                    {product.discount_rate}% OFF
                                                </Badge>
                                            </>
                                        )}
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex gap-2 mb-4">
                                        {product.is_new && <Badge>New</Badge>}
                                        {product.is_best && <Badge variant="secondary">Best Seller</Badge>}
                                        {product.is_soldout && <Badge variant="destructive">Sold Out</Badge>}
                                        {product.stock && product.stock > 0 && !product.is_soldout && (
                                            <Badge variant="outline">{product.stock} in stock</Badge>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            size="lg"
                                            className="flex-1 bg-hero-gradient hover:opacity-90"
                                            disabled={product.is_soldout}
                                        >
                                            <ShoppingCart className="h-5 w-5 mr-2" />
                                            Add to Cart
                                        </Button>
                                        <Button size="lg" variant="outline">
                                            <Heart className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Description */}
                            {product.description && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                                    <p className="text-muted-foreground">{product.description}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Split view with chat
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* Product Content - Left Side */}
                <div className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <Button onClick={() => navigate('/')} variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                            <Button onClick={() => setIsFullScreen(true)} variant="outline">
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Fullscreen
                            </Button>
                        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {displayImages.length > 0 ? (
                  <img
                    src={displayImages[selectedImage]}
                    alt={product.title || 'Product'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />
                )}
              </div>
            </Card>
            
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.slice(0, 4).map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square border-2 rounded overflow-hidden ${
                      selectedImage === idx ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img src={image} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {displayCategory}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {product.title || 'Product'}
              </h1>
              {product.brand && (
                <p className="text-lg text-muted-foreground">by {product.brand}</p>
              )}
            </div>

            {/* Ratings */}
            {product.ratings && product.ratings.average && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.ratings!.average!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.ratings.average.toFixed(1)} ({product.ratings.count || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    ${product.price || 0}
                  </span>
                  {product.original_price && product.original_price > (product.price || 0) && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ${product.original_price}
                      </span>
                      <Badge variant="destructive">
                        {product.discount_rate}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 mb-4">
                  {product.is_new && <Badge>New</Badge>}
                  {product.is_best && <Badge variant="secondary">Best Seller</Badge>}
                  {product.is_soldout && <Badge variant="destructive">Sold Out</Badge>}
                  {product.stock && product.stock > 0 && !product.is_soldout && (
                    <Badge variant="outline">{product.stock} in stock</Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    className="flex-1 bg-hero-gradient hover:opacity-90"
                    disabled={product.is_soldout}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
                    </div>
                </div>

                {/* Chat Assistant - Right Side */}
                <div className="w-full md:w-96 flex flex-col">
                    <ChatAssistant
                        splitView={true}
                    />
                </div>
      </div>
    </div>
  );
};

export default ProductDetail;
