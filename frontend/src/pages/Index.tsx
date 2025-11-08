import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ChatAssistant } from "@/components/ChatAssistant";

const products = [
  { id: 1, name: "Premium Sneakers", price: 129, category: "Footwear", image: "https://hips.hearstapps.com/vader-prod.s3.amazonaws.com/1738680947-pegasus-premium-1000px-67a229b4b7eae.jpg?crop=1xw:1xh;center,top&resize=980:*" },
  { id: 2, name: "Designer Backpack", price: 89, category: "Accessories", image: "https://www.unihandmade.com/cdn/shop/products/BACKPACK_8_d691f817-1cd5-4dd9-9ca2-df69a815e768.jpg?v=1616487700" },
  { id: 3, name: "Wireless Headphones", price: 199, category: "Electronics", image: "https://hottipsusa.com/cdn/shop/products/Pro_Overear_Wireless_Headphones_Main_White_websize_1024x1024.jpg?v=1670266033" },
  { id: 4, name: "Smart Watch", price: 299, category: "Electronics", image: "https://m.media-amazon.com/images/I/61I22cL7v+L._AC_UF894,1000_QL80_.jpg" },
  { id: 5, name: "Leather Wallet", price: 49, category: "Accessories", image: "https://www.galenleather.com/cdn/shop/products/no38-personalized-minimalist-hanmade-leather-wallet-brown_2048x.jpg?v=1536620105" },
  { id: 6, name: "Sunglasses", price: 149, category: "Accessories", image: "https://sunski.com/cdn/shop/files/sunski_polarized_sunglasses_baia_24.jpg?crop=center&height=1100&v=1748987571&width=1400" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Products
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of premium products
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Need Help Finding Something?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our AI shopping assistant is here to help you find exactly what you're looking for. Click the chat icon to get started!
          </p>
        </div>
      </section>

      <ChatAssistant />
    </div>
  );
};

export default Index;
