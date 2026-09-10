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
        maxWidth: "100vw",
        background: "var(--clay-card)",
        borderLeft: "1px solid var(--clay-line)",
        boxShadow: "-12px 0 35px rgba(0, 0, 0, 0.4)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--clay-line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--clay-bg-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "var(--clay-ink)" }}>
          <IconMessage size={18} />
          <span>Stage Chat</span>
        </div>
        <button type="button" onClick={onClose} className="secondary icon-btn" style={{ padding: "6px", minWidth: "36px", minHeight: "36px" }}>
          <IconClose size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--clay-muted)", marginTop: "48px", fontSize: "0.86rem" }}>
            No messages yet. Say hello to everyone!
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.userId === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isSelf ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clay-muted)", marginBottom: "3px" }}>
                  {m.sender} {isSelf && "(You)"}
                </div>
                <div
                  style={{
                    padding: "9px 14px",
                    borderRadius: "18px",
                    background: isSelf ? "var(--clay-primary)" : "var(--clay-bg-subtle)",
                    color: isSelf ? "var(--clay-primary-dark)" : "var(--clay-ink)",
                    boxShadow: isSelf
                      ? "3px 4px 12px rgba(217, 130, 99, 0.3)"
                      : "var(--clay-shadow-card)",
                    fontSize: "0.9rem",
                    wordBreak: "break-word",
                    border: "1px solid var(--clay-line)",
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
          padding: "14px 16px",
          borderTop: "1px solid var(--clay-line)",
          display: "flex",
          gap: "8px",
          background: "var(--clay-bg)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a chat message..."
          style={{ flex: 1, padding: "9px 16px", fontSize: "0.88rem", background: "var(--clay-surface-input)", color: "var(--clay-ink)", border: "1.5px solid var(--clay-line)", minWidth: 0 }}
        />
        <button type="submit" style={{ padding: "9px 16px" }}>
          <IconArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
