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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* App Header */}
      <header className="app-header">
        <div className="brand">
          <IconSofa size={26} color="var(--clay-lilac-dark)" />
          <span>Roomie</span>
          <span className="brand-badge">BETA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {session ? (
            <div
              onClick={() => setShowSettings(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 14px 6px 8px",
                borderRadius: "999px",
                background: "#ffffff",
                boxShadow: "var(--clay-shadow-button)",
                cursor: "pointer",
              }}
              title="Click to open settings"
            >
              <div className="avatar-sm">{getInitials(session.username)}</div>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{session.username}</span>
              <IconGear size={16} color="var(--clay-muted)" />
            </div>
          ) : (
            <button type="button" onClick={() => setShowOnboarding(true)} className="secondary">
              Set Username
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px 20px", width: "100%", flex: 1 }}>
        {/* Claymorphic Hero Section */}
        <section
          className="card"
          style={{
            background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
            padding: "40px 32px",
            marginBottom: "36px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            borderRadius: "32px",
          }}
        >
          <div>
            <div
              className="chip"
              style={{
                background: "#ffffff",
                marginBottom: "16px",
                color: "var(--clay-lilac-dark)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IconSparkles size={16} />
              <span>WebRTC Multi-Party Rooms</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", marginBottom: "12px", color: "#1e1b4b" }}>
              Meet the person before you judge the profile.
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#475569", maxWidth: "680px" }}>
              Join casual voice and video rooms with up to 16 people. Discover rooms by topic and nearby location, or create your own private or public space in one click.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setShowCreateRoom(true)}
              style={{ padding: "14px 26px", fontSize: "1.05rem" }}
            >
              <IconPlus size={20} />
              <span>Create Room</span>
            </button>

            <form
              onSubmit={handleJoinWithCode}
              style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter room code..."
                style={{ padding: "13px 18px", minWidth: "220px", fontWeight: 700 }}
              />
              <button type="submit" className="secondary" style={{ padding: "13px 22px" }}>
                <span>Join Code</span>
                <IconArrowRight size={18} />
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
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          padding: "24px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "var(--clay-muted)",
          fontWeight: 700,
        }}
      >
        Roomie · Multi-Party Video &amp; Voice · 16 Participants · Adaptive Bandwidth
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
