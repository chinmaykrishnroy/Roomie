"use client";

import React, { useState, useEffect } from "react";
import { UserSession, saveUserSession, clearUserSession } from "@/lib/storage";
import { IconClose, IconTrash } from "@/components/icons/Icons";

interface Props {
  isOpen: boolean;
  session: UserSession | null;
  onClose: () => void;
  onUpdate: (updated: UserSession) => void;
  onReset: () => void;
}

export function SettingsModal({ isOpen, session, onClose, onUpdate, onReset }: Props) {
  const [username, setUsername] = useState("");
  const [mirrored, setMirrored] = useState(true);

  useEffect(() => {
    if (session) {
      setUsername(session.username);
      setMirrored(session.videoMirrored !== false);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSave = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const updated: UserSession = {
      ...session,
      username: trimmed,
      videoMirrored: mirrored,
    };
    saveUserSession(updated);
    onUpdate(updated);
    onClose();
  };

  const handleResetIdentity = () => {
    if (confirm("Reset and delete your stored Roomie identity? You will be prompted to pick a new name.")) {
      clearUserSession();
      onReset();
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Settings</h2>
          <button type="button" onClick={onClose} className="secondary icon-btn">
            <IconClose size={18} />
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "8px" }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", fontSize: "1rem" }}
          />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={mirrored}
              onChange={(e) => setMirrored(e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--clay-primary-dark)" }}
            />
            Mirror my camera (selfie mode)
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button type="button" onClick={handleSave} style={{ width: "100%", padding: "12px" }}>
            Save Changes
          </button>

          <button
            type="button"
            onClick={handleResetIdentity}
            className="danger"
            style={{ width: "100%", padding: "12px" }}
          >
            <IconTrash size={18} />
            <span>Reset Stored Identity</span>
          </button>
        </div>
      </div>
    </div>
  );
}
