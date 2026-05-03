"use client";

import { useState, useEffect, useRef } from "react";
import { getChatHistory, sendChatMessage } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatSidebar({ boardId, onBoardUpdate }: { boardId: number, onBoardUpdate: (newBoard: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try {
      const history = await getChatHistory(boardId);
      setMessages(history);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(boardId, userMessage);
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
      if (response.board) {
        onBoardUpdate(response.board);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary-blue)] to-[var(--secondary-purple)] text-2xl text-white shadow-xl transition-transform hover:scale-110 active:scale-95"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Chat Sidebar */}
      <div
        className={`fixed bottom-24 right-6 z-40 flex h-[600px] max-h-[80vh] w-96 flex-col overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white shadow-2xl transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between bg-[var(--surface)] px-6 py-4 border-b border-[var(--stroke)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="font-display font-bold text-[var(--navy-dark)]">AI Assistant</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-sm text-[var(--gray-text)] mt-10">
              Ask me to add, move, or delete cards!
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--primary-blue)] text-white rounded-br-sm"
                    : "bg-white text-[var(--navy-dark)] border border-[var(--stroke)] shadow-sm rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white border border-[var(--stroke)] shadow-sm px-4 py-3 rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.2s" }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-[var(--stroke)] bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g. Add a bug task in To Do..."
              className="flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary-blue)]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center rounded-xl bg-[var(--accent-yellow)] px-4 py-2.5 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
