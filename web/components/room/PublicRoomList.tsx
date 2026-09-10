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
  IconMapPin,
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

const DOT_COLORS = ["peach", "sage", "yellow", "peach", "sage"];

interface PublicRoomListProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode?: "all" | "live" | "near";
  onRoomsLoaded?: (rooms: Room[]) => void;
}

export function PublicRoomList({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  filterMode = "all",
  onRoomsLoaded,
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
    let isCurrent = true;
    const debounceDelay = searchQuery.trim() ? 300 : 0;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await listPublicRooms({
          category: selectedCategory === "custom" || selectedCategory === "all" ? undefined : selectedCategory,
          query: searchQuery.trim() || (selectedCategory === "custom" ? "custom" : undefined),
          lat: location?.latitude,
          lon: location?.longitude,
          page,
          limit: 18,
        });
        if (isCurrent) {
          let filtered = res.rooms;
          if (filterMode === "live") {
            filtered = filtered.filter((r) => r.participantCount > 0);
          } else if (filterMode === "near") {
            filtered = filtered.filter((r) => r.distanceKm !== undefined);
            filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
          }
          setRooms(filtered);
          setTotalPages(res.totalPages);
          onRoomsLoaded?.(res.rooms);
        }
      } catch (err) {
        if (isCurrent) {
          console.error("Failed to load rooms", err);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }, debounceDelay);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, page, location, searchQuery, filterMode, onRoomsLoaded]);

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Category Pill Strip */}
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
              <CatIcon size={14} />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "56px 16px",
            color: "var(--clay-muted)",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          Finding rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--clay-bg-subtle)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "16px",
              borderRadius: "50%",
              background: "var(--clay-peach-soft)",
              marginBottom: "14px",
            }}
          >
            <IconSofa size={32} color="var(--clay-primary)" />
          </div>
          <h3
            style={{
              marginBottom: "6px",
              color: "var(--clay-ink)",
              fontSize: "1.1rem",
            }}
          >
            No rooms found
          </h3>
          <p
            style={{
              maxWidth: "380px",
              margin: "0 auto",
              fontSize: "0.88rem",
              color: "var(--clay-muted)",
            }}
          >
            {searchQuery
              ? `Nothing matched "${searchQuery}". Try a different search or create a room!`
              : "No rooms are live right now. Be the first to host one!"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 290px), 1fr))",
            gap: "12px",
          }}
        >
          {rooms.map((room) => {
            const isFull = room.participantCount >= (room.maxParticipants || 16);
            const dotCount = Math.min(room.participantCount, 3);
            const extraCount = room.participantCount - 3;
            return (
              <div
                key={room.id}
                className="room-tile"
                onClick={() => {
                  if (!isFull) router.push(`/room/${encodeURIComponent(room.code)}`);
                }}
              >
                {/* Top row: category + count */}
                <div className="tile-meta">
                  <span
                    className="badge"
                    style={{
                      background: "var(--clay-peach-soft)",
                      color: "var(--clay-peach-soft-dark)",
                    }}
                  >
                    #{room.category}
                  </span>
                  <span
                    className="badge"
                    style={
                      isFull
                        ? { background: "var(--clay-danger)", color: "#fff" }
                        : room.participantCount > 0
                        ? { background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.25)" }
                        : {}
                    }
                  >
                    {room.participantCount > 0 ? (
                      <div className="soundwave-bars" title="Live audio active">
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                      </div>
                    ) : (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isFull ? "#fff" : "var(--clay-muted)",
                          display: "inline-block",
                        }}
                      />
                    )}
                    <span>{room.participantCount}/{room.maxParticipants || 16}</span>
                  </span>
                </div>

                {/* Room name */}
                <div className="tile-name">{room.name}</div>

                {/* Description */}
                <div className="tile-desc">
                  {room.description || "Drop in to hang out, listen, and talk"}
                </div>

                {/* Footer: avatar dots + distance + join btn */}
                <div className="tile-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Avatar dots */}
                    <div className="avatar-dots">
                      {Array.from({ length: dotCount }).map((_, i) => (
                        <div key={i} className={`avatar-dot ${DOT_COLORS[i]}`}>
                          {getInitials(room.name.slice(i, i + 2) || "RM")}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div className="avatar-dot extra">+{extraCount}</div>
                      )}
                    </div>

                    {/* Distance Pill */}
                    {room.distanceKm !== undefined && room.distanceKm > 0 && (
                      <span className="distance-pill" title={`Roughly ${Math.round(room.distanceKm)}km away`}>
                        <IconMapPin size={11} />
                        <span>~{Math.round(room.distanceKm)}km</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="tile-join-btn"
                    disabled={isFull}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/room/${encodeURIComponent(room.code)}`);
                    }}
                  >
                    {isFull ? "Full" : "Join"}
                    {!isFull && <IconArrowRight size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "28px",
          }}
        >
          <button
            type="button"
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: "8px 14px", fontSize: "0.84rem" }}
          >
            <IconArrowLeft size={14} />
            <span>Prev</span>
          </button>

          <span
            style={{
              fontWeight: 800,
              fontSize: "0.86rem",
              color: "var(--clay-ink)",
            }}
          >
            {page} / {totalPages}
          </span>

          <button
            type="button"
            className="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: "8px 14px", fontSize: "0.84rem" }}
          >
            <span>Next</span>
            <IconArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
