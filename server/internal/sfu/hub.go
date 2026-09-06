package sfu

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"

	"example.com/roomie/server/internal/ice"
	"example.com/roomie/server/internal/store"
	"github.com/coder/websocket"
	"golang.org/x/time/rate"
)

type Participant struct {
	Info         ParticipantInfo
	Conn         *websocket.Conn
	SendChan     chan []byte
	Ctx          context.Context
	Cancel       context.CancelFunc
	QualityPrefs map[string]string // targetUserId -> "high", "low", "off"
}

type RoomSession struct {
	Code         string
	StoreRoomID  string
	Mu           sync.RWMutex
	Participants map[string]*Participant
	CreatedAt    time.Time
}

func (r *RoomSession) GetParticipantList() []ParticipantInfo {
	r.Mu.RLock()
	defer r.Mu.RUnlock()
	list := make([]ParticipantInfo, 0, len(r.Participants))
	for _, p := range r.Participants {
		list = append(list, p.Info)
	}
	return list
}

func (r *RoomSession) Broadcast(msg *Message, excludeUserID string) {
	data := msg.Encode()
	r.Mu.RLock()
	defer r.Mu.RUnlock()
	for uid, p := range r.Participants {
		if uid != excludeUserID {
			select {
			case p.SendChan <- data:
			default:
				// Dropped if buffer full
			}
		}
	}
}

type Hub struct {
	Mu          sync.RWMutex
	Rooms       map[string]*RoomSession
	Store       *store.Store
	ICEProvider ice.Provider
}

func NewHub(st *store.Store, iceProv ice.Provider) *Hub {
	return &Hub{
		Rooms:       make(map[string]*RoomSession),
		Store:       st,
		ICEProvider: iceProv,
	}
}

