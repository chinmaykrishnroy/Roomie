"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserSession, loadUserSession } from "@/lib/storage";
import { OnboardingModal } from "@/components/identity/OnboardingModal";
import { SettingsModal } from "@/components/identity/SettingsModal";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { PublicRoomList } from "@/components/room/PublicRoomList";
import {
  IconSofa,
  IconGear,
  IconPlus,
  IconArrowRight,
  IconSparkles,
  IconUsers,
} from "@/components/icons/Icons";

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  useEffect(() => {
    const existing = loadUserSession();
    if (existing) {
      setSession(existing);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCodeInput.trim().toLowerCase();
    if (trimmed) {
      router.push(`/room/${encodeURIComponent(trimmed)}`);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Desktop App Shell Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ffe6db, #ff9e7d)",
              display: "grid",
              placeItems: "center",
              boxShadow: "3px 4px 10px rgba(210, 150, 130, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              flexShrink: 0,
            }}
          >
            <IconSofa size={22} color="var(--clay-primary-dark)" />
          </div>
          <span>Roomie</span>
          <span className="brand-badge">DESKTOP</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {session ? (
            <div
              onClick={() => setShowSettings(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px 5px 6px",
                borderRadius: "999px",
                background: "#ffffff",
                boxShadow: "var(--clay-shadow-button)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              title="Click to manage settings & identity"
            >
              <div className="avatar-sm">{getInitials(session.username)}</div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  color: "var(--clay-ink)",
                  maxWidth: "110px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.username}
              </span>
              <IconGear size={16} color="var(--clay-muted)" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="secondary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              Set Username
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCreateRoom(true)}
            style={{
              padding: "9px 18px",
              fontSize: "0.88rem",
              fontWeight: 800,
            }}
          >
            <IconPlus size={16} />
            <span>Create Room</span>
          </button>
        </div>
      </header>

      {/* Main Desktop Application Workspace */}
      <main
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "24px 16px 48px",
          width: "100%",
          flex: 1,
        }}
      >
        {/* Streamlined App Hero Deck (Claymorphic Command Capsule) */}
        <section
          style={{
            background: "linear-gradient(135deg, #fff3eb 0%, #ffe6d8 100%)",
            border: "1px solid rgba(255, 255, 255, 0.95)",
            borderRadius: "28px",
            boxShadow: "var(--clay-shadow-card)",
            padding: "32px 28px",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ maxWidth: "620px" }}>
              <div
                className="chip"
                style={{
                  background: "#ffffff",
                  marginBottom: "14px",
                  color: "var(--clay-peach-soft-dark)",
                  fontSize: "0.8rem",
                  padding: "6px 14px",
                }}
              >
                <IconSparkles size={14} color="var(--clay-primary)" />
                <span>Peer-to-Peer &amp; SFU Hybrid Audio/Video</span>
              </div>
              <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.6rem)", marginBottom: "10px", lineHeight: 1.18, color: "var(--clay-ink)" }}>
                Meet the person before you judge the profile.
              </h1>
              <p style={{ fontSize: "0.98rem", color: "var(--clay-muted)", lineHeight: 1.5 }}>
                Hop into casual 16-person rooms. Filter by location proximity, explore topics with semantic vector search, or share an instant private room code.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span className="badge" style={{ background: "#ffffff", color: "var(--clay-sage-dark)", border: "1px solid rgba(255,255,255,0.9)" }}>
                <IconUsers size={14} color="var(--clay-sage-dark)" />
                <span>Up to 16 Cameras Live</span>
              </span>
            </div>
          </div>

          {/* Integrated Quick Action & Code Joiner (No fixed min-width, zero mobile clipping) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowCreateRoom(true)}
              style={{
                padding: "12px 24px",
                fontSize: "0.95rem",
              }}
            >
              <IconPlus size={18} />
              <span>Host New Room</span>
            </button>

            {/* Quick Room Code Pill */}
            <form
              onSubmit={handleJoinWithCode}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                borderRadius: "999px",
                padding: "4px 4px 4px 16px",
                boxShadow: "var(--clay-shadow-button)",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                flex: "1 1 260px",
                maxWidth: "420px",
              }}
            >
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter room code..."
                style={{
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: "8px 4px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                className="secondary"
                style={{
                  padding: "9px 18px",
                  fontSize: "0.85rem",
                  borderRadius: "999px",
                  boxShadow: "none",
                  border: "none",
                  background: "var(--clay-peach-soft)",
                  color: "var(--clay-peach-soft-dark)",
                }}
              >
                <span>Join</span>
                <IconArrowRight size={14} />
              </button>
            </form>
          </div>
        </section>

        {/* Public Rooms Explorer Component */}
        <PublicRoomList />
      </main>

      {/* Desktop App Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          padding: "18px 24px",
          textAlign: "center",
          fontSize: "0.82rem",
          color: "var(--clay-muted)",
          fontWeight: 700,
          background: "rgba(253, 246, 240, 0.6)",
        }}
      >
        Roomie · Multi-Party Video &amp; Voice · 16 Participants · Adaptive Quality
      </footer>

      {/* Identity & Room Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={(sess) => {
          setSession(sess);
          setShowOnboarding(false);
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        session={session}
        onClose={() => setShowSettings(false)}
        onUpdate={(updated) => setSession(updated)}
        onReset={() => {
          setSession(null);
          setShowOnboarding(true);
        }}
      />

      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />
    </div>
  );
}
