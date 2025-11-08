import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send } from "lucide-react";
import { sendMessage, getMessages, MessageRequest } from "@/api";

interface Message {
  id: string;
  user_message: string;
  ai_response: string;
  model?: string;
}

export const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");

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

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessageText = inputValue;
    setInputValue("");
    setIsThinking(true);
    setError("");

    try {
      const messageRequest: MessageRequest = { text: userMessageText };
      const response = await sendMessage(messageRequest);

      // Add the new message to the messages list
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button - Hidden when chat is open */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed left-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-lg bg-hero-gradient hover:opacity-90 transition-all"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-full md:w-96 bg-background border-r border-border shadow-xl z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-full bg-background/80 border border-border z-10"
              aria-label="Close chat"
            >
              <X className="h-7 w-7 text-foreground stroke-[3]" />
            </Button>
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
