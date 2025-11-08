import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-muted to-background">
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
              Discover Your
              <span className="block bg-hero-gradient bg-clip-text text-transparent">
                Perfect Style
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Explore our curated collection of premium products. Shop with confidence and let our AI assistant help you find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-hero-gradient hover:opacity-90 transition-opacity">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden border border-border shadow-card-hover">
              <img
                src="/Gemini_Generated_Image_j27bgkj27bgkj27b.png"
                alt="50% OFF On Selected Items"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
