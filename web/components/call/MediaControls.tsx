"use client";

import React from "react";
import {
  IconMic,
  IconMicOff,
  IconVideo,
  IconVideoOff,
  IconBolt,
  IconGrid,
  IconMessage,
  IconLogOut,
} from "@/components/icons/Icons";

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
        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMuted ? <IconMicOff size={18} /> : <IconMic size={18} />}
        <span className="call-dock-label">{isMuted ? "Unmute" : "Mute"}</span>
      </button>

      {/* Camera Button */}
      <button
        type="button"
        onClick={onToggleVideo}
        className={isCameraOff ? "danger" : "secondary"}
        title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
      >
        {isCameraOff ? <IconVideoOff size={18} /> : <IconVideo size={18} />}
        <span className="call-dock-label">{isCameraOff ? "Start Video" : "Stop Video"}</span>
      </button>

      {/* Bandwidth Saver Button */}
      <button
        type="button"
        onClick={onToggleBandwidthSaver}
        className={bandwidthSaver ? "peach-soft" : "secondary"}
        title="Toggle Bandwidth Saver: pauses background video streams when room is large"
      >
        <IconBolt size={18} color={bandwidthSaver ? "var(--clay-primary)" : "currentColor"} />
        <span className="call-dock-label">Saver: {bandwidthSaver ? "ON" : "OFF"}</span>
      </button>

      {/* Unpin Stage if Pinned */}
      {isPinned && (
        <button
          type="button"
          onClick={onUnpin}
          className="secondary"
          title="Reset to Grid Layout"
        >
          <IconGrid size={18} />
          <span className="call-dock-label">Grid</span>
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
        <IconMessage size={18} />
        <span className="call-dock-label">Chat</span>
        {unreadChatCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "var(--clay-danger)",
              color: "var(--clay-danger-dark)",
              border: "1.5px solid #ffffff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "grid",
              placeItems: "center",
              fontSize: "0.72rem",
              fontWeight: 900,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
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
        <IconLogOut size={18} />
        <span className="call-dock-label">Leave</span>
      </button>
    </div>
  );
}
