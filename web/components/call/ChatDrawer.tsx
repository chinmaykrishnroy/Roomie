"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/webrtc";
import { IconClose, IconMessage, IconArrowRight } from "@/components/icons/Icons";

interface Props {
  isOpen: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export function ChatDrawer({
  isOpen,
  messages,
  currentUserId,
  onSendMessage,
  onClose,
}: Props) {
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "340px",
        maxWidth: "92vw",
        background: "var(--clay-card)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.8)",
        boxShadow: "-12px 0 35px rgba(0, 0, 0, 0.2)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.8)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "var(--clay-lilac-dark)" }}>
          <IconMessage size={20} />
          <span>Room Chat</span>
        </div>
        <button type="button" onClick={onClose} className="secondary icon-btn" style={{ padding: "6px" }}>
          <IconClose size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--clay-muted)", marginTop: "48px", fontSize: "0.88rem" }}>
            No messages yet. Send a hello!
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.userId === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isSelf ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clay-muted)", marginBottom: "3px" }}>
                  {m.sender} {isSelf && "(You)"}
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "18px",
                    background: isSelf ? "var(--clay-primary)" : "#ffffff",
                    color: isSelf ? "var(--clay-primary-dark)" : "var(--clay-ink)",
                    boxShadow: isSelf
                      ? "4px 4px 10px rgba(167, 243, 208, 0.4)"
                      : "4px 4px 10px rgba(166, 178, 198, 0.25)",
                    fontSize: "0.92rem",
                    wordBreak: "break-word",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          display: "flex",
          gap: "10px",
          background: "var(--clay-card)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1, padding: "10px 16px", fontSize: "0.92rem" }}
        />
        <button type="submit" style={{ padding: "10px 16px" }}>
          <IconArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
