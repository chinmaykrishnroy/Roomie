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
  IconHome,
  IconCompass,
  IconPlus,
  IconUser,
  IconSearch,
  IconArrowRight,
  IconLink,
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
      {/* Desktop Navigation Rail */}
      <nav className="nav-rail">
        <div className="nav-rail-top">
          <div className="rail-logo">
            <IconSofa size={20} color="var(--clay-primary-dark)" />
          </div>
          <button type="button" className="rail-btn active" title="Home">
            <IconHome size={22} />
          </button>
          <button type="button" className="rail-btn" title="Explore">
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
          <span className="brand-text">Roomie</span>

          <div className="search-bar">
            <IconSearch size={16} color="var(--clay-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

        {/* Content */}
        <div className="app-content">
          {/* Action Deck — two large gradient cards */}
          <div className="action-deck">
            <div
              className="action-card create"
              onClick={() => setShowCreateRoom(true)}
            >
              <div className="card-icon">
                <IconPlus size={24} color="var(--clay-primary-dark)" />
              </div>
              <div className="card-title">Create a Room</div>
              <div className="card-sub">Host a stage for up to 16 people</div>
            </div>

            <div className="action-card join">
              <div className="card-icon">
                <IconLink size={24} color="var(--clay-sage-dark)" />
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
                <button type="submit">
                  <IconArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Live Rooms */}
          <h2 className="section-title">Live Now</h2>

          <PublicRoomList
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-tabs">
        <button type="button" className="tab-btn active">
          <IconHome size={22} />
          <span className="tab-label">Home</span>
        </button>
        <button type="button" className="tab-btn">
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
