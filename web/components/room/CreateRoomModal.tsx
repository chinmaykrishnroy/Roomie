"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchGeneratedRoomName, fetchGeneratedRoomCode, createRoom } from "@/lib/api";
import { getBrowserLocation } from "@/lib/geo";
import {
  RoomieAppIcon,
  IconClose,
  IconDice,
  IconGlobe,
  IconLock,
  IconArrowRight,
  IconGamepad,
  IconMusic,
  IconBook,
  IconLaptop,
  IconParty,
  IconFlask,
  IconCoffee,
  IconPalette,
  IconEdit,
} from "@/components/icons/Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_CATEGORIES = [
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

export function CreateRoomModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("chill");
  const [customCategory, setCustomCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateCode, setPrivateCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      rollName();
      rollCode();
    }
  }, [isOpen]);

  const rollName = async () => {
    try {
      const generated = await fetchGeneratedRoomName();
      setName(generated);
    } catch {
      setName("CozyCampfire");
    }
  };

  const rollCode = async () => {
    try {
      const code = await fetchGeneratedRoomCode();
      setPrivateCode(code);
    } catch {
      setPrivateCode("amber-falcon-42");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError("");

      const isCustom = category === "custom";
      const finalCategory = isCustom ? customCategory.trim() || "general" : category;

      const loc = await getBrowserLocation();

      const created = await createRoom({
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        isCustomCategory: isCustom,
        isPrivate,
        customCode: isPrivate ? privateCode.trim() : undefined,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
      });

      onClose();
      router.push(`/room/${encodeURIComponent(created.code)}`);
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "540px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RoomieAppIcon size={28} />
            <h2 style={{ fontSize: "1.45rem", color: "var(--clay-ink)" }}>Create Room</h2>
          </div>
          <button type="button" onClick={onClose} className="secondary icon-btn" title="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--clay-danger)",
              color: "var(--clay-danger-dark)",
              borderRadius: "16px",
              marginBottom: "16px",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Room Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px", color: "var(--clay-ink)" }}>
              Room Name
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SilentStudy or NeonJam"
                style={{ flex: 1, fontWeight: 700, minWidth: 0 }}
                required
              />
              <button type="button" onClick={rollName} className="secondary" title="Randomize name" style={{ padding: "10px 16px" }}>
                <IconDice size={18} />
                <span>Roll</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px", color: "var(--clay-ink)" }}>
              Room Topic &amp; Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we talking about or doing? Used for semantic search matching..."
              rows={2}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* Category Chips */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px", color: "var(--clay-ink)" }}>
              Select Category
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESET_CATEGORIES.map((cat) => {
                const CatIcon = cat.Icon;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`chip ${category === cat.id ? "active" : ""}`}
                    style={{ padding: "7px 14px", fontSize: "0.82rem" }}
                  >
                    <CatIcon size={15} />
                    <span>{cat.label}</span>
                  </div>
                );
              })}
            </div>

            {category === "custom" && (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category / tags (e.g. lo-fi study, gamedev)..."
                  style={{ width: "100%" }}
                  required
                />
              </div>
            )}
          </div>

          {/* Room Privacy Choice */}
          <div
            style={{
              padding: "16px",
              background: "var(--clay-bg-subtle)",
              borderRadius: "20px",
              boxShadow: "var(--clay-shadow-inset)",
            }}
          >
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "10px", color: "var(--clay-ink)" }}>
              Room Access Type
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={!isPrivate ? "" : "secondary"}
                style={{ flex: 1, padding: "10px 14px", fontSize: "0.88rem" }}
              >
                <IconGlobe size={16} />
                <span>Public Stage</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={isPrivate ? "" : "secondary"}
                style={{ flex: 1, padding: "10px 14px", fontSize: "0.88rem" }}
              >
                <IconLock size={16} />
                <span>Private Secret</span>
              </button>
            </div>

            {isPrivate ? (
              <div style={{ marginTop: "12px", fontSize: "0.84rem" }}>
                <p style={{ marginBottom: "8px", color: "var(--clay-muted)" }}>
                  Only people with this exact code can enter.
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={privateCode}
                    onChange={(e) => setPrivateCode(e.target.value)}
                    style={{ flex: 1, fontWeight: 700, fontFamily: "monospace", minWidth: 0 }}
                  />
                  <button type="button" onClick={rollCode} className="secondary icon-btn" title="Roll another code">
                    <IconDice size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "10px", fontSize: "0.82rem", color: "var(--clay-muted)" }}>
                Visible in the public directory to everyone. Ranked by category, semantic similarity, and proximity.
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: "1rem" }}>
            <span>{loading ? "Creating..." : "Create Room & Enter"}</span>
            <IconArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
