"use client";

import React from "react";

interface Props {
  isMuted: boolean;
  isCameraOff: boolean;
  bandwidthSaver: boolean;
  isPinned: boolean;
  unreadChatCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleBandwidthSaver: () => void;
  onUnpin: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

export function MediaControls({
  isMuted,
  isCameraOff,
  bandwidthSaver,
  isPinned,
  unreadChatCount,
  onToggleAudio,
  onToggleVideo,
  onToggleBandwidthSaver,
  onUnpin,
  onToggleChat,
  onLeave,
}: Props) {
  return (
    <div className="call-dock">
      {/* Mic Button */}
      <button
        type="button"
        onClick={onToggleAudio}
        className={isMuted ? "danger" : "secondary"}
        style={{ minWidth: "48px" }}
        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
      </button>

      {/* Camera Button */}
      <button
        type="button"
        onClick={onToggleVideo}
        className={isCameraOff ? "danger" : "secondary"}
        style={{ minWidth: "48px" }}
        title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
      >
        {isCameraOff ? "📷 Start Video" : "📹 Stop Video"}
      </button>

      {/* Bandwidth Saver Button */}
      <button
        type="button"
        onClick={onToggleBandwidthSaver}
        className={bandwidthSaver ? "yellow" : "secondary"}
        title="Toggle Bandwidth Saver: pauses background video streams when room is large"
      >
        ⚡ Saver: {bandwidthSaver ? "ON" : "OFF"}
      </button>

      {/* Unpin Stage if Pinned */}
      {isPinned && (
        <button
          type="button"
          onClick={onUnpin}
          className="secondary"
          title="Reset to Grid Layout"
        >
          🔲 Grid View
        </button>
      )}

      {/* Chat Button */}
      <button
        type="button"
        onClick={onToggleChat}
        className="secondary"
        style={{ position: "relative" }}
        title="Open Room Chat"
      >
        💬 Chat
        {unreadChatCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "var(--danger)",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "grid",
              placeItems: "center",
              fontSize: "0.75rem",
              fontWeight: 900,
            }}
          >
            {unreadChatCount}
          </span>
        )}
      </button>

      {/* Leave Room Button */}
      <button
        type="button"
        onClick={onLeave}
        className="danger"
        style={{ fontWeight: 800 }}
        title="Leave Room"
      >
        🚪 Leave
      </button>
    </div>
  );
}
