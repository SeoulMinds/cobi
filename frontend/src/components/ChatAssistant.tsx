import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send } from "lucide-react";
import { sendMessage, getMessages, getProducts, MessageRequest, Product } from "@/api";

interface Message {
  id: string;
  user_message: string;
  ai_response: string;
  model?: string;
  products?: Product[];
}

interface ChatAssistantProps {
  splitView?: boolean;
}

export const ChatAssistant = ({ splitView = false }: ChatAssistantProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(splitView); // Auto-open in split view
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");

  // Auto-open chat when in split view mode
  useEffect(() => {
    if (splitView) {
      setIsOpen(true);
    }
  }, [splitView]);

  // Load existing messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await getMessages();
        if (response.messages && response.messages.length > 0) {
          setMessages(response.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        // Don't show error to user, just start with empty chat
      }
    };

    loadMessages();
  }, []);

  // Simulate LLM response with product recommendations
  const simulateLLMResponse = async (userMessage: string): Promise<{ response: string; products: Product[] }> => {
    try {
      // Fetch random products from the API
      const productsData = await getProducts(1, 20);

      // Randomly select 2-3 products
      const numProducts = Math.floor(Math.random() * 2) + 2; // 2 or 3 products
      const shuffled = productsData.items.sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, numProducts);

      // Generate a simulated response
      const responses = [
        "Great question! Based on what you're looking for, I found some perfect matches:",
        "I'd be happy to help! Here are some products that might interest you:",
        "Let me show you what we have that matches your needs:",
        "Perfect! I found some excellent options for you:",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      return {
        response: randomResponse,
        products: selectedProducts
      };
    } catch (err) {
      console.error('Error fetching products:', err);
      return {
        response: "I'm here to help! Could you tell me more about what you're looking for?",
        products: []
      };
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessageText = inputValue;
    setInputValue("");
    setIsThinking(true);
    setError("");

    try {
      // Simulate LLM call with product recommendations
      const { response: aiResponse, products } = await simulateLLMResponse(userMessageText);

      // Create a simulated message
      const simulatedMessage: Message = {
        id: Date.now().toString(),
        user_message: userMessageText,
        ai_response: aiResponse,
        model: "Simulated LLM (Demo)",
        products: products
      };

      setMessages((prev) => [...prev, simulatedMessage]);

      // Optionally, still send to backend for logging
      // Uncomment below if you want to log to backend as well
      // try {
      //   const messageRequest: MessageRequest = { text: userMessageText };
      //   await sendMessage(messageRequest);
      // } catch (err) {
      //   console.error('Failed to log message to backend:', err);
      // }

    } catch (err) {
      console.error('Failed to process message:', err);
      setError('Failed to process message. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button - Hidden when chat is open or in split view */}
      {!isOpen && !splitView && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed right-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-lg bg-hero-gradient hover:opacity-90 transition-all"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      <div
        className={`${splitView
          ? "relative h-full w-full border-l border-border"
          : "fixed right-0 top-16 h-[calc(100vh-4rem)] w-full md:w-96 shadow-xl z-40 transition-transform duration-300 ease-in-out"
          } bg-background border-border ${!splitView && (isOpen ? "translate-x-0" : "translate-x-full")
        }`}
      >
        <Card className="h-full rounded-none border-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hero-gradient flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Shopping Assistant</h3>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
            </div>
            {/* Close button - only in floating mode */}
            {!splitView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-full bg-background/80 border border-border z-10"
                aria-label="Close chat"
              >
                <X className="h-7 w-7 text-foreground stroke-[3]" />
              </Button>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && !isThinking && (
                <div className="text-center text-muted-foreground py-8">
                  <p>Hi! I'm your shopping assistant.</p>
                  <p className="text-sm mt-2">How can I help you find the perfect product today?</p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-hero-gradient text-primary-foreground">
                      <p className="text-sm">{message.user_message}</p>
                    </div>
                  </div>
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted text-foreground">
                      <p className="text-sm">{message.ai_response}</p>
                      {message.model && (
                        <p className="text-xs text-muted-foreground mt-1">{message.model}</p>
                      )}
                    </div>
                  </div>
                  {/* Product Recommendations */}
                  {message.products && message.products.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] space-y-2">
                        {message.products.map((product) => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3 p-3">
                              <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.title || 'Product'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-foreground truncate">
                                  {product.title || 'Product'}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {Array.isArray(product.category)
                                    ? product.category.join(', ')
                                    : product.brand || 'Product'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-lg font-bold text-foreground">
                                    ${product.price || 0}
                                  </span>
                                  {product.original_price && product.original_price > (product.price || 0) && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ${product.original_price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-xs text-muted-foreground">Analyzing your request...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            {error && (
              <div className="mb-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={isThinking}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-hero-gradient hover:opacity-90"
                disabled={isThinking}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
