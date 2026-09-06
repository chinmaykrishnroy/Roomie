package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"example.com/roomie/server/internal/ice"
	"example.com/roomie/server/internal/sfu"
)

func TestEndpoints(t *testing.T) {
	iceProv := ice.SharedSecretProvider{
		Secret: "test-secret-key-32-chars-long-at-least",
		URLs:   []string{"stun:13.234.238.124:3478", "turn:13.234.238.124:3478?transport=udp"},
		TTL:    10 * time.Minute,
	}
	hub := sfu.NewHub(nil, iceProv)
	srv := NewServer(nil, hub, iceProv)

	mux := http.NewServeMux()
	srv.Register(mux)

	// 1. Healthz
	rec := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/healthz", nil)
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Generate Username
	rec = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/v1/user/generate-name", nil)
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var uRes map[string]string
	_ = json.NewDecoder(rec.Body).Decode(&uRes)
	if uRes["username"] == "" {
		t.Fatalf("empty generated username")
	}

	// 3. Generate Room Name
	rec = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/v1/room/generate-name", nil)
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var rRes map[string]string
	_ = json.NewDecoder(rec.Body).Decode(&rRes)
	if rRes["name"] == "" {
		t.Fatalf("empty generated room name")
	}

	// 4. Generate Room Code
	rec = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/v1/room/generate-code", nil)
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var cRes map[string]string
	_ = json.NewDecoder(rec.Body).Decode(&cRes)
	if cRes["code"] == "" {
		t.Fatalf("empty generated room code")
	}

	// 5. ICE Servers
	rec = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/v1/ice-servers?user=tester", nil)
	mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var cfg ice.Configuration
	_ = json.NewDecoder(rec.Body).Decode(&cfg)
	if len(cfg.ICEServers) != 1 {
		t.Fatalf("expected 1 ICE server config, got %d", len(cfg.ICEServers))
	}
}
