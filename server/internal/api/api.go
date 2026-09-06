package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"example.com/roomie/server/internal/geo"
	"example.com/roomie/server/internal/ice"
	"example.com/roomie/server/internal/names"
	"example.com/roomie/server/internal/sfu"
	"example.com/roomie/server/internal/store"
)

type Server struct {
	Store       *store.Store
	Hub         *sfu.Hub
	ICEProvider ice.Provider
}

func NewServer(st *store.Store, hub *sfu.Hub, iceProv ice.Provider) *Server {
	return &Server{
		Store:       st,
		Hub:         hub,
		ICEProvider: iceProv,
	}
}

func (s *Server) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", s.healthCheck)
	mux.HandleFunc("GET /v1/healthz", s.healthCheck)
	mux.HandleFunc("GET /v1/user/generate-name", s.generateUsername)
	mux.HandleFunc("GET /v1/room/generate-name", s.generateRoomName)
	mux.HandleFunc("GET /v1/room/generate-code", s.generateRoomCode)
	mux.HandleFunc("GET /v1/ice-servers", s.getICEServers)
	mux.HandleFunc("POST /v1/rooms", s.createRoom)
	mux.HandleFunc("GET /v1/rooms", s.listRooms)
	mux.HandleFunc("GET /v1/rooms/{code}", s.getRoom)
	mux.HandleFunc("GET /v1/ws", s.Hub.HandleWebSocket)
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok", "app": "roomie"})
}

func (s *Server) generateUsername(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"username": names.GenerateUsername(),
	})
}

func (s *Server) generateRoomName(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"name": names.GenerateRoomName(),
	})
}

func (s *Server) generateRoomCode(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"code": names.GeneratePrivateRoomCode(),
	})
}

func (s *Server) getICEServers(w http.ResponseWriter, r *http.Request) {
	subject := r.URL.Query().Get("user")
	if subject == "" {
		subject = "anonymous"
	}
	cfg, err := s.ICEProvider.Configuration(subject, time.Now())
	if err != nil {
		http.Error(w, "failed to generate ICE servers", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(cfg)
}

type CreateRoomRequest struct {
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	Category         string  `json:"category"`
	IsCustomCategory bool    `json:"isCustomCategory"`
	IsPrivate        bool    `json:"isPrivate"`
	CustomCode       string  `json:"customCode"`
	Latitude         float64 `json:"latitude"`
	Longitude        float64 `json:"longitude"`
}

func (s *Server) createRoom(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		req.Name = names.GenerateRoomName()
	}
	if strings.TrimSpace(req.Category) == "" {
		req.Category = "chill"
	}

	code := strings.TrimSpace(req.CustomCode)
	if code == "" {
		if req.IsPrivate {
			code = names.GeneratePrivateRoomCode()
		} else {
			code = strings.ToLower(strings.ReplaceAll(req.Name, " ", "-")) + "-" + names.GeneratePrivateRoomCode()[len(names.GeneratePrivateRoomCode())-4:]
		}
	}
	// normalize code
	code = strings.ToLower(strings.TrimSpace(code))

	room := &store.Room{
		Code:             code,
		Name:             strings.TrimSpace(req.Name),
		Description:      strings.TrimSpace(req.Description),
		Category:         strings.ToLower(strings.TrimSpace(req.Category)),
		IsCustomCategory: req.IsCustomCategory,
		IsPrivate:        req.IsPrivate,
		MaxParticipants:  16,
		CentroidLat:      req.Latitude,
		CentroidLon:      req.Longitude,
	}

	if err := s.Store.CreateRoom(r.Context(), room); err != nil {
		http.Error(w, "failed to create room: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(room)
}

func (s *Server) listRooms(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	query := r.URL.Query().Get("query")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 12
	}

	lat, lon, hasLoc := geo.LocationFromRequest(r)

	rooms, total, err := s.Store.ListPublicRooms(r.Context(), category, query, lat, lon, hasLoc, page, limit)
	if err != nil {
		http.Error(w, "failed to list rooms: "+err.Error(), http.StatusInternalServerError)
		return
	}

	totalPages := (total + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	res := map[string]any{
		"rooms":       rooms,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"totalPages":  totalPages,
		"hasLocation": hasLoc,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (s *Server) getRoom(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	if code == "" {
		http.Error(w, "missing room code", http.StatusBadRequest)
		return
	}

	room, err := s.Store.GetRoomByCode(r.Context(), code)
	if err != nil {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(room)
}
