export interface Room {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  isCustomCategory: boolean;
  isPrivate: boolean;
  maxParticipants: number;
  centroidLat: number;
  centroidLon: number;
  participantCount: number;
  createdAt: string;
  score?: number;
  distanceKm?: number;
}

export interface ListRoomsResponse {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasLocation: boolean;
}

const API_BASE = "";

export async function fetchGeneratedUsername(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/user/generate-name`);
  if (!res.ok) throw new Error("Failed to generate username");
  const data = await res.json();
  return data.username;
}

export async function fetchGeneratedRoomName(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/room/generate-name`);
  if (!res.ok) throw new Error("Failed to generate room name");
  const data = await res.json();
  return data.name;
}

export async function fetchGeneratedRoomCode(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/room/generate-code`);
  if (!res.ok) throw new Error("Failed to generate room code");
  const data = await res.json();
  return data.code;
}

export async function createRoom(payload: {
  name: string;
  description: string;
  category: string;
  isCustomCategory: boolean;
  isPrivate: boolean;
  customCode?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Room> {
  const res = await fetch(`${API_BASE}/v1/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Failed to create room");
  }
  return res.json();
}

export async function listPublicRooms(params: {
  category?: string;
  query?: string;
  lat?: number;
  lon?: number;
  page?: number;
  limit?: number;
}): Promise<ListRoomsResponse> {
  const q = new URLSearchParams();
  if (params.category && params.category !== "all") q.set("category", params.category);
  if (params.query) q.set("query", params.query);
  if (params.lat !== undefined && params.lon !== undefined) {
    q.set("lat", params.lat.toString());
    q.set("lon", params.lon.toString());
  }
  if (params.page) q.set("page", params.page.toString());
  if (params.limit) q.set("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/v1/rooms?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch public rooms");
  return res.json();
}

export async function getRoomByCode(code: string): Promise<Room> {
  const res = await fetch(`${API_BASE}/v1/rooms/${encodeURIComponent(code)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Room not found");
    throw new Error("Failed to retrieve room");
  }
  return res.json();
}

export async function getICEServers(userId: string): Promise<RTCIceServer[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/ice-servers?user=${encodeURIComponent(userId)}`);
    if (!res.ok) return [{ urls: ["stun:stun.l.google.com:19302"] }];
    const data = await res.json();
    return data.iceServers || [{ urls: ["stun:stun.l.google.com:19302"] }];
  } catch {
    return [{ urls: ["stun:stun.l.google.com:19302"] }];
  }
}
