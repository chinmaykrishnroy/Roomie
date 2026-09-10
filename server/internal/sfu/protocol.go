package sfu

import (
	"encoding/json"
	"time"
)

type ParticipantInfo struct {
	UserID       string    `json:"userId"`
	Username     string    `json:"username"`
	JoinedAt     time.Time `json:"joinedAt"`
	AudioEnabled bool      `json:"audioEnabled"`
	VideoEnabled bool      `json:"videoEnabled"`
	Quality      string    `json:"quality"` // "high", "low", "off"
	IsPinned     bool      `json:"isPinned"`
}

type Message struct {
	Type         string           `json:"type"`
	RoomCode     string           `json:"roomCode,omitempty"`
	UserID       string           `json:"userId,omitempty"`
	Username     string           `json:"username,omitempty"`
	TargetUserID string           `json:"targetUserId,omitempty"`
	SignalType   string           `json:"signalType,omitempty"` // "offer", "answer", "candidate"
	Data         json.RawMessage  `json:"data,omitempty"`
	Participants []ParticipantInfo `json:"participants,omitempty"`
	Participant  *ParticipantInfo `json:"participant,omitempty"`
	AudioEnabled *bool            `json:"audioEnabled,omitempty"`
	VideoEnabled *bool            `json:"videoEnabled,omitempty"`
	Quality      string           `json:"quality,omitempty"`
	Text         string           `json:"text,omitempty"`
	Sender       string           `json:"sender,omitempty"`
	Timestamp    int64            `json:"timestamp,omitempty"`
	Error        string           `json:"error,omitempty"`
	ICEServers   any              `json:"iceServers,omitempty"`
	Lat          *float64         `json:"lat,omitempty"`
	Lon          *float64         `json:"lon,omitempty"`
}

func DecodeMessage(data []byte) (*Message, error) {
	var m Message
	err := json.Unmarshal(data, &m)
	return &m, err
}

func (m *Message) Encode() []byte {
	b, _ := json.Marshal(m)
	return b
}
