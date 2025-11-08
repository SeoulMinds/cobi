import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  category: string;
}

export const ProductCard = ({ name, price, image, category }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden border-border hover:shadow-card-hover transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image && (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {!image && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />}
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
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{category}</p>
          <h3 className="font-semibold text-foreground mt-1">{name}</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">${price}</span>
          <Button size="sm" className="bg-hero-gradient hover:opacity-90">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
