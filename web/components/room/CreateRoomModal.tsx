"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchGeneratedRoomName, fetchGeneratedRoomCode, createRoom } from "@/lib/api";
import { getBrowserLocation } from "@/lib/geo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_CATEGORIES = [
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "fun", label: "Fun", emoji: "🎉" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "chill", label: "Chill", emoji: "☕" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "custom", label: "Custom", emoji: "✏️" },
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

      // Obtain location if available
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
      <div className="modal-content" style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2>Create a Room</h2>
          <button type="button" onClick={onClose} className="secondary icon-btn">
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--danger)", border: "2px solid var(--ink)", borderRadius: "10px", marginBottom: "16px", fontWeight: 700, fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Room Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>
              Room Name
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SilentStudy or NeonJam"
                style={{ flex: 1, fontWeight: 700 }}
                required
              />
              <button type="button" onClick={rollName} className="secondary" title="Randomize name">
                🎲 Roll
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>
              Room Description (Topic)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we doing or discussing in this room? Used for semantic search matching..."
              rows={2}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* Category Chips */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
              Select Category
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESET_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`chip ${category === cat.id ? "active" : ""}`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </div>
              ))}
            </div>

            {category === "custom" && (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter your custom topic (e.g. indie game dev, lofi beats)..."
                  style={{ width: "100%" }}
                  required
                />
              </div>
            )}
          </div>

          {/* Room Privacy Choice */}
          <div style={{ padding: "14px", background: "var(--surface-soft)", border: "2px solid var(--ink)", borderRadius: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "10px" }}>
              Room Access Type
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={!isPrivate ? "active" : "secondary"}
                style={{ flex: 1, padding: "10px" }}
              >
                🌐 Public Room
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={isPrivate ? "active" : "secondary"}
                style={{ flex: 1, padding: "10px" }}
              >
                🔒 Private Room
              </button>
            </div>

            {isPrivate ? (
              <div style={{ marginTop: "12px", fontSize: "0.85rem" }}>
                <p style={{ marginBottom: "6px" }}>
                  Only people with this secret room code can join.
                </p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={privateCode}
                    onChange={(e) => setPrivateCode(e.target.value)}
                    style={{ flex: 1, fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <button type="button" onClick={rollCode} className="secondary icon-btn" title="Roll another code">
                    🎲
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "10px", fontSize: "0.85rem" }}>
                Visible in the public directory to anyone. Ranked automatically by category, semantic similarity, and nearby geography.
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", fontSize: "1.05rem" }}>
            {loading ? "Creating..." : "Create Room & Enter →"}
          </button>
        </form>
      </div>
    </div>
  );
}
