"use client";

import { useState, useEffect, useRef } from "react";
import { getChatHistory, sendChatMessage, clearChatHistory, type BoardDetailResponse } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Add a bug fix card to To Do",
  "Move all done tasks to Backlog",
  "Create a high-priority design card",
];

export default function ChatSidebar({
  boardId, onBoardUpdate
}: { boardId: number; onBoardUpdate: (b: BoardDetailResponse) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) loadHistory();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try { setMessages(await getChatHistory(boardId)); }
    catch (err) { console.error("Failed to load history", err); }
  };

  const handleClear = async () => {
    try { await clearChatHistory(boardId); setMessages([]); }
    catch (err) { console.error("Failed to clear history", err); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);
    try {
      const res = await sendChatMessage(boardId, msg);
      setMessages(prev => [...prev, { role: "assistant", content: res.message }]);
      if (res.board) onBoardUpdate(res.board);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: 52, height: 52,
          background: isOpen ? 'var(--surface)' : 'var(--primary)',
          color: isOpen ? 'var(--text-2)' : '#fff',
          border: isOpen ? '1.5px solid var(--border-mid)' : 'none',
          boxShadow: isOpen ? 'var(--shadow-md)' : '0 4px 20px rgba(59, 91, 219, 0.35)',
        }}
        aria-label="Toggle AI assistant"
      >
        {isOpen
          ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          : <SparkleIcon />
        }
      </button>

      {/* Chat panel — responsive via .chat-panel class in globals.css */}
      {isOpen && (
        <div className="chat-panel animate-slide-up">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                style={{ background: 'var(--primary-light)' }}
              >
                <SparkleIcon size={14} color="var(--primary)" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: 'var(--text)' }}>
                  AI Assistant
                </p>
                <p className="text-[11px] leading-none" style={{ color: 'var(--text-3)' }}>
                  Manage your board with AI
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-sm text-xs"
              style={{ color: 'var(--text-3)', fontSize: 12 }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
            style={{ background: 'var(--surface-2)' }}
          >
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--primary-light)' }}
                >
                  <SparkleIcon size={22} color="var(--primary)" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                    What can I help with?
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                    Ask me to add, move, or update cards.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-lg transition-colors font-medium"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--primary-mid)';
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.background = 'var(--primary-light)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-2)';
                        e.currentTarget.style.background = 'var(--surface)';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: 'var(--primary-light)' }}
                  >
                    <SparkleIcon size={12} color="var(--primary)" />
                  </div>
                )}
                <div
                  className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-[1.5]"
                  style={msg.role === "user"
                    ? { background: 'var(--primary)', color: '#fff', borderBottomRightRadius: 6 }
                    : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderBottomLeftRadius: 6, boxShadow: 'var(--shadow-sm)' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                  style={{ background: 'var(--primary-light)' }}
                >
                  <SparkleIcon size={12} color="var(--primary)" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl ai-dots"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderBottomLeftRadius: 6 }}
                >
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AI to update your board…"
              className="field-input flex-1 text-sm"
              style={{ padding: '9px 14px', borderRadius: 10 }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, paddingLeft: 16, paddingRight: 16 }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function SparkleIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.5 5.8 20.9l2.4-7.2L2 9.2h7.6L12 2z"
        fill={color}
      />
    </svg>
  );
}
