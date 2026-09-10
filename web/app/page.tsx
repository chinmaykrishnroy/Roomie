"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserSession, loadUserSession } from "@/lib/storage";
import { Room } from "@/lib/api";
import { OnboardingModal } from "@/components/identity/OnboardingModal";
import { SettingsModal } from "@/components/identity/SettingsModal";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { PublicRoomList } from "@/components/room/PublicRoomList";
import { useTheme } from "@/lib/theme";
import {
  RoomieAppIcon,
  IconHome,
  IconCompass,
  IconPlus,
  IconUser,
  IconSearch,
  IconArrowRight,
  IconLink,
  IconSun,
  IconMoon,
  IconDice,
  IconFlame,
  IconRadio,
  IconSparkles,
} from "@/components/icons/Icons";

const EXPLORE_VIBES = [
  { label: "All Vibes", query: "" },
  { label: "🎧 Late Night Lo-Fi", query: "late night lofi relax chill music" },
  { label: "🎮 Gaming & Co-op", query: "gaming discord esports steam coop" },
  { label: "💻 Tech & Startups", query: "software programming tech startups engineering" },
  { label: "☕ Casual Hangout", query: "casual coffee hangout friendly talk" },
  { label: "🎨 Creative & Art", query: "art design creative music writing" },
  { label: "🚀 Deep Convo", query: "deep talk philosophy science intellectual" },
];

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "explore">("home");
  const [exploreFilter, setExploreFilter] = useState<"all" | "live" | "near">("all");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedRooms, setLoadedRooms] = useState<Room[]>([]);
  const [rollingDice, setRollingDice] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const existing = loadUserSession();
    if (existing) {
      setSession(existing);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCodeInput.trim().toLowerCase();
    if (trimmed) {
      router.push(`/room/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSurpriseMe = () => {
    setRollingDice(true);
    setTimeout(() => {
      setRollingDice(false);
      // Prioritize room with active participants, or any public room
      const activeRooms = loadedRooms.filter((r) => r.participantCount > 0);
      const pool = activeRooms.length > 0 ? activeRooms : loadedRooms;

      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        router.push(`/room/${encodeURIComponent(pool[randomIndex].code)}`);
      } else {
        setShowCreateRoom(true);
      }
    }, 450);
  };

  const handleSelectVibe = (query: string) => {
    setSelectedVibe(query);
    setSearchQuery(query);
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const totalLiveParticipants = loadedRooms.reduce(
    (acc, r) => acc + (r.participantCount || 0),
    0
  );

  return (
    <div className="app-shell">
      {/* Ambient Fluid Aura Mesh Background (Hardware Accelerated Graphics) */}
      <div className="ambient-aura" aria-hidden="true">
        <div className="aura-blob aura-blob-1" />
        <div className="aura-blob aura-blob-2" />
        <div className="aura-blob aura-blob-3" />
      </div>

      {/* Desktop Navigation Rail */}
      <nav className="nav-rail">
        <div className="nav-rail-top">
          <div
            className="rail-logo"
            style={{ background: "transparent", boxShadow: "none", cursor: "pointer" }}
            onClick={() => setActiveTab("home")}
            title="Roomie · Home"
          >
            <RoomieAppIcon size={38} />
          </div>
          <button
            type="button"
            className={`rail-btn ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
            title="Home"
          >
            <IconHome size={22} />
          </button>
          <button
            type="button"
            className={`rail-btn ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
            title="Explore Live Stages"
          >
            <IconCompass size={22} />
          </button>
          <button
            type="button"
            className="rail-btn create-btn"
            title="Create Room"
            onClick={() => setShowCreateRoom(true)}
          >
            <IconPlus size={22} />
          </button>
        </div>
        <div className="nav-rail-bottom">
          <button
            type="button"
            className="rail-btn"
            onClick={toggleTheme}
            title={`Theme: ${theme} (${resolvedTheme}) · Click to toggle`}
          >
            {resolvedTheme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
          {session ? (
            <div
              className="avatar-sm"
              onClick={() => setShowSettings(true)}
              title={session.username}
            >
              {getInitials(session.username)}
            </div>
          ) : (
            <button
              type="button"
              className="rail-btn"
              onClick={() => setShowOnboarding(true)}
              title="Sign in"
            >
              <IconUser size={22} />
            </button>
          )}
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="app-canvas">
        {/* Clean Header */}
        <header className="app-header">
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            onClick={() => setActiveTab("home")}
          >
            <RoomieAppIcon size={32} />
            <span className="brand-text">Roomie</span>
          </div>

          <div className="search-bar">
            <IconSearch size={16} color="var(--clay-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, topics, vibes..."
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Theme: ${theme} (${resolvedTheme}) · Click to toggle`}
            >
              {resolvedTheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>

            {session ? (
              <div
                className="avatar-sm"
                onClick={() => setShowSettings(true)}
                title={session.username}
              >
                {getInitials(session.username)}
              </div>
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() => setShowOnboarding(true)}
                style={{ padding: "8px 14px", fontSize: "0.84rem" }}
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Content Container with Smooth View Transitions */}
        <div className="app-content">
          {activeTab === "home" ? (
            <div key="home-view" className="view-fade-slide">
              {/* Action Deck — two large gradient cards */}
              <div className="action-deck">
                <div
                  className="action-card create"
                  onClick={() => setShowCreateRoom(true)}
                >
                  <div className="card-icon">
                    <IconPlus size={24} color="#ff3377" />
                  </div>
                  <div className="card-title">Create a Room</div>
                  <div className="card-sub">Host a sound stage for up to 16 people</div>
                </div>

                <div className="action-card join">
                  <div className="card-icon">
                    <IconLink size={24} color="#00f0ff" />
                  </div>
                  <div className="card-title">Join with Code</div>
                  <form
                    onSubmit={handleJoinWithCode}
                    className="join-input-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      placeholder="Enter code..."
                    />
                    <button type="submit" title="Join Room">
                      <IconArrowRight size={14} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Home Public Stage Feed */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 className="section-title" style={{ margin: 0 }}>Live Stages</h2>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setActiveTab("explore")}
                  style={{ gap: "6px", fontSize: "0.8rem", fontWeight: 700 }}
                >
                  <IconCompass size={14} />
                  <span>Explore Radar</span>
                </button>
              </div>

              <PublicRoomList
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onRoomsLoaded={setLoadedRooms}
              />
            </div>
          ) : (
            /* Explore Discovery Hub View */
            <div key="explore-view" className="view-fade-slide">
              {/* Explore Hero Banner */}
              <div className="explore-hero">
                <div className="explore-hero-glow" />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span className="radar-presence">
                      <span className="radar-dot" />
                      <span className="radar-ring" />
                    </span>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontFamily: "ui-monospace, SFMono-Regular, monospace",
                        color: "#00f0ff",
                        textShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
                      }}
                    >
                      Stage Discovery Radar
                    </span>
                  </div>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--clay-ink)", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                    Discover Buzzing Spaces
                  </h1>
                  <p style={{ color: "var(--clay-muted)", margin: 0, fontSize: "0.92rem", maxWidth: "520px" }}>
                    Drop in instantly to talk, co-work, or listen.
                    {loadedRooms.length > 0 && (
                      <strong style={{ color: "var(--clay-ink)", marginLeft: "4px" }}>
                        {loadedRooms.length} public stages available ({totalLiveParticipants} people live).
                      </strong>
                    )}
                  </p>
                </div>

                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="surprise-btn"
                    onClick={handleSurpriseMe}
                    title="Jump into a random active sound stage"
                  >
                    <span className={`dice-icon ${rollingDice ? "spinning" : ""}`}>
                      <IconDice size={18} color="#ffffff" />
                    </span>
                    <span>Surprise Me</span>
                  </button>
                </div>
              </div>

              {/* Semantic Vibe Filters (powered by Qwen2 1536d pgvector engine) */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--clay-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Popular Vibes & Topics
                </div>
                <div className="vibe-track">
                  {EXPLORE_VIBES.map((vibe) => (
                    <button
                      key={vibe.label}
                      type="button"
                      className={`vibe-chip ${selectedVibe === vibe.query ? "active" : ""}`}
                      onClick={() => handleSelectVibe(vibe.query)}
                    >
                      <span>{vibe.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Explore Mode Switcher (All / Buzzing Live / Nearby) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div className="theme-segmented">
                  <button
                    type="button"
                    className={`theme-segment-btn ${exploreFilter === "all" ? "active" : ""}`}
                    onClick={() => setExploreFilter("all")}
                  >
                    <IconSparkles size={14} />
                    <span>All Stages</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-segment-btn ${exploreFilter === "live" ? "active" : ""}`}
                    onClick={() => setExploreFilter("live")}
                  >
                    <IconFlame size={14} />
                    <span>Buzzing Live</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-segment-btn ${exploreFilter === "near" ? "active" : ""}`}
                    onClick={() => setExploreFilter("near")}
                  >
                    <IconRadio size={14} />
                    <span>Near You</span>
                  </button>
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedVibe("");
                    }}
                    style={{ fontSize: "0.78rem" }}
                  >
                    Clear Filter ({searchQuery})
                  </button>
                )}
              </div>

              {/* Room Grid with Live Soundwaves and Distance Pills */}
              <PublicRoomList
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterMode={exploreFilter}
                onRoomsLoaded={setLoadedRooms}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <IconHome size={22} />
          <span className="tab-label">Home</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
          onClick={() => setActiveTab("explore")}
        >
          <IconCompass size={22} />
          <span className="tab-label">Explore</span>
        </button>
        <button
          type="button"
          className="tab-btn"
          onClick={() => setShowCreateRoom(true)}
        >
          <IconPlus size={22} />
          <span className="tab-label">Create</span>
        </button>
        <button
          type="button"
          className="tab-btn"
          onClick={() =>
            session ? setShowSettings(true) : setShowOnboarding(true)
          }
        >
          <IconUser size={22} />
          <span className="tab-label">Profile</span>
        </button>
      </nav>

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
