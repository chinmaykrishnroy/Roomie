"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserSession, loadUserSession } from "@/lib/storage";
import { OnboardingModal } from "@/components/identity/OnboardingModal";
import { SettingsModal } from "@/components/identity/SettingsModal";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { PublicRoomList, CATEGORIES } from "@/components/room/PublicRoomList";
import {
  IconSofa,
  IconGear,
  IconPlus,
  IconArrowRight,
  IconSearch,
  IconUsers,
  IconSparkles,
} from "@/components/icons/Icons";

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="app-shell">
      {/* Left Navigation Sidebar (Desktop Application Feel) */}
      <aside className="app-sidebar">
        <div>
          {/* Brand Header */}
          <div className="sidebar-header">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ffe6db, #ff9e7d)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 6px rgba(195, 130, 105, 0.25)",
                flexShrink: 0,
              }}
            >
              <IconSofa size={20} color="var(--clay-primary-dark)" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.15rem", color: "var(--clay-ink)", lineHeight: 1.1 }}>
                Roomie
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--clay-muted)", letterSpacing: "0.05em" }}>
                LIVE AUDIO &amp; VIDEO
              </div>
            </div>
          </div>

          {/* Quick Host Button */}
          <div style={{ padding: "16px 4px 6px" }}>
            <button
              type="button"
              onClick={() => setShowCreateRoom(true)}
              style={{
                width: "100%",
                padding: "11px 16px",
                fontSize: "0.88rem",
                borderRadius: "14px",
              }}
            >
              <IconPlus size={16} />
              <span>Host New Stage</span>
            </button>
          </div>

          {/* Channels / Categories Navigation */}
          <div className="sidebar-nav">
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--clay-muted)", padding: "8px 10px 4px" }}>
              CHANNELS &amp; TOPICS
            </div>

            {CATEGORIES.map((cat) => {
              const CatIcon = cat.Icon;
              const isActive = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                >
                  <CatIcon size={16} color={isActive ? "var(--clay-primary)" : "var(--clay-muted)"} />
                  <span>{cat.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer / User Capsule */}
        <div className="sidebar-footer">
          {session ? (
            <div
              onClick={() => setShowSettings(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "16px",
                background: "#ffffff",
                border: "1px solid rgba(225, 175, 155, 0.3)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              title="Manage Settings & Profile"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div className="avatar-sm">{getInitials(session.username)}</div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.86rem",
                      color: "var(--clay-ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {session.username}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700 }}>Online</div>
                </div>
              </div>
              <IconGear size={16} color="var(--clay-muted)" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="secondary"
              style={{ width: "100%", padding: "9px" }}
            >
              Set Username
            </button>
          )}
        </div>
      </aside>

      {/* Main Fluid Canvas */}
      <main className="app-main-canvas">
        {/* Top Application Bar */}
        <header className="app-topbar">
          {/* Mobile Brand Mark (Visible only on mobile/tablet when sidebar is hidden) */}
          <div className="mobile-only" style={{ alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ffe6db, #ff9e7d)",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 6px rgba(195, 130, 105, 0.2)",
              }}
            >
              <IconSofa size={18} color="var(--clay-primary-dark)" />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--clay-ink)" }}>Roomie</span>
          </div>

          {/* Integrated Search Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              borderRadius: "999px",
              padding: "2px 14px",
              border: "1px solid rgba(225, 175, 155, 0.35)",
              flex: "1 1 240px",
              maxWidth: "520px",
            }}
          >
            <IconSearch size={16} color="var(--clay-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stages by topic, vibes or vector keywords..."
              style={{
                border: "none",
                background: "transparent",
                boxShadow: "none",
                padding: "8px 0",
                fontSize: "0.88rem",
                flex: 1,
                minWidth: 0,
              }}
            />
          </div>

          {/* Quick Room Code Input & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {session && (
              <div
                className="mobile-only"
                onClick={() => setShowSettings(true)}
                style={{ cursor: "pointer", flexShrink: 0 }}
                title="Settings"
              >
                <div className="avatar-sm">{getInitials(session.username)}</div>
              </div>
            )}
            <form
              onSubmit={handleJoinWithCode}
              style={{
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                borderRadius: "999px",
                padding: "2px 2px 2px 12px",
                border: "1px solid rgba(225, 175, 155, 0.35)",
                width: "220px",
              }}
            >
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Code..."
                style={{
                  border: "none",
                  background: "transparent",
                  boxShadow: "none",
                  padding: "6px 0",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                className="peach-soft"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  borderRadius: "999px",
                }}
              >
                <span>Join</span>
                <IconArrowRight size={12} />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowCreateRoom(true)}
              style={{
                padding: "9px 18px",
                fontSize: "0.85rem",
              }}
            >
              <IconPlus size={15} />
              <span>Host</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="app-content">
          {/* Wide Hero Deck Banner */}
          <section
            style={{
              background: "linear-gradient(135deg, #fff3eb 0%, #ffe4d6 100%)",
              border: "1px solid rgba(225, 175, 155, 0.35)",
              borderRadius: "24px",
              boxShadow: "var(--clay-shadow-card)",
              padding: "24px 28px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ maxWidth: "680px" }}>
              <div
                className="chip"
                style={{
                  background: "#ffffff",
                  marginBottom: "10px",
                  color: "var(--clay-peach-soft-dark)",
                  fontSize: "0.78rem",
                  padding: "5px 12px",
                }}
              >
                <IconSparkles size={14} color="var(--clay-primary)" />
                <span>WebRTC Mesh &amp; Pion SFU Engine</span>
              </div>
              <h1 style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)", marginBottom: "8px", color: "var(--clay-ink)", lineHeight: 1.2 }}>
                Meet the person before you judge the profile.
              </h1>
              <p style={{ fontSize: "0.92rem", color: "var(--clay-muted)", lineHeight: 1.45 }}>
                Casual multi-party rooms for up to 16 participants. Zero waiting rooms, adaptive bitrate scaling, and location-ranked discovery.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
              <span className="badge" style={{ background: "#ffffff", color: "var(--clay-sage-dark)" }}>
                <IconUsers size={14} color="#10b981" />
                <span>16 Cameras Concurrent</span>
              </span>
            </div>
          </section>

          {/* Fluid Sound Stages Grid */}
          <PublicRoomList
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </main>

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
