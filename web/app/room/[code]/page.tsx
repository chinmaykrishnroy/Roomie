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
        maxHeight: "100vh",
        overflow: "hidden",
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            onClick={handleLeave}
            className="secondary"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
          >
            <IconArrowLeft size={16} />
            <span>Leave</span>
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#ffffff" }}>{room?.name || roomCode}</h2>
              {room?.category && (
                <span className="chip" style={{ padding: "2px 10px", fontSize: "0.75rem", background: "var(--clay-lilac)", color: "var(--clay-lilac-dark)" }}>
                  #{room.category}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700 }}>
              Code: <span style={{ fontFamily: "monospace", color: "#ffffff" }}>{roomCode}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            className="badge"
            style={{
              background: participants.length >= 16 ? "var(--clay-danger)" : "var(--clay-primary)",
              color: participants.length >= 16 ? "var(--clay-danger-dark)" : "var(--clay-primary-dark)",
              padding: "6px 12px",
              fontSize: "0.82rem",
            }}
          >
            <IconUsers size={14} />
            <span>{participants.length} / 16</span>
          </span>

          <button
            type="button"
            onClick={handleCopyLink}
            className="secondary"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            <span>{copied ? "Copied!" : "Share Code"}</span>
          </button>
        </div>
      </header>

      {/* > 8 Participant Bandwidth Notice Banner */}
      {participants.length > 8 && !bandwidthSaver && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef08a, #fde047)",
            color: "#854d0e",
            padding: "10px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.86rem",
            fontWeight: 700,
            zIndex: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconBolt size={18} />
            <span>Over 8 participants active. Turn on Bandwidth Saver to conserve video data (Discord style).</span>
          </div>
          <button
            type="button"
            onClick={handleToggleBandwidthSaver}
            style={{ padding: "6px 14px", fontSize: "0.8rem", background: "#ffffff", color: "#854d0e" }}
          >
            Turn On Saver
          </button>
        </div>
      )}

      {/* Main Call Viewport */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          paddingBottom: "110px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {connState === "connecting" && participants.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8" }}>
            <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", marginBottom: "14px" }}>
              <IconSparkles size={32} color="#bae6fd" />
            </div>
            <h3>Connecting to Roomie...</h3>
          </div>
        ) : connState === "error" ? (
          <div className="card" style={{ color: "var(--clay-ink)", maxWidth: "440px", textAlign: "center", padding: "36px" }}>
            <h3>Connection Error</h3>
            <p style={{ margin: "14px 0 24px" }}>
              Could not join room &quot;{roomCode}&quot;. Please verify the code and check your connection.
            </p>
            <button type="button" onClick={handleLeave} style={{ width: "100%" }}>
              Return to Home
            </button>
          </div>
        ) : participants.length === 1 ? (
          /* Single user connected like Discord */
          <div style={{ width: "100%", maxWidth: "760px", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ flex: 1, minHeight: "280px" }}>
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
                background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--clay-lilac-dark)" }}>
                  You are in the room!
                </div>
                <div style={{ fontSize: "0.88rem", color: "#475569" }}>
                  Waiting for friends to join. Share your room code: <strong style={{ color: "#1e1b4b" }}>{roomCode}</strong>
                </div>
              </div>
              <button type="button" onClick={handleCopyLink} className="secondary" style={{ padding: "10px 18px" }}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                <span>{copied ? "Copied Link" : "Copy Invite Link"}</span>
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
                <div key={p.userId} style={{ minHeight: "140px" }}>
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
