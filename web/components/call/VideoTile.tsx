"use client";

import React, { useRef, useEffect } from "react";
import { ParticipantState } from "@/lib/webrtc";
import { IconPin, IconMicOff, IconVideoOff } from "@/components/icons/Icons";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Bind video stream
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      if (videoRef.current.srcObject !== participant.stream) {
        videoRef.current.srcObject = participant.stream;
      }
      videoRef.current.play().catch((err) => {
        // Autoplay may be restricted until user interacts with document
        console.warn("Video autoplay prevented:", err);
      });
    }
  }, [participant.stream, participant.videoEnabled, quality]);

  // Bind dedicated audio stream for remote peers (ensures audio never cuts out when video is toggled off)
  useEffect(() => {
    if (audioRef.current && participant.stream && !participant.isLocal) {
      if (audioRef.current.srcObject !== participant.stream) {
        audioRef.current.srcObject = participant.stream;
      }
      audioRef.current.play().catch((err) => {
        console.warn("Audio autoplay prevented:", err);
      });
    }
  }, [participant.stream, participant.isLocal]);

  const initials = participant.username ? participant.username.slice(0, 2).toUpperCase() : "??";

  return (
    <div
      className={`video-tile ${mirrored && participant.isLocal ? "mirrored" : ""}`}
      style={{
        width: "100%",
        height: "100%",
        boxShadow: isPinned
          ? "0 0 0 3px var(--clay-primary), 12px 14px 28px rgba(0,0,0,0.4)"
          : undefined,
      }}
    >
      {/* Persistent audio element for remote participant */}
      {!participant.isLocal && participant.stream && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />
      )}

      {participant.videoEnabled && quality !== "off" ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal || true} /* Remote audio is routed reliably through persistent <audio> tag */
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
              <span className="badge" style={{ background: "var(--clay-danger)", color: "var(--clay-danger-dark)" }}>
                Video Paused
              </span>
            ) : quality === "low" ? (
              <span className="badge" style={{ background: "rgba(255,255,255,0.85)", color: "var(--clay-ink)", fontSize: "0.72rem" }}>
                144p
              </span>
            ) : (
              <span className="badge" style={{ background: "rgba(35, 25, 20, 0.75)", color: "#ffffff", fontSize: "0.72rem" }}>
                HD
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(participant.userId)}
            style={{
              padding: "4px 10px",
              minHeight: "30px",
              background: isPinned ? "var(--clay-primary)" : "rgba(255, 255, 255, 0.9)",
              color: isPinned ? "var(--clay-primary-dark)" : "var(--clay-ink)",
              fontSize: "0.75rem",
              borderRadius: "999px",
            }}
            title={isPinned ? "Unpin participant" : "Pin participant"}
          >
            <IconPin size={13} />
            <span>{isPinned ? "Pinned" : "Pin"}</span>
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="tile-bottom-bar">
          <span className="badge" style={{ background: "rgba(255, 255, 255, 0.9)", color: "var(--clay-ink)" }}>
            {participant.username} {participant.isLocal && "(You)"}
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            {!participant.audioEnabled && (
              <span className="badge" style={{ background: "var(--clay-danger)", color: "var(--clay-danger-dark)" }} title="Microphone muted">
                <IconMicOff size={13} />
              </span>
            )}
            {!participant.videoEnabled && (
              <span className="badge" style={{ background: "var(--clay-danger)", color: "var(--clay-danger-dark)" }} title="Camera turned off">
                <IconVideoOff size={13} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
