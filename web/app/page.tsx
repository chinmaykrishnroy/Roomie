"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserSession, loadUserSession } from "@/lib/storage";
import { OnboardingModal } from "@/components/identity/OnboardingModal";
import { SettingsModal } from "@/components/identity/SettingsModal";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { PublicRoomList } from "@/components/room/PublicRoomList";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* App Header */}
      <header className="app-header">
        <div className="brand">
          <span>🛋️ Roomie</span>
          <span className="brand-badge">BETA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {session ? (
            <div
              onClick={() => setShowSettings(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px 4px 6px",
                border: "2px solid var(--ink)",
                borderRadius: "999px",
                background: "var(--paper)",
                boxShadow: "2px 2px 0 var(--ink)",
                cursor: "pointer",
              }}
              title="Click to open settings"
            >
              <div className="avatar-sm">{getInitials(session.username)}</div>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{session.username}</span>
              <span style={{ fontSize: "0.8rem" }}>⚙️</span>
            </div>
          ) : (
            <button type="button" onClick={() => setShowOnboarding(true)} className="secondary">
              Set Username
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1040px", margin: "0 auto", padding: "32px 20px", width: "100%", flex: 1 }}>
        {/* Hero Section */}
        <section
          className="card"
          style={{
            background: "var(--lilac)",
            padding: "36px 28px",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <span
              className="chip"
              style={{ background: "var(--accent)", marginBottom: "12px", border: "2px solid var(--ink)" }}
            >
              🚀 WebRTC Multi-Party Rooms
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "8px" }}>
              Meet the person before you judge the profile.
            </h1>
            <p style={{ fontSize: "1.1rem", color: "var(--ink)", maxWidth: "680px" }}>
              Join casual voice and video rooms with up to 16 people. Discover rooms by topic and nearby location, or create your own private or public space in one click.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setShowCreateRoom(true)}
              style={{ padding: "14px 24px", fontSize: "1.05rem" }}
            >
              ✨ Create Room
            </button>

            <form
              onSubmit={handleJoinWithCode}
              style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter room code..."
                style={{ padding: "12px 16px", minWidth: "220px", fontWeight: 700 }}
              />
              <button type="submit" className="secondary" style={{ padding: "12px 20px" }}>
                Join Code →
              </button>
            </form>
          </div>
        </section>

        {/* Public Rooms Explorer */}
        <PublicRoomList />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "2px solid var(--line)",
          padding: "20px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "var(--muted)",
          fontWeight: 700,
        }}
      >
        Roomie · Multi-Party Video & Voice · 16 Participants · Adaptive Bandwidth
      </footer>

      {/* Modals */}
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
