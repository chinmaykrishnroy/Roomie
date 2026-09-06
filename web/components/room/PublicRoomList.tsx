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
    <div style={{ marginTop: "12px" }}>
      {/* Header with Title & Location Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "1.35rem", color: "var(--clay-ink)" }}>Public Sound Stages</h2>
          <span
            className="badge"
            style={{
              background: "var(--clay-peach-soft)",
              color: "var(--clay-peach-soft-dark)",
              fontSize: "0.72rem",
            }}
          >
            Live Directory
          </span>
        </div>

        {location && (
          <span
            className="badge"
            style={{
              background: "var(--clay-sage)",
              color: "var(--clay-sage-dark)",
            }}
          >
            <IconMapPin size={13} />
            <span>Ranked near you</span>
          </span>
        )}
      </div>

      {/* Horizontally Scrollable Smooth Category Track (Zero mobile clipping) */}
      <div className="pill-track" style={{ marginBottom: "18px" }}>
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.Icon;
          const isActive = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`chip ${isActive ? "active" : ""}`}
            >
              <CatIcon size={16} />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Semantic Vector Search Box (Mobile Friendly) */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vibe, topic or tag via vector search..."
            style={{
              width: "100%",
              padding: "11px 18px",
              fontSize: "0.9rem",
              background: "#ffffff",
            }}
          />
        </div>
        <button
          type="submit"
          className="peach-soft"
          style={{
            padding: "11px 20px",
            fontSize: "0.88rem",
          }}
        >
          <IconSearch size={16} />
          <span>Search</span>
        </button>
      </form>

      {/* Rooms Cartridges Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--clay-muted)", fontWeight: 700 }}>
          Finding active sound stages...
        </div>
      ) : rooms.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "16px",
              borderRadius: "50%",
              background: "var(--clay-peach-soft)",
              marginBottom: "16px",
            }}
          >
            <IconSofa size={36} color="var(--clay-primary)" />
          </div>
          <h3 style={{ marginBottom: "8px", color: "var(--clay-ink)" }}>No public rooms found</h3>
          <p style={{ maxWidth: "420px", margin: "0 auto", fontSize: "0.92rem" }}>
            {searchQuery
              ? `No active rooms matched "${searchQuery}". Try another keyword or create your own room!`
              : "No public rooms are active right now. Be the first to start the vibe by creating a room!"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: "18px",
          }}
        >
          {rooms.map((room) => {
            const isFull = room.participantCount >= (room.maxParticipants || 16);
            return (
              <div key={room.id} className="room-cartridge">
                <div>
                  {/* Top Category and Occupancy Indicators */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                      gap: "8px",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: "var(--clay-peach-soft)",
                        color: "var(--clay-peach-soft-dark)",
                        fontSize: "0.76rem",
                      }}
                    >
                      #{room.category}
                    </span>

                    <span
                      className="badge"
                      style={{
                        background: isFull ? "var(--clay-danger)" : "var(--clay-sage)",
                        color: isFull ? "var(--clay-danger-dark)" : "var(--clay-sage-dark)",
                      }}
                    >
                      <IconUsers size={13} />
                      <span>{room.participantCount} / {room.maxParticipants || 16}</span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", marginBottom: "6px", color: "var(--clay-ink)", lineHeight: 1.25 }}>
                    {room.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.86rem",
                      marginBottom: "14px",
                      minHeight: "36px",
                      lineHeight: 1.4,
                      color: "var(--clay-muted)",
                    }}
                  >
                    {room.description || "Casual room. Drop in to hang out and talk!"}
                  </p>

                  {room.distanceKm !== undefined && room.distanceKm > 0 && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--clay-muted)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <IconMapPin size={13} color="var(--clay-primary)" />
                      <span>~{Math.round(room.distanceKm)} km away</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => router.push(`/room/${encodeURIComponent(room.code)}`)}
                  style={{
                    width: "100%",
                    padding: "11px 18px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>{isFull ? "Room Full" : "Hop In Room"}</span>
                  <IconArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "14px",
            marginTop: "32px",
          }}
        >
          <button
            type="button"
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            <IconArrowLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--clay-ink)" }}>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            className="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            <span>Next</span>
            <IconArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
