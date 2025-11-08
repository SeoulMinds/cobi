import React, { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { ChatMessage } from "./types";
import "./chat.css";

interface ThinkingStep {
  title: string;
  message: string;
}

const ChatPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const thinkingSteps: ThinkingStep[] = [
    { title: "구매 이력 로딩중", message: "지난번에 산 티셔츠, 코트.." },
    { title: "재고 현황 조회중", message: "티셔츠 23종, 코트 11종 확인중.." },
    { title: "최적 상품 분류중", message: "가격대와 구매 빈도를 비교중.." },
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // 🧩 단계별 Thinking 출력
      for (const step of thinkingSteps) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `${step.title}:\n${step.message}` },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      // ✅ 실제 모델 응답
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `추천 결과:\n${data.reply ?? "서버 응답이 없습니다."}`,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ 서버와 통신할 수 없습니다." },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* 사이드바가 닫혀 있을 때만 버튼 표시 */}
      {!open && (
        <button className="chat-toggle-btn" onClick={() => setOpen(true)}>
          💬
        </button>
      )}

      <div className={`chat-panel ${open ? "open" : ""}`}>
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-logo">🤖</span>
            <h3>AI Assistant</h3>
          </div>
          <button className="chat-close-btn" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <ChatMessages messages={messages} />
        <ChatInput onSend={sendMessage} />
      </div>
    </>
  );
};

export default ChatPanel;
