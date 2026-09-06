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
        height: "100vh",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        background: "#191412",
        color: "#f8fafc",
      }}
    >
      {/* Top Header with Responsive Non-clipping Layout */}
      <header
        style={{
          background: "rgba(25, 20, 18, 0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <button
            type="button"
            onClick={handleLeave}
            className="secondary"
            style={{ padding: "7px 12px", fontSize: "0.82rem", borderRadius: "999px" }}
            title="Leave Room"
          >
            <IconArrowLeft size={16} />
            <span className="call-dock-label">Leave</span>
          </button>

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
                  maxWidth: "clamp(130px, 35vw, 340px)",
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
                    background: "var(--clay-peach-soft)",
                    color: "var(--clay-peach-soft-dark)",
                    flexShrink: 0,
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span
            className="badge"
            style={{
              background: participants.length >= 16 ? "var(--clay-danger)" : "var(--clay-sage)",
              color: participants.length >= 16 ? "var(--clay-danger-dark)" : "var(--clay-sage-dark)",
              padding: "5px 10px",
              fontSize: "0.76rem",
            }}
          >
            <IconUsers size={13} />
            <span>{participants.length}/16</span>
          </span>

          <button
            type="button"
            onClick={handleCopyLink}
            className="secondary"
            style={{ padding: "7px 12px", fontSize: "0.82rem", borderRadius: "999px" }}
            title="Share Room Code"
          >
            {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
            <span className="call-dock-label">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* > 8 Participant Bandwidth Notice Banner */}
      {participants.length > 8 && !bandwidthSaver && (
        <div
          style={{
            background: "linear-gradient(135deg, #fed7aa, #fdba74)",
            color: "#7c2d12",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.82rem",
            fontWeight: 700,
            zIndex: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            gap: "10px",
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
            style={{ padding: "5px 12px", fontSize: "0.75rem", background: "#ffffff", color: "#7c2d12", flexShrink: 0 }}
          >
            Enable Saver
          </button>
        </div>
      )}

      {/* Main Call Viewport (Responsive, No Overflow Clipping) */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: "max(90px, calc(74px + env(safe-area-inset-bottom)))",
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
            <h3 style={{ color: "#ffffff" }}>Connecting to Roomie...</h3>
          </div>
        ) : connState === "error" ? (
          <div className="card" style={{ color: "var(--clay-ink)", maxWidth: "420px", textAlign: "center", padding: "32px 24px" }}>
            <h3>Connection Error</h3>
            <p style={{ margin: "12px 0 20px" }}>
              Could not join room &quot;{roomCode}&quot;. Please verify the code and check your connection.
            </p>
            <button type="button" onClick={handleLeave} style={{ width: "100%" }}>
              Return to Home
            </button>
          </div>
        ) : participants.length === 1 ? (
          /* Single user connected like Discord */
          <div style={{ width: "100%", maxWidth: "760px", height: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ flex: 1, minHeight: "260px" }}>
              <VideoTile
                participant={participants[0]}
                isPinned={false}
                onTogglePin={handleTogglePin}
                mirrored={session?.videoMirrored}
                quality="high"
              />
            </div>
            <div
              className="card"
              style={{
                background: "linear-gradient(135deg, #fff3eb, #ffe6d8)",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--clay-primary-dark)" }}>
                  You are in the room!
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--clay-muted)" }}>
                  Waiting for friends to join. Share code: <strong style={{ color: "var(--clay-ink)" }}>{roomCode}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="secondary"
                style={{ padding: "8px 16px", fontSize: "0.82rem" }}
              >
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                <span>{copied ? "Copied Link" : "Copy Link"}</span>
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
          /* Standard Auto Grid (or 2-person mobile stacked) */
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

      {/* Floating Bottom Media Dock */}
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
