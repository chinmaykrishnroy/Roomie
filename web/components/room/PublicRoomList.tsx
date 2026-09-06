"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Room, listPublicRooms } from "@/lib/api";
import { getBrowserLocation, GeoCoords } from "@/lib/geo";
import {
  IconSparkles,
  IconGamepad,
  IconMusic,
  IconBook,
  IconLaptop,
  IconParty,
  IconFlask,
  IconCoffee,
  IconPalette,
  IconEdit,
  IconSearch,
  IconMapPin,
  IconUsers,
  IconArrowLeft,
  IconArrowRight,
  IconSofa,
} from "@/components/icons/Icons";

const CATEGORIES = [
  { id: "all", label: "All Rooms", Icon: IconSparkles },
  { id: "gaming", label: "Gaming", Icon: IconGamepad },
  { id: "music", label: "Music", Icon: IconMusic },
  { id: "study", label: "Study", Icon: IconBook },
  { id: "tech", label: "Tech", Icon: IconLaptop },
  { id: "fun", label: "Fun", Icon: IconParty },
  { id: "science", label: "Science", Icon: IconFlask },
  { id: "chill", label: "Chill", Icon: IconCoffee },
  { id: "creative", label: "Creative", Icon: IconPalette },
  { id: "custom", label: "Custom Search", Icon: IconEdit },
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
    <div style={{ marginTop: "36px" }}>
      {/* Category Pills Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.5rem" }}>Browse Public Rooms</h2>
        {location && (
          <span className="badge" style={{ background: "var(--clay-primary)", color: "var(--clay-primary-dark)" }}>
            <IconMapPin size={14} />
            <span>Location ranked</span>
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.Icon;
          return (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`chip ${selectedCategory === cat.id ? "active" : ""}`}
            >
              <CatIcon size={16} />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic, vibes or custom category using vector match..."
          style={{ flex: 1, padding: "12px 18px", fontSize: "0.95rem" }}
        />
        <button type="submit" className="secondary" style={{ padding: "12px 20px" }}>
          <IconSearch size={18} />
          <span>Search</span>
        </button>
      </form>

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--clay-muted)", fontWeight: 700 }}>
          Loading active rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "var(--clay-lilac)", marginBottom: "16px" }}>
            <IconSofa size={36} color="var(--clay-lilac-dark)" />
          </div>
          <h3 style={{ marginBottom: "8px" }}>No public rooms found</h3>
          <p style={{ marginBottom: "20px" }}>
            {searchQuery
              ? `No active rooms matched "${searchQuery}". Try another topic or create one!`
              : "No public rooms are active right now. Start the vibe by creating a room!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
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
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span className="chip" style={{ padding: "4px 12px", fontSize: "0.78rem", background: "var(--clay-lilac)", color: "var(--clay-lilac-dark)" }}>
                      #{room.category}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: isFull ? "var(--clay-danger)" : "var(--clay-primary)",
                        color: isFull ? "var(--clay-danger-dark)" : "var(--clay-primary-dark)",
                      }}
                    >
                      <IconUsers size={14} />
                      <span>{room.participantCount} / {room.maxParticipants || 16}</span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "6px" }}>{room.name}</h3>

                  <p style={{ fontSize: "0.88rem", marginBottom: "14px", minHeight: "38px" }}>
                    {room.description || "Casual room. Come hang out and talk!"}
                  </p>

                  {room.distanceKm !== undefined && room.distanceKm > 0 && (
                    <div style={{ fontSize: "0.78rem", color: "var(--clay-muted)", marginBottom: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconMapPin size={14} />
                      <span>~{Math.round(room.distanceKm)} km away from you</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => router.push(`/room/${encodeURIComponent(room.code)}`)}
                  style={{ width: "100%", padding: "12px" }}
                >
                  <span>{isFull ? "Room Full" : "Join Room"}</span>
                  <IconArrowRight size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "36px" }}>
          <button
            type="button"
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <IconArrowLeft size={18} />
            <span>Previous</span>
          </button>
          <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <span>Next</span>
            <IconArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