func (h *Hub) GetOrCreateRoom(code string, storeRoomID string) *RoomSession {
	h.Mu.Lock()
	defer h.Mu.Unlock()
	room, exists := h.Rooms[code]
	if !exists {
		room = &RoomSession{
			Code:         code,
			StoreRoomID:  storeRoomID,
			Participants: make(map[string]*Participant),
			CreatedAt:    time.Now(),
		}
		h.Rooms[code] = room
	}
	return room
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// 1. Upgrade WebSocket
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		http.Error(w, "failed to upgrade websocket", http.StatusBadRequest)
		return
	}
	defer conn.CloseNow()

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	conn.SetReadLimit(128 << 10)

	// 2. Read first message (Must be "join")
	readCtx, readCancel := context.WithTimeout(ctx, 10*time.Second)
	_, firstData, err := conn.Read(readCtx)
	readCancel()
	if err != nil {
		return
	}

	firstMsg, err := DecodeMessage(firstData)
	if err != nil || firstMsg.Type != "join" || firstMsg.RoomCode == "" || firstMsg.UserID == "" {
		_ = sendMsg(ctx, conn, &Message{Type: "error", Error: "invalid_join_message"})
		return
	}

	roomCode := firstMsg.RoomCode
	userID := firstMsg.UserID
	username := firstMsg.Username
	if username == "" {
		username = "User_" + userID[:4]
	}

	// 3. Verify Room in Store
	var storeRoomID string
	if h.Store != nil {
		dbRoom, err := h.Store.GetRoomByCode(ctx, roomCode)
		if err != nil {
			_ = sendMsg(ctx, conn, &Message{Type: "error", Error: "room_not_found"})
			return
		}
		storeRoomID = dbRoom.ID
	}

	room := h.GetOrCreateRoom(roomCode, storeRoomID)

	room.Mu.Lock()
	if len(room.Participants) >= 16 {
		room.Mu.Unlock()
		_ = sendMsg(ctx, conn, &Message{Type: "error", Error: "room_is_full"})
		return
	}

	// Check if already in room
	if existing, found := room.Participants[userID]; found {
		existing.Cancel()
		delete(room.Participants, userID)
	}

	p := &Participant{
		Info: ParticipantInfo{
			UserID:       userID,
			Username:     username,
			JoinedAt:     time.Now(),
			AudioEnabled: true,
			VideoEnabled: true,
			Quality:      "high",
		},
		Conn:         conn,
		SendChan:     make(chan []byte, 256),
		Ctx:          ctx,
		Cancel:       cancel,
		QualityPrefs: make(map[string]string),
	}
	room.Participants[userID] = p
	room.Mu.Unlock()

	// Register in PostgreSQL & Redis
	if h.Store != nil && storeRoomID != "" {
		_ = h.Store.AddParticipant(ctx, storeRoomID, userID, username, 0, 0)
	}

	// Defer cleanup on exit
	defer func() {
		room.Mu.Lock()
		delete(room.Participants, userID)
		remains := len(room.Participants)
		room.Mu.Unlock()

		if h.Store != nil && storeRoomID != "" {
			_ = h.Store.RemoveParticipant(context.Background(), storeRoomID, userID)
		}

		// Broadcast peer_left
		room.Broadcast(&Message{
			Type:   "peer_left",
			UserID: userID,
		}, "")

		// If room empty, clean up memory room after a grace period
		if remains == 0 {
			h.Mu.Lock()
			delete(h.Rooms, roomCode)
			h.Mu.Unlock()
		}
	}()

	// 4. Get ICE Servers Configuration (with TURN credentials)
	var iceConfig any
	if h.ICEProvider != nil {
		cfg, err := h.ICEProvider.Configuration(userID, time.Now())
		if err == nil {
			iceConfig = cfg
		}
	}

	// 5. Send "room_state" to newly joined participant
	currentPeers := room.GetParticipantList()
	initMsg := &Message{
		Type:         "room_state",
		RoomCode:     roomCode,
		UserID:       userID,
		Participants: currentPeers,
		ICEServers:   iceConfig,
	}
	if err := sendMsg(ctx, conn, initMsg); err != nil {
		return
	}

	// 6. Notify all other peers about new participant
	room.Broadcast(&Message{
		Type:        "peer_joined",
		RoomCode:    roomCode,
		Participant: &p.Info,
	}, userID)

	// Writer goroutine for client
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case data, ok := <-p.SendChan:
				if !ok {
					return
				}
				writeDeadline, writeCancel := context.WithTimeout(ctx, 5*time.Second)
				err := conn.Write(writeDeadline, websocket.MessageText, data)
				writeCancel()
				if err != nil {
					cancel()
					return
				}
			}
		}
	}()

	// Rate limiter for messages
	limiter := rate.NewLimiter(60, 120)

	// 7. Message Loop
	for {
		readDeadline, rCancel := context.WithTimeout(ctx, 45*time.Second)
		msgType, data, err := conn.Read(readDeadline)
		rCancel()
		if err != nil {
			break
		}

		if msgType != websocket.MessageText || !limiter.Allow() {
			continue
		}

		m, err := DecodeMessage(data)
		if err != nil {
			continue
		}

		switch m.Type {
		case "heartbeat":
			// Acknowledge heartbeat
			select {
			case p.SendChan <- (&Message{Type: "heartbeat_ack"}).Encode():
			default:
			}

		case "signal":
			// Relay WebRTC signal (offer, answer, candidate) to TargetUserID
			if m.TargetUserID == "" {
				continue
			}
			m.UserID = userID // Ensure source is authenticated user
			room.Mu.RLock()
			targetPeer, exists := room.Participants[m.TargetUserID]
			room.Mu.RUnlock()
			if exists {
				select {
				case targetPeer.SendChan <- m.Encode():
				default:
				}
			}

		case "media_state":
			// Update local audio/video toggle
			room.Mu.Lock()
			if m.AudioEnabled != nil {
				p.Info.AudioEnabled = *m.AudioEnabled
			}
			if m.VideoEnabled != nil {
				p.Info.VideoEnabled = *m.VideoEnabled
			}
			room.Mu.Unlock()

			// Broadcast media state update to room
			room.Broadcast(&Message{
				Type:         "media_state",
				UserID:       userID,
				AudioEnabled: m.AudioEnabled,
				VideoEnabled: m.VideoEnabled,
			}, userID)

		case "set_quality":
			// Tile size based quality ("high", "low", "off")
			// e.g. targetUserId is small tile (120x160) -> client sends "low"
			// or user toggles off video if > 8 people to save bandwidth -> "off"
			if m.TargetUserID != "" && m.Quality != "" {
				p.QualityPrefs[m.TargetUserID] = m.Quality
				// Forward quality hint to target publisher so it can throttle encoding
				room.Mu.RLock()
				targetPeer, exists := room.Participants[m.TargetUserID]
				room.Mu.RUnlock()
				if exists {
					select {
					case targetPeer.SendChan <- (&Message{
						Type:         "quality_hint",
						UserID:       userID,
						TargetUserID: m.TargetUserID,
						Quality:      m.Quality,
					}).Encode():
					default:
					}
				}
			}

		case "chat_message":
			// In-call text chat
			if m.Text == "" {
				continue
			}
			m.Sender = username
			m.UserID = userID
			m.Timestamp = time.Now().UnixMilli()
			room.Broadcast(m, "")

		default:
			log.Printf("unhandled message type: %s", m.Type)
		}
	}
}

func sendMsg(ctx context.Context, c *websocket.Conn, m *Message) error {
	deadline, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return c.Write(deadline, websocket.MessageText, m.Encode())
}
