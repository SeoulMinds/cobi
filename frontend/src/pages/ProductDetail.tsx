import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from "@/components/Header";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, ArrowLeft, Star, Maximize2 } from "lucide-react";
import { getProduct, Product } from "@/api";

// Static product data type for landing page products
interface StaticProduct {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
    const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isStaticProduct, setIsStaticProduct] = useState(false);
    const [showChatSplit, setShowChatSplit] = useState(false);

    // Check if user came from chat
    const fromChat = (location.state as { fromChat?: boolean })?.fromChat || false;

    useEffect(() => {
        // Set initial chat split view state based on where user came from
        setShowChatSplit(fromChat);
    }, [fromChat]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
        // Check if this is a static product (id 1-6)
        const staticProductIds = ['1', '2', '3', '4', '5', '6'];
        if (staticProductIds.includes(id)) {
            // Create placeholder product from static data
            const staticProducts: Record<string, StaticProduct> = {
                '1': { id: '1', name: 'Premium Sneakers', price: 129, category: 'Footwear', image: 'https://hips.hearstapps.com/vader-prod.s3.amazonaws.com/1738680947-pegasus-premium-1000px-67a229b4b7eae.jpg?crop=1xw:1xh;center,top&resize=980:*' },
                '2': { id: '2', name: 'Designer Backpack', price: 89, category: 'Accessories', image: 'https://www.unihandmade.com/cdn/shop/products/BACKPACK_8_d691f817-1cd5-4dd9-9ca2-df69a815e768.jpg?v=1616487700' },
                '3': { id: '3', name: 'Wireless Headphones', price: 199, category: 'Electronics', image: 'https://hottipsusa.com/cdn/shop/products/Pro_Overear_Wireless_Headphones_Main_White_websize_1024x1024.jpg?v=1670266033' },
                '4': { id: '4', name: 'Smart Watch', price: 299, category: 'Electronics', image: 'https://m.media-amazon.com/images/I/61I22cL7v+L._AC_UF894,1000_QL80_.jpg' },
                '5': { id: '5', name: 'Leather Wallet', price: 49, category: 'Accessories', image: 'https://www.galenleather.com/cdn/shop/products/no38-personalized-minimalist-hanmade-leather-wallet-brown_2048x.jpg?v=1536620105' },
                '6': { id: '6', name: 'Sunglasses', price: 149, category: 'Accessories', image: 'https://sunski.com/cdn/shop/files/sunski_polarized_sunglasses_baia_24.jpg?crop=center&height=1100&v=1748987571&width=1400' },
            };

            const staticProduct = staticProducts[id];
            if (staticProduct) {
                // Convert to Product format
                setProduct({
                    id: staticProduct.id,
                    title: staticProduct.name,
                    price: staticProduct.price,
                    category: [staticProduct.category],
                    images: [staticProduct.image],
                    description: `This is a premium ${staticProduct.name.toLowerCase()}. Perfect for your needs with excellent quality and design.`,
                    brand: 'Premium Brand',
                    stock: 10,
                    is_new: Math.random() > 0.5,
                    ratings: {
                        average: 4 + Math.random(),
                        count: Math.floor(Math.random() * 100) + 10
                    }
                });
                setIsStaticProduct(true);
                setIsLoading(false);
                return;
            }
        }

        // Try to fetch from API for non-static products
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProduct(id);
        setProduct(data);
          setIsStaticProduct(false);
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
                          {(product.price || 0).toLocaleString()} {product.currency || 'KRW'}
                                        </span>
                                        {product.original_price && product.original_price > (product.price || 0) && (
                                            <>
                                                <span className="text-xl text-muted-foreground line-through">
                              {product.original_price.toLocaleString()} {product.currency || 'KRW'}
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

    // If showChatSplit is false, render regular view with floating chat button
    if (!showChatSplit) {
        return (
            <div className="min-h-screen bg-background">
                <Header />

                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button onClick={() => navigate('/')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
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
                          {(product.price || 0).toLocaleString()} {product.currency || 'KRW'}
                                        </span>
                                        {product.original_price && product.original_price > (product.price || 0) && (
                                            <>
                                                <span className="text-xl text-muted-foreground line-through">
                              {product.original_price.toLocaleString()} {product.currency || 'KRW'}
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
                {/* Floating chat button will be shown by App.tsx ChatWrapper */}
            </div>
        );
    }

    // Split view with chat (when coming from chat)
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* Product Content - Left Side */}
                <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 h-full">
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
                          {(product.price || 0).toLocaleString()} {product.currency || 'KRW'}
                  </span>
                  {product.original_price && product.original_price > (product.price || 0) && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                              {product.original_price.toLocaleString()} {product.currency || 'KRW'}
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
          <div className="w-full md:w-96 flex flex-col h-full overflow-hidden">
                    <ChatAssistant
                        splitView={true}
                    />
                </div>
      </div>
    </div>
  );
};

export default ProductDetail;
