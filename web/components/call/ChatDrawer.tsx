"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/webrtc";

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
        width: "320px",
        maxWidth: "90vw",
        background: "var(--paper)",
        borderLeft: "3px solid var(--ink)",
        boxShadow: "-4px 0 0 var(--ink)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "2px solid var(--ink)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--lilac)",
        }}
      >
        <h3 style={{ fontSize: "1.1rem" }}>💬 Room Chat</h3>
        <button type="button" onClick={onClose} className="secondary icon-btn" style={{ padding: "4px 8px" }}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", marginTop: "40px", fontSize: "0.85rem" }}>
            No messages yet. Send a hello! 👋
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
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", marginBottom: "2px" }}>
                  {m.sender} {isSelf && "(You)"}
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "12px",
                    border: "2px solid var(--ink)",
                    background: isSelf ? "var(--accent)" : "var(--surface-soft)",
                    boxShadow: "2px 2px 0 var(--ink)",
                    fontSize: "0.9rem",
                    wordBreak: "break-word",
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
          padding: "12px",
          borderTop: "2px solid var(--ink)",
          display: "flex",
          gap: "8px",
          background: "var(--paper)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1, padding: "8px 12px", fontSize: "0.9rem" }}
        />
        <button type="submit" style={{ padding: "8px 14px" }}>
          Send
        </button>
      </form>
    </div>
  );
}
