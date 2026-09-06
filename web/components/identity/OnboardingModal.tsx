"use client";

import React, { useState, useEffect } from "react";
import { UserSession, saveUserSession } from "@/lib/storage";
import { fetchGeneratedUsername } from "@/lib/api";
import { IconDice, IconArrowRight, IconSparkles } from "@/components/icons/Icons";

interface Props {
  isOpen: boolean;
  onComplete: (session: UserSession) => void;
}

export function OnboardingModal({ isOpen, onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !username) {
      rollUsername();
    }
  }, [isOpen]);

  const rollUsername = async () => {
    try {
      setLoading(true);
      const name = await fetchGeneratedUsername();
      setUsername(name);
    } catch {
      const adjectives = ["Cosmic", "Swift", "Chill", "Neon", "Brave", "Vibrant"];
      const nouns = ["Otter", "Falcon", "Panda", "Tiger", "Penguin", "Cheetah"];
      const fallback =
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        nouns[Math.floor(Math.random() * nouns.length)];
      setUsername(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const session: UserSession = {
      id: "u_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      username: trimmed,
      videoMirrored: true,
    };
    saveUserSession(session);
    onComplete(session);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span
            className="badge"
            style={{ background: "var(--clay-peach-soft)", color: "var(--clay-peach-soft-dark)", padding: "5px 12px", fontSize: "0.8rem" }}
          >
            <IconSparkles size={14} /> Roomie
          </span>
        </div>

        <h2 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Choose your username</h2>
        <p style={{ marginBottom: "24px" }}>
          We generated a random name for you. You can keep it, roll another, or type your own.
        </p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. SwiftFalcon"
            style={{ flex: 1, fontSize: "1.1rem", fontWeight: 700 }}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
          <button
            type="button"
            onClick={rollUsername}
            disabled={loading}
            className="secondary"
            title="Generate another random name"
          >
            <IconDice size={18} />
            <span>Roll</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!username.trim()}
          style={{ width: "100%", padding: "14px", fontSize: "1.05rem" }}
        >
          <span>Enter Roomie</span>
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
