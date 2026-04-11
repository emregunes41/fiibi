"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Lock body scroll when chat is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Send initial greeting when first opened
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      fetchAIReply([]);
    }
  }, [isOpen, hasGreeted, messages.length]);

  const fetchAIReply = async (chatMessages) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.reply,
          suggestedPackage: data.suggestedPackage || null
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Bağlantı hatası oluştu, lütfen tekrar deneyin." 
      }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    
    setInput("");
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    await fetchAIReply(apiMessages);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ═══ FAB Button ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: "fixed",
              bottom: 90,
              right: 20,
              width: 46,
              height: 46,
              borderRadius: 0,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
              zIndex: 4999,
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={20} style={{ color: "#fff" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ Chat Window ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="chatbot-window"
            style={{
              position: "fixed",
              zIndex: 5000,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#0a0a0f",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 80px rgba(255,255,255,0.03)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 0,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MessageCircle size={15} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Pinowed</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 0, background: "#fff" }} />
                    Çevrimiçi
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 0,
                  padding: 6,
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "16px 14px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                WebkitOverflowScrolling: "touch",
                minHeight: 0,
              }}
            >
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 8,
                }}>
                  {msg.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 0, flexShrink: 0,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2,
                    }}>
                      <MessageCircle size={11} style={{ color: "rgba(255,255,255,0.6)" }} />
                    </div>
                  )}
                  <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: 0,
                      background: msg.role === "user" 
                        ? "#fff" 
                        : "rgba(255,255,255,0.06)",
                      color: msg.role === "user" ? "#000" : "#fff",
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontWeight: msg.role === "user" ? 500 : 400,
                      border: msg.role === "user" 
                        ? "none" 
                        : "1px solid rgba(255,255,255,0.06)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>
                    
                    {msg.suggestedPackage && (
                      <motion.a
                        href="/booking"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 0,
                          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          textDecoration: "none",
                          color: "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                            Önerilen Paket
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{msg.suggestedPackage}</div>
                        </div>
                        <div style={{
                          width: 28, height: 28, borderRadius: 0,
                          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <ArrowRight size={14} style={{ color: "#000" }} />
                        </div>
                      </motion.a>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 0, flexShrink: 0,
                    background: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MessageCircle size={11} style={{ color: "rgba(255,255,255,0.6)" }} />
                  </div>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 0,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: 4,
                  }}>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      style={{ width: 6, height: 6, borderRadius: 0, background: "rgba(255,255,255,0.5)" }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      style={{ width: 6, height: 6, borderRadius: 0, background: "rgba(255,255,255,0.5)" }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      style={{ width: 6, height: 6, borderRadius: 0, background: "rgba(255,255,255,0.5)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 14px",
              paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.5)",
              flexShrink: 0,
            }}>
              <div style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Bir şey sorun..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 0,
                    padding: "12px 14px",
                    fontSize: 16,
                    color: "#fff",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    maxHeight: 80,
                    lineHeight: 1.4,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 0,
                    background: input.trim() && !isLoading ? "#fff" : "rgba(255,255,255,0.06)",
                    border: "none",
                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <Send size={16} style={{ color: input.trim() && !isLoading ? "#000" : "rgba(255,255,255,0.2)" }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .chatbot-window {
          bottom: 24px;
          right: 16px;
          width: min(380px, calc(100vw - 32px));
          height: min(600px, calc(100vh - 48px));
          border-radius: 0;
        }
        @media (max-width: 480px) {
          .chatbot-window {
            inset: 0 !important;
            width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </>
  );
}
