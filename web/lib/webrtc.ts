export interface ParticipantState {
  userId: string;
  username: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  stream?: MediaStream;
  quality?: "high" | "low" | "off";
  isLocal?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  userId: string;
  text: string;
  timestamp: number;
}

export class RoomieCallClient {
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private remoteStreams = new Map<string, MediaStream>();
  private iceServers: RTCIceServer[] = [];
  private currentUserId = "";
  private currentRoomCode = "";
  private isMuted = false;
  private isCameraOff = false;
  private bandwidthSaver = false;

  public onParticipantsUpdate?: (participants: ParticipantState[]) => void;
  public onChatMessageReceived?: (msg: ChatMessage) => void;
  public onConnectionStateChange?: (state: "connecting" | "connected" | "disconnected" | "error") => void;

  private participants = new Map<string, ParticipantState>();

  constructor(private apiBaseWs: string = "") {}

  async initLocalMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });
      return this.localStream;
    } catch (err) {
      console.warn("Could not acquire media with requested constraints, falling back", err);
      // Fallback: audio only or default
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return this.localStream;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async join(
    roomCode: string,
    userId: string,
    username: string,
    iceServers: RTCIceServer[],
    coords?: { latitude: number; longitude: number } | null
  ) {
    this.currentUserId = userId;
    this.currentRoomCode = roomCode;
    this.iceServers = iceServers;

    this.onConnectionStateChange?.("connecting");

    // Add self to participant list
    this.participants.set(userId, {
      userId,
      username,
      audioEnabled: !this.isMuted,
      videoEnabled: !this.isCameraOff,
      stream: this.localStream || undefined,
      isLocal: true,
      quality: "high",
    });
    this.notifyParticipants();

    // Determine WS URL
    let wsUrl = this.apiBaseWs;
    if (!wsUrl) {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${proto}//${window.location.host}/v1/ws`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      // Send join message
      this.send({
        type: "join",
        roomCode,
        userId,
        username,
        lat: coords?.latitude,
        lon: coords?.longitude,
      });
      this.onConnectionStateChange?.("connected");
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleMessage(msg);
      } catch (err) {
        console.error("Error parsing WS message", err);
      }
    };

    this.ws.onclose = () => {
      this.onConnectionStateChange?.("disconnected");
      this.cleanup();
    };

    this.ws.onerror = (err) => {
      console.error("WS error", err);
      this.onConnectionStateChange?.("error");
    };
  }

  private async handleMessage(msg: any) {
    switch (msg.type) {
      case "room_state":
        if (msg.iceServers && msg.iceServers.iceServers) {
          this.iceServers = msg.iceServers.iceServers;
        }
        // Initialize existing participants
        if (Array.isArray(msg.participants)) {
          for (const p of msg.participants) {
            if (p.userId !== this.currentUserId) {
              this.participants.set(p.userId, {
                userId: p.userId,
                username: p.username,
                audioEnabled: p.audioEnabled,
                videoEnabled: p.videoEnabled,
                quality: p.quality || "high",
                isLocal: false,
              });
              // Initiate WebRTC connection to existing peer
              await this.createPeerConnection(p.userId, true);
            }
          }
          this.notifyParticipants();
        }
        break;

      case "peer_joined":
        if (msg.participant && msg.participant.userId !== this.currentUserId) {
          const p = msg.participant;
          this.participants.set(p.userId, {
            userId: p.userId,
            username: p.username,
            audioEnabled: p.audioEnabled,
            videoEnabled: p.videoEnabled,
            quality: p.quality || "high",
            isLocal: false,
          });
          this.notifyParticipants();
          // The joined peer will be called or answer
          await this.createPeerConnection(p.userId, false);
        }
        break;

      case "peer_left":
        if (msg.userId) {
          this.closePeerConnection(msg.userId);
          this.participants.delete(msg.userId);
          this.remoteStreams.delete(msg.userId);
          this.notifyParticipants();
        }
        break;

      case "signal":
        await this.handleSignal(msg);
        break;

      case "media_state":
        if (msg.userId && this.participants.has(msg.userId)) {
          const p = this.participants.get(msg.userId)!;
          if (msg.audioEnabled !== undefined) p.audioEnabled = msg.audioEnabled;
          if (msg.videoEnabled !== undefined) p.videoEnabled = msg.videoEnabled;
          this.notifyParticipants();
        }
        break;

      case "chat_message":
        this.onChatMessageReceived?.({
          id: msg.timestamp ? `${msg.userId}_${msg.timestamp}` : Math.random().toString(),
          sender: msg.sender || msg.username || "Anonymous",
          userId: msg.userId,
          text: msg.text,
          timestamp: msg.timestamp || Date.now(),
        });
        break;
    }
  }

  private async createPeerConnection(remoteUserId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(remoteUserId)) {
      return this.peerConnections.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers.length > 0 ? this.iceServers : [{ urls: "stun:stun.l.google.com:19302" }],
      bundlePolicy: "max-bundle",
    });

    this.peerConnections.set(remoteUserId, pc);

    // Add local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(remoteUserId, stream);

      const p = this.participants.get(remoteUserId);
      if (p) {
        p.stream = stream;
        this.notifyParticipants();
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "signal",
          targetUserId: remoteUserId,
          signalType: "candidate",
          data: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        console.warn(`ICE state with ${remoteUserId}: ${pc.iceConnectionState}`);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.send({
          type: "signal",
          targetUserId: remoteUserId,
          signalType: "offer",
          data: offer,
        });
      } catch (err) {
        console.error("Error creating offer", err);
      }
    }

    return pc;
  }

  private async handleSignal(msg: any) {
    const fromUserId = msg.userId;
    if (!fromUserId) return;

    let pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      pc = await this.createPeerConnection(fromUserId, false);
    }

    if (msg.signalType === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.send({
        type: "signal",
        targetUserId: fromUserId,
        signalType: "answer",
        data: answer,
      });
    } else if (msg.signalType === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
    } else if (msg.signalType === "candidate") {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.data));
      } catch (err) {
        console.error("Error adding ice candidate", err);
      }
    }
  }

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    this.isMuted = enabled !== undefined ? !enabled : !audioTrack.enabled;
    audioTrack.enabled = !this.isMuted;

    // Update local state
    const local = this.participants.get(this.currentUserId);
    if (local) {
      local.audioEnabled = !this.isMuted;
      this.notifyParticipants();
    }

    // Broadcast media state
    this.send({
      type: "media_state",
      audioEnabled: !this.isMuted,
      videoEnabled: !this.isCameraOff,
    });

    return !this.isMuted;
  }

  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    this.isCameraOff = enabled !== undefined ? !enabled : videoTrack.enabled;
    videoTrack.enabled = !this.isCameraOff;

    // Update local state
    const local = this.participants.get(this.currentUserId);
    if (local) {
      local.videoEnabled = !this.isCameraOff;
      this.notifyParticipants();
    }

    // Broadcast media state
    this.send({
      type: "media_state",
      audioEnabled: !this.isMuted,
      videoEnabled: !this.isCameraOff,
    });

    return !this.isCameraOff;
  }

  // Bandwidth Saver for > 8 participants (like Discord)
  setBandwidthSaver(enabled: boolean) {
    this.bandwidthSaver = enabled;
    // Iterate through peer connections and disable/enable video transceivers/tracks
    this.peerConnections.forEach((pc, userId) => {
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track && receiver.track.kind === "video") {
          receiver.track.enabled = !enabled;
        }
      });
      // Send quality hint to publisher
      this.send({
        type: "set_quality",
        targetUserId: userId,
        quality: enabled ? "off" : "high",
      });
    });
  }

  // Adapt quality based on tile size
  setPeerQuality(targetUserId: string, quality: "high" | "low" | "off") {
    const p = this.participants.get(targetUserId);
    if (p) {
      p.quality = quality;
    }
    const pc = this.peerConnections.get(targetUserId);
    if (pc) {
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track && receiver.track.kind === "video") {
          receiver.track.enabled = quality !== "off";
        }
      });
    }
    this.send({
      type: "set_quality",
      targetUserId,
      quality,
    });
  }

  sendChatMessage(text: string) {
    if (!text.trim()) return;
    this.send({
      type: "chat_message",
      text: text.trim(),
    });
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private notifyParticipants() {
    this.onParticipantsUpdate?.(Array.from(this.participants.values()));
  }

  private closePeerConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
  }

  leave() {
    this.cleanup();
  }

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.participants.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyParticipants();
  }
}
