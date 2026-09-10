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
              <span className="tile-status-badge danger">
                Video Paused
              </span>
            ) : quality === "low" ? (
              <span className="tile-status-badge" style={{ color: "#fed7aa" }}>
                144p
              </span>
            ) : (
              <span className="tile-status-badge">
                HD
              </span>
            )}
          </div>

          <button
            type="button"
            className={`tile-pin-btn ${isPinned ? "pinned" : ""}`}
            onClick={() => onTogglePin(participant.userId)}
            title={isPinned ? "Unpin participant" : "Pin participant"}
          >
            <IconPin size={13} color={isPinned ? "#381c14" : "#ffffff"} />
            <span>{isPinned ? "Pinned" : "Pin"}</span>
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="tile-bottom-bar">
          <span className="tile-user-badge">
            <span>{participant.username}</span>
            {participant.isLocal && <span style={{ opacity: 0.7, fontWeight: 500 }}>(You)</span>}
          </span>

          <div style={{ display: "flex", gap: "6px" }}>
            {!participant.audioEnabled && (
              <span className="tile-status-badge danger" title="Microphone muted">
                <IconMicOff size={13} />
              </span>
            )}
            {!participant.videoEnabled && (
              <span className="tile-status-badge danger" title="Camera turned off">
                <IconVideoOff size={13} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
