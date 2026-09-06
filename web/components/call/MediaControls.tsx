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
        <span>{isMuted ? "Unmute" : "Mute"}</span>
      </button>

      {/* Camera Button */}
      <button
        type="button"
        onClick={onToggleVideo}
        className={isCameraOff ? "danger" : "secondary"}
        title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
      >
        {isCameraOff ? <IconVideoOff size={18} /> : <IconVideo size={18} />}
        <span>{isCameraOff ? "Start Video" : "Stop Video"}</span>
      </button>

      {/* Bandwidth Saver Button */}
      <button
        type="button"
        onClick={onToggleBandwidthSaver}
        className={bandwidthSaver ? "yellow" : "secondary"}
        title="Toggle Bandwidth Saver: pauses background video streams when room is large"
      >
        <IconBolt size={18} />
        <span>Saver: {bandwidthSaver ? "ON" : "OFF"}</span>
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
          <span>Grid View</span>
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
        <span>Chat</span>
        {unreadChatCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "var(--clay-danger)",
              color: "var(--clay-danger-dark)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "grid",
              placeItems: "center",
              fontSize: "0.75rem",
              fontWeight: 900,
              boxShadow: "var(--clay-shadow-button)",
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
        <span>Leave</span>
      </button>
    </div>
  );
}
