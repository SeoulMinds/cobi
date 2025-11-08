import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart } from "lucide-react";

interface ProductCardProps {
  id?: string;
  title?: string;
  name?: string;
  price?: number;
  image?: string;
  images?: string[];
  category?: string | string[];
  brand?: string;
  description?: string;
  ratings?: {
    average?: number;
    count?: number;
  };
  is_new?: boolean;
}

export const ProductCard = ({
  id,
  title,
  name,
  price,
  image,
  images,
  category,
  brand,
  is_new
}: ProductCardProps) => {
  // Use title as fallback to name
  const displayName = name || title || 'Product';

  // Get the first image from images array or use the image prop
  const displayImage = image || (images && images.length > 0 ? images[0] : '');

  // Get category as string
  const displayCategory = Array.isArray(category)
    ? category.join(', ')
    : (category || brand || 'Product');

  return (
    <Card className="group overflow-hidden border-border hover:shadow-card-hover transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {displayImage && (
          <img
            src={displayImage}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {!displayImage && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />}
        {is_new && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
            New
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{displayCategory}</p>
          <h3 className="font-semibold text-foreground mt-1">{displayName}</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">${price || 0}</span>
          <Button size="sm" className="bg-hero-gradient hover:opacity-90">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
