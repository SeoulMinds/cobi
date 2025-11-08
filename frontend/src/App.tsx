import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ChatAssistant } from "@/components/ChatAssistant";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ChatWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isProductDetailPage = location.pathname.startsWith('/product/');

  // Check if we're on product detail page with fromChat state
  const fromChat = (location.state as { fromChat?: boolean })?.fromChat || false;

  // Handle chat open on product detail page - switch to split view
  const handleChatOpen = () => {
    if (isProductDetailPage) {
      // Re-navigate with fromChat: true to trigger split view
      navigate(location.pathname, { state: { fromChat: true }, replace: true });
    }
  };

  // Show floating chat on:
  // 1. Non-product pages (home, etc.)
  // 2. Product detail pages when NOT coming from chat (fromChat === false)
  // Don't show on product detail pages when coming from chat (split view handles it)
  if (isProductDetailPage && fromChat) {
    return null;
  }

  return <ChatAssistant onChatOpen={handleChatOpen} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWrapper />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
