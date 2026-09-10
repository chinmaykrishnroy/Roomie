"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Room, getRoomByCode, getICEServers } from "@/lib/api";
import { UserSession, loadUserSession } from "@/lib/storage";
import { RoomieCallClient, ParticipantState, ChatMessage } from "@/lib/webrtc";
import { VideoTile } from "@/components/call/VideoTile";
import { MediaControls } from "@/components/call/MediaControls";
import { ChatDrawer } from "@/components/call/ChatDrawer";
import { OnboardingModal } from "@/components/identity/OnboardingModal";
import { getBrowserLocation } from "@/lib/geo";
import {
  RoomieAppIcon,
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconUsers,
  IconBolt,
  IconSparkles,
} from "@/components/icons/Icons";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function RoomCallPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code;
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [bandwidthSaver, setBandwidthSaver] = useState(false);
  const [connState, setConnState] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const clientRef = useRef<RoomieCallClient | null>(null);

  useEffect(() => {
    const existing = loadUserSession();
    if (existing) {
      setSession(existing);
      initRoomAndCall(existing);
    } else {
      setShowOnboarding(true);
    }

    return () => {
      clientRef.current?.leave();
    };
  }, [roomCode]);

  const initRoomAndCall = async (userSession: UserSession) => {
    try {
      const roomData = await getRoomByCode(roomCode);
      setRoom(roomData);

      const iceServers = await getICEServers(userSession.id);

      const client = new RoomieCallClient();
      clientRef.current = client;

      await client.initLocalMedia(true, true);

      client.onParticipantsUpdate = (updatedList) => {
        setParticipants(updatedList);
      };

      client.onChatMessageReceived = (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (!isChatOpen) {
          setUnreadChatCount((c) => c + 1);
        }
      };

      client.onConnectionStateChange = (st) => {
        setConnState(st);
      };

      const loc = await getBrowserLocation();
      await client.join(roomCode, userSession.id, userSession.username, iceServers, loc);
    } catch (err: any) {
      console.error("Failed to initialize room call", err);
      setConnState("error");
    }
  };

  const handleToggleAudio = () => {
    if (clientRef.current) {
      const active = clientRef.current.toggleAudio();
      setIsMuted(!active);
    }
  };

  const handleToggleVideo = () => {
    if (clientRef.current) {
      const active = clientRef.current.toggleVideo();
      setIsCameraOff(!active);
    }
  };

  const handleToggleBandwidthSaver = () => {
    const nextState = !bandwidthSaver;
    setBandwidthSaver(nextState);
    clientRef.current?.setBandwidthSaver(nextState);
  };

  const handleTogglePin = (userId: string) => {
    if (pinnedUserId === userId) {
      setPinnedUserId(null);
    } else {
      setPinnedUserId(userId);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    clientRef.current?.leave();
    router.push("/");
  };

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-1";
    if (count === 2) return "grid-2 mobile-stacked";
    if (count <= 4) return "grid-4";
    if (count <= 6) return "grid-6";
    if (count <= 9) return "grid-9";
    if (count <= 12) return "grid-12";
    return "grid-16";
  };

  // If exactly 2 people: remote on top, self on bottom in mobile view
  let orderedParticipants = [...participants];
  if (participants.length === 2) {
    const remote = participants.find((p) => !p.isLocal);
    const local = participants.find((p) => p.isLocal);
    if (remote && local) {
      orderedParticipants = [remote, local];
    }
  }

  const pinnedParticipant = pinnedUserId
    ? participants.find((p) => p.userId === pinnedUserId)
    : null;
  const unpinnedParticipants = pinnedUserId
    ? participants.filter((p) => p.userId !== pinnedUserId)
    : orderedParticipants;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        background: "#140f0d",
        color: "#f8fafc",
      }}
    >
      {/* Top Header with Dark Studio Theme */}
      <header
        style={{
          background: "rgba(22, 17, 15, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <button
            type="button"
            onClick={handleLeave}
            style={{
              padding: "7px 14px",
              fontSize: "0.82rem",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "none",
            }}
            title="Leave Room"
          >
            <IconArrowLeft size={16} />
            <span className="call-dock-label">Back</span>
          </button>

          <RoomieAppIcon size={28} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "1.1rem",
                  margin: 0,
                  color: "#ffffff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "clamp(130px, 35vw, 360px)",
                }}
              >
                {room?.name || roomCode}
              </h2>
              {room?.category && (
                <span
                  className="chip"
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.72rem",
                    background: "rgba(255, 158, 125, 0.15)",
                    color: "#ff9e7d",
                    border: "1px solid rgba(255, 158, 125, 0.25)",
                    flexShrink: 0,
                    boxShadow: "none",
                  }}
                >
                  #{room.category}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#a89b94", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Code: <span style={{ fontFamily: "monospace", color: "#ffe6db" }}>{roomCode}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span
            className="badge"
            style={{
              background: participants.length >= 16 ? "var(--clay-danger)" : "rgba(16, 185, 129, 0.15)",
              color: participants.length >= 16 ? "#ffffff" : "#34d399",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "5px 12px",
              fontSize: "0.76rem",
              boxShadow: "none",
            }}
          >
            <IconUsers size={13} />
            <span>{participants.length}/16 Live</span>
          </span>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              padding: "7px 14px",
              fontSize: "0.82rem",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "none",
            }}
            title="Share Room Code"
          >
            {copied ? <IconCheck size={15} color="#34d399" /> : <IconCopy size={15} />}
            <span className="call-dock-label">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* > 8 Participant Bandwidth Notice Banner */}
      {participants.length > 8 && !bandwidthSaver && (
        <div
          style={{
            background: "linear-gradient(135deg, #7c2d12, #9a3412)",
            color: "#ffedd5",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
            fontWeight: 700,
            zIndex: 20,
            gap: "10px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <IconBolt size={16} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Over 8 participants active. Enable Bandwidth Saver to conserve video data.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleBandwidthSaver}
            style={{ padding: "4px 12px", fontSize: "0.75rem", background: "#ffffff", color: "#7c2d12", flexShrink: 0, border: "none" }}
          >
            Enable Saver
          </button>
        </div>
      )}

      {/* Main Call Viewport (Full Screen Studio Stage) */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "max(84px, calc(70px + env(safe-area-inset-bottom)))",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        {connState === "connecting" && participants.length === 0 ? (
          <div style={{ textAlign: "center", color: "#d6c7c0" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "16px",
                borderRadius: "50%",
                background: "rgba(255, 158, 125, 0.15)",
                marginBottom: "14px",
              }}
            >
              <IconSparkles size={32} color="var(--clay-primary)" />
            </div>
            <h3 style={{ color: "#ffffff" }}>Connecting to Sound Stage...</h3>
          </div>
        ) : connState === "error" ? (
          <div
            style={{
              background: "var(--clay-card)",
              color: "var(--clay-ink)",
              border: "1px solid var(--clay-line)",
              maxWidth: "420px",
              textAlign: "center",
              padding: "32px 24px",
              borderRadius: "24px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h3>Connection Error</h3>
            <p style={{ margin: "12px 0 20px", color: "var(--clay-muted)" }}>
              Could not join stage &quot;{roomCode}&quot;. Please check the code and try again.
            </p>
            <button type="button" onClick={handleLeave} style={{ width: "100%" }}>
              Return to Lobby
            </button>
          </div>
        ) : participants.length === 1 ? (
          /* Single user connected: video tile fills viewport gracefully with elegant overlaid pill */
          <div
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "960px",
              maxHeight: "calc(100vh - 180px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <VideoTile
              participant={participants[0]}
              isPinned={false}
              onTogglePin={handleTogglePin}
              mirrored={session?.videoMirrored}
              quality="high"
            />

            {/* Subtle Overlaid Waiting Pill (No giant white card!) */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(22, 17, 15, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 158, 125, 0.35)",
                borderRadius: "999px",
                padding: "6px 14px 6px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
              <span style={{ fontSize: "0.82rem", color: "#f8fafc", fontWeight: 700, whiteSpace: "nowrap" }}>
                Stage Ready · Waiting for peers
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: "var(--clay-primary)",
                  color: "var(--clay-primary-dark)",
                  border: "none",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "0.74rem",
                  boxShadow: "none",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        ) : pinnedParticipant ? (
          /* Pinned Stage Layout */
          <div className="pinned-layout">
            <div className="pinned-stage">
              <VideoTile
                participant={pinnedParticipant}
                isPinned={true}
                onTogglePin={handleTogglePin}
                mirrored={pinnedParticipant.isLocal && session?.videoMirrored}
                quality="high"
              />
            </div>

            <div className="pinned-strip">
              {unpinnedParticipants.map((p) => (
                <div key={p.userId} style={{ minHeight: "130px" }}>
                  <VideoTile
                    participant={p}
                    isPinned={false}
                    onTogglePin={handleTogglePin}
                    mirrored={p.isLocal && session?.videoMirrored}
                    quality={bandwidthSaver ? "off" : "low"}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Auto Grid */
          <div className={`video-grid ${getGridClass(participants.length)}`}>
            {orderedParticipants.map((p) => {
              const tileQuality = bandwidthSaver && !p.isLocal
                ? "off"
                : participants.length > 4 && !p.isLocal
                ? "low"
                : "high";

              return (
                <VideoTile
                  key={p.userId}
                  participant={p}
                  isPinned={false}
                  onTogglePin={handleTogglePin}
                  mirrored={p.isLocal && session?.videoMirrored}
                  quality={tileQuality}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Dark Studio Media Dock (No white glow!) */}
      <MediaControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        bandwidthSaver={bandwidthSaver}
        isPinned={!!pinnedUserId}
        unreadChatCount={unreadChatCount}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleBandwidthSaver={handleToggleBandwidthSaver}
        onUnpin={() => setPinnedUserId(null)}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          setUnreadChatCount(0);
        }}
        onLeave={handleLeave}
      />

      {/* In-Room Text Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        messages={messages}
        currentUserId={session?.id || ""}
        onSendMessage={(text) => clientRef.current?.sendChatMessage(text)}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Onboarding if opened direct via URL without session */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={(sess) => {
          setSession(sess);
          setShowOnboarding(false);
          initRoomAndCall(sess);
        }}
      />
    </div>
  );
}
