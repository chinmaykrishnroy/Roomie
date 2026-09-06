"use client";

import React, { useRef, useEffect } from "react";
import { ParticipantState } from "@/lib/webrtc";

interface Props {
  participant: ParticipantState;
  isPinned: boolean;
  onTogglePin: (userId: string) => void;
  mirrored?: boolean;
  quality?: "high" | "low" | "off";
}

export function VideoTile({
  participant,
  isPinned,
  onTogglePin,
  mirrored = false,
  quality = "high",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.videoEnabled]);

  const initials = participant.username ? participant.username.slice(0, 2).toUpperCase() : "??";

  return (
    <div
      className={`video-tile ${mirrored && participant.isLocal ? "mirrored" : ""}`}
      style={{
        width: "100%",
        height: "100%",
        borderColor: isPinned ? "var(--yellow)" : "var(--ink)",
        boxShadow: isPinned ? "0 0 0 3px var(--yellow), 4px 4px 0 var(--ink)" : "3px 3px 0 var(--ink)",
      }}
    >
      {participant.videoEnabled && quality !== "off" ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
        />
      ) : (
        <div className="avatar-placeholder">
          {initials}
        </div>
      )}

      {/* Overlay Bar */}
      <div className="tile-overlay">
        {/* Top Badges */}
        <div className="tile-top-bar">
          <div style={{ display: "flex", gap: "6px" }}>
            {quality === "off" ? (
              <span className="badge" style={{ background: "var(--danger)", color: "var(--ink)" }}>
                Video Paused
              </span>
            ) : quality === "low" ? (
              <span className="badge" style={{ background: "var(--surface-soft)", color: "var(--ink)", fontSize: "0.7rem" }}>
                144p
              </span>
            ) : (
              <span className="badge" style={{ background: "rgba(0,0,0,0.6)", fontSize: "0.7rem" }}>
                HD
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(participant.userId)}
            style={{
              padding: "4px 8px",
              minHeight: "28px",
              background: isPinned ? "var(--yellow)" : "var(--paper)",
              fontSize: "0.75rem",
              boxShadow: "2px 2px 0 var(--ink)",
            }}
            title={isPinned ? "Unpin participant" : "Pin participant to make large"}
          >
            {isPinned ? "📌 Pinned" : "📌 Pin"}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="tile-bottom-bar">
          <span className="badge">
            {participant.username} {participant.isLocal && "(You)"}
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            {!participant.audioEnabled && (
              <span className="badge" style={{ background: "var(--danger)", color: "var(--ink)" }} title="Microphone muted">
                🔇
              </span>
            )}
            {!participant.videoEnabled && (
              <span className="badge" style={{ background: "var(--danger)", color: "var(--ink)" }} title="Camera turned off">
                📷✕
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
