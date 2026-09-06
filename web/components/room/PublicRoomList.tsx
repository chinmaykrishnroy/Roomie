"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Room, listPublicRooms } from "@/lib/api";
import { getBrowserLocation, GeoCoords } from "@/lib/geo";

const CATEGORIES = [
  { id: "all", label: "All Rooms", emoji: "✨" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "fun", label: "Fun", emoji: "🎉" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "chill", label: "Chill", emoji: "☕" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "custom", label: "Custom Search", emoji: "✏️" },
];

export function PublicRoomList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<GeoCoords | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);

  useEffect(() => {
    getBrowserLocation().then((coords) => {
      setLocation(coords);
    });
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory, page, location]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await listPublicRooms({
        category: selectedCategory === "custom" ? undefined : selectedCategory,
        query: searchQuery.trim() || (selectedCategory === "custom" ? "custom" : undefined),
        lat: location?.latitude,
        lon: location?.longitude,
        page,
        limit: 8,
      });
      setRooms(res.rooms);
      setTotalPages(res.totalPages);
      setTotalRooms(res.total);
    } catch (err) {
      console.error("Failed to load rooms", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRooms();
  };

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Category Pills Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.5rem" }}>Browse Public Rooms</h2>
        {location && (
          <span className="badge" style={{ background: "var(--accent)", color: "var(--ink)" }}>
            📍 Location ranked (nearest first)
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setPage(1);
            }}
            className={`chip ${selectedCategory === cat.id ? "active" : ""}`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic, vibes or custom category using vector match..."
          style={{ flex: 1, padding: "10px 14px", fontSize: "0.95rem" }}
        />
        <button type="submit" className="secondary">
          🔍 Search
        </button>
      </form>

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--muted)", fontWeight: 700 }}>
          Loading active rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛋️</div>
          <h3 style={{ marginBottom: "8px" }}>No public rooms found</h3>
          <p style={{ marginBottom: "20px" }}>
            {searchQuery
              ? `No active rooms matched "${searchQuery}". Try another topic or create one!`
              : "No public rooms are active right now. Start the vibe by creating a room!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {rooms.map((room) => {
            const isFull = room.participantCount >= (room.maxParticipants || 16);
            return (
              <div
                key={room.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 120ms ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span className="chip" style={{ padding: "3px 10px", fontSize: "0.75rem", background: "var(--lilac)" }}>
                      #{room.category}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: isFull ? "var(--danger)" : "var(--accent)",
                        color: "var(--ink)",
                      }}
                    >
                      👥 {room.participantCount} / {room.maxParticipants || 16}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "6px" }}>{room.name}</h3>

                  <p style={{ fontSize: "0.85rem", marginBottom: "12px", minHeight: "36px" }}>
                    {room.description || "Casual room. Come hang out and talk!"}
                  </p>

                  {room.distanceKm !== undefined && room.distanceKm > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "14px", fontWeight: 700 }}>
                      📍 ~{Math.round(room.distanceKm)} km away from you
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => router.push(`/room/${encodeURIComponent(room.code)}`)}
                  style={{ width: "100%", padding: "10px" }}
                >
                  {isFull ? "Room Full" : "Join Room →"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "28px" }}>
          <button
            type="button"
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
