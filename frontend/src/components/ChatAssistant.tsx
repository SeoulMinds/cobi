import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import { sendMessage, MessageRequest, Product } from "@/api";

interface Message {
  id: string;
  user_message: string;
  ai_response: string;
  model?: string;
  products?: Product[];
}

interface ChatAssistantProps {
  splitView?: boolean;
  onChatOpen?: () => void;
}

const CHAT_STORAGE_KEY = 'cobi_chat_messages';

export const ChatAssistant = ({ splitView = false, onChatOpen }: ChatAssistantProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(splitView); // Auto-open in split view
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on initial mount
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Failed to load chat messages:', err);
      return [];
    }
  });
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");

  // Auto-open chat when in split view mode
  useEffect(() => {
    if (splitView) {
      setIsOpen(true);
    }
  }, [splitView]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save chat messages:', err);
    }
  }, [messages]);

  // Notify parent when chat is opened (for switching to split view)
  const handleOpen = () => {
    setIsOpen(true);
    if (onChatOpen) {
      onChatOpen();
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessageText = inputValue;
    setInputValue("");
    setIsThinking(true);
    setError("");

    try {
      // Send message to backend API with Gemini + product search
      const messageRequest: MessageRequest = {
        text: userMessageText,
        user_id: "demo-user" // You can make this dynamic if you have user auth
      };

      const response = await sendMessage(messageRequest);

      // Add the message to the UI
      const newMessage: Message = {
        id: response.id,
        user_message: response.user_message,
        ai_response: response.ai_response,
        model: response.model,
        products: response.products || []
      };

      setMessages((prev) => [...prev, newMessage]);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button - Hidden when chat is open or in split view */}
      {!isOpen && !splitView && (
        <Button
          onClick={handleOpen}
          size="lg"
          className="fixed right-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-lg bg-hero-gradient hover:opacity-90 transition-all"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      <div
        className={`${splitView
          ? "relative w-full border-l border-border flex flex-col h-full"
          : "fixed right-0 top-16 h-[calc(100vh-4rem)] w-full md:w-96 shadow-xl z-40 transition-transform duration-300 ease-in-out"
          } bg-background border-border ${!splitView && (isOpen ? "translate-x-0" : "translate-x-full")
        }`}
      >
        <Card className={`${splitView ? 'h-full' : 'h-full'} rounded-none border-0 flex flex-col`}>
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
            <div className="flex items-center gap-2">
              {/* Clear chat button */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  className="hover:bg-muted shrink-0 rounded-full"
                  aria-label="Clear chat"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
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
                              // Navigate with state indicating this came from chat
                              navigate(`/product/${product.id}`, { state: { fromChat: true } });
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
