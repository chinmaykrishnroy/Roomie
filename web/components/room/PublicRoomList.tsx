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

export const CATEGORIES = [
  { id: "all", label: "All Rooms", Icon: IconSparkles },
  { id: "gaming", label: "Gaming", Icon: IconGamepad },
  { id: "music", label: "Music", Icon: IconMusic },
  { id: "study", label: "Study", Icon: IconBook },
  { id: "tech", label: "Tech", Icon: IconLaptop },
  { id: "fun", label: "Fun", Icon: IconParty },
  { id: "science", label: "Science", Icon: IconFlask },
  { id: "chill", label: "Chill", Icon: IconCoffee },
  { id: "creative", label: "Creative", Icon: IconPalette },
  { id: "custom", label: "Custom", Icon: IconEdit },
];

interface PublicRoomListProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function PublicRoomList({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: PublicRoomListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [selectedCategory, page, location, searchQuery]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await listPublicRooms({
        category: selectedCategory === "custom" || selectedCategory === "all" ? undefined : selectedCategory,
        query: searchQuery.trim() || (selectedCategory === "custom" ? "custom" : undefined),
        lat: location?.latitude,
        lon: location?.longitude,
        page,
        limit: 12,
      });
      setRooms(res.rooms);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load rooms", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Category Pills Strip (Quick Switcher) */}
      <div className="pill-track" style={{ marginBottom: "20px" }}>
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.Icon;
          const isActive = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                setPage(1);
              }}
              className={`chip ${isActive ? "active" : ""}`}
            >
              <CatIcon size={15} />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Grid Subheader */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--clay-ink)" }}>
            {selectedCategory === "all"
              ? "All Live Sound Stages"
              : `${CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory} Stages`}
          </h2>
          <span
            className="badge"
            style={{
              background: "var(--clay-peach-soft)",
              color: "var(--clay-peach-soft-dark)",
              fontSize: "0.75rem",
            }}
          >
            {rooms.length} Active
          </span>
        </div>

        {location && (
          <span
            className="badge"
            style={{
              background: "#ffffff",
              color: "var(--clay-sage-dark)",
              border: "1px solid rgba(225, 175, 155, 0.3)",
            }}
          >
            <IconMapPin size={13} color="var(--clay-primary)" />
            <span>Ranked near your location</span>
          </span>
        )}
      </div>

      {/* Fluid Multi-Column Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 16px", color: "var(--clay-muted)", fontWeight: 700 }}>
          Finding active sound stages...
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "54px 24px",
            background: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(225, 175, 155, 0.25)",
            boxShadow: "var(--clay-shadow-card)",
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
          <h3 style={{ marginBottom: "8px", color: "var(--clay-ink)" }}>No sound stages found</h3>
          <p style={{ maxWidth: "440px", margin: "0 auto", fontSize: "0.92rem", color: "var(--clay-muted)" }}>
            {searchQuery
              ? `No active rooms matched "${searchQuery}". Try clearing your search or host a new room!`
              : "No public stages are active under this category right now. Host one to get the hangout started!"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 310px), 1fr))",
            gap: "20px",
          }}
        >
          {rooms.map((room) => {
            const isFull = room.participantCount >= (room.maxParticipants || 16);
            return (
              <div key={room.id} className="room-cartridge">
                <div>
                  {/* Top Metadata Row */}
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
                        border: "none",
                      }}
                    >
                      #{room.category}
                    </span>

                    <span
                      className="badge"
                      style={{
                        background: isFull ? "var(--clay-danger)" : "#ffffff",
                        color: isFull ? "#ffffff" : "var(--clay-ink)",
                        border: isFull ? "none" : "1px solid rgba(225, 175, 155, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: isFull ? "#ffffff" : "#10b981",
                        }}
                      />
                      <span>{room.participantCount} / {room.maxParticipants || 16}</span>
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", marginBottom: "6px", color: "var(--clay-ink)", lineHeight: 1.25 }}>
                    {room.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.86rem",
                      marginBottom: "14px",
                      minHeight: "38px",
                      lineHeight: 1.45,
                      color: "var(--clay-muted)",
                    }}
                  >
                    {room.description || "Casual stage. Drop in to hang out, listen, and talk!"}
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
                  <span>{isFull ? "Stage Full" : "Hop In Stage"}</span>
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
