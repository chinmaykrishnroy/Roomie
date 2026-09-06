package names

import (
	"strings"
	"testing"
)

func TestGenerateUsername(t *testing.T) {
	for i := 0; i < 20; i++ {
		u := GenerateUsername()
		if len(u) < 4 {
			t.Fatalf("username too short: %s", u)
		}
		if strings.Contains(u, " ") || strings.Contains(u, "-") {
			t.Fatalf("username should be camel case without spaces: %s", u)
		}
	}
}

func TestGenerateRoomName(t *testing.T) {
	for i := 0; i < 20; i++ {
		r := GenerateRoomName()
		if len(r) < 4 {
			t.Fatalf("room name too short: %s", r)
		}
	}
}

func TestGeneratePrivateRoomCode(t *testing.T) {
	for i := 0; i < 20; i++ {
		c := GeneratePrivateRoomCode()
		parts := strings.Split(c, "-")
		if len(parts) != 3 {
			t.Fatalf("expected 3 parts in code, got %s", c)
		}
		if len(parts[0]) == 0 || len(parts[1]) == 0 || len(parts[2]) == 0 {
			t.Fatalf("empty part in code: %s", c)
		}
	}
}
