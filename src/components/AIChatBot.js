"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, ArrowRight, Bot } from "lucide-react";
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

    // Only send role + content to API (strip suggestedPackage)
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
              bottom: 24,
              right: 24,
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.1)",
              zIndex: 4999,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={24} style={{ color: "#000" }} />
            
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
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
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: "min(400px, calc(100vw - 32px))",
              height: "min(600px, calc(100vh - 48px))",
              borderRadius: 20,
              background: "#0a0a0f",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 5000,
              boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 80px rgba(255,255,255,0.03)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #fff 0%, #ccc 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={18} style={{ color: "#000" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Pinowed AI</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                    Çevrimiçi
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
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
                padding: "16px 16px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
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
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2,
                    }}>
                      <Sparkles size={12} style={{ color: "#fff" }} />
                    </div>
                  )}
                  <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" 
                        ? "14px 14px 4px 14px" 
                        : "14px 14px 14px 4px",
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
                    }}>
                      {msg.content}
                    </div>
                    
                    {/* Package suggestion button */}
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
                          borderRadius: 12,
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
                          width: 28, height: 28, borderRadius: 8,
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

              {/* Loading indicator */}
              {isLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={12} style={{ color: "#fff" }} />
                  </div>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "14px 14px 14px 4px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: 4,
                  }}>
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }}
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 16px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.3)",
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
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: "#fff",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    maxHeight: 80,
                    lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
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
              <div style={{ 
                textAlign: "center", 
                fontSize: 9, 
                color: "rgba(255,255,255,0.15)", 
                marginTop: 8,
                letterSpacing: "0.05em",
              }}>
                Pinowed AI · Yapay Zeka Asistanı
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
