import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./types";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStructuredAssistant = (msg: ChatMessage) =>
    msg.role === "assistant" && msg.content.includes(":\n");

  return (
    <div className="chat-body">
      {messages.length === 0 && (
        <div className="chat-placeholder">
          <p>무엇이든 물어보세요 👋</p>
        </div>
      )}

      {messages.map((msg, i) => {
        const structured = isStructuredAssistant(msg);

        if (structured) {
          const [titleLine, ...rest] = msg.content.split("\n");
          return (
            <div key={i} className={`chat-msg assistant`}>
              <div className="chat-bubble">
                <div className="chat-title">{titleLine}</div>
                {rest.map((line, idx) => (
                  <div key={idx} className="chat-message">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div
            key={i}
            className={`chat-msg ${msg.role === "assistant" ? "assistant" : "user"}`}
          >
            <div className="chat-bubble">{msg.content}</div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
