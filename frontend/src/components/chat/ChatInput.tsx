import React, { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-area">
      <textarea
        className="chat-input"
        placeholder="메시지를 입력하세요..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <button className="send-btn" onClick={handleSend}>
        ⬆
      </button>
    </div>
  );
};

export default ChatInput;
