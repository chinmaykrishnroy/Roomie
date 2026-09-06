package ice

import (
	"testing"
	"time"
)

func TestSharedSecretProvider(t *testing.T) {
	provider := SharedSecretProvider{
		Secret: "very-long-secret-key-for-turn-relay-testing",
		URLs:   []string{"turn:13.234.238.124:3478?transport=udp"},
		TTL:    15 * time.Minute,
	}

	now := time.Now()
	cfg, err := provider.Configuration("user-123", now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(cfg.ICEServers) != 1 {
		t.Fatalf("expected 1 ICE server, got %d", len(cfg.ICEServers))
	}

	srv := cfg.ICEServers[0]
	if !ValidUsername(srv.Username, now) {
		t.Fatalf("expected valid username, got %s", srv.Username)
	}

	expectedPass := Password(provider.Secret, srv.Username)
	if srv.Credential != expectedPass {
		t.Fatalf("expected credential %s, got %s", expectedPass, srv.Credential)
	}
}
