package main

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"os"
	"strconv"
	"testing"
	"time"
)

func TestGeneratePassword(t *testing.T) {
	secret := "test-turn-secret-key-32-chars-long"
	username := "1720000000:testuser"

	pwd1 := generatePassword(secret, username)
	if pwd1 == "" {
		t.Fatalf("expected non-empty password")
	}

	// Password generation must be deterministic
	pwd2 := generatePassword(secret, username)
	if pwd1 != pwd2 {
		t.Fatalf("expected deterministic password, got %s and %s", pwd1, pwd2)
	}

	// Verify HMAC-SHA1 base64 format manually
	mac := hmac.New(sha1.New, []byte(secret))
	mac.Write([]byte(username))
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	if pwd1 != expected {
		t.Fatalf("expected %s, got %s", expected, pwd1)
	}

	// Different secrets must produce different passwords
	pwdDiffSecret := generatePassword("different-secret-key", username)
	if pwd1 == pwdDiffSecret {
		t.Fatalf("expected different passwords for different secrets")
	}

	// Different usernames must produce different passwords
	pwdDiffUser := generatePassword(secret, "1720000000:anotheruser")
	if pwd1 == pwdDiffUser {
		t.Fatalf("expected different passwords for different usernames")
	}
}

func TestValidUsername(t *testing.T) {
	now := time.Unix(1720000000, 0)

	tests := []struct {
		name     string
		username string
		valid    bool
	}{
		{
			name:     "valid timestamp within 24h",
			username: strconv.FormatInt(now.Add(1*time.Hour).Unix(), 10) + ":alice",
			valid:    true,
		},
		{
			name:     "valid timestamp at 23h59m",
			username: strconv.FormatInt(now.Add(23*time.Hour+59*time.Minute).Unix(), 10) + ":bob",
			valid:    true,
		},
		{
			name:     "expired timestamp in past",
			username: strconv.FormatInt(now.Add(-10*time.Minute).Unix(), 10) + ":charlie",
			valid:    false,
		},
		{
			name:     "expired at exact current time",
			username: strconv.FormatInt(now.Unix(), 10) + ":dave",
			valid:    false,
		},
		{
			name:     "timestamp beyond 24h into future",
			username: strconv.FormatInt(now.Add(25*time.Hour).Unix(), 10) + ":eve",
			valid:    false,
		},
		{
			name:     "missing colon separator",
			username: "1720003600alice",
			valid:    false,
		},
		{
			name:     "empty subject after colon",
			username: strconv.FormatInt(now.Add(1*time.Hour).Unix(), 10) + ":",
			valid:    false,
		},
		{
			name:     "non-numeric timestamp prefix",
			username: "notanumber:alice",
			valid:    false,
		},
		{
			name:     "empty string",
			username: "",
			valid:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validUsername(tt.username, now)
			if got != tt.valid {
				t.Errorf("validUsername(%q) = %v, want %v", tt.username, got, tt.valid)
			}
		})
	}
}

func TestGetEnv(t *testing.T) {
	const testKey = "ROOMIE_TEST_ENV_VAR_XYZ"
	const defaultVal = "fallback_value"

	_ = os.Unsetenv(testKey)
	if got := getEnv(testKey, defaultVal); got != defaultVal {
		t.Fatalf("expected default %q, got %q", defaultVal, got)
	}

	_ = os.Setenv(testKey, "custom_value")
	defer os.Unsetenv(testKey)

	if got := getEnv(testKey, defaultVal); got != "custom_value" {
		t.Fatalf("expected set value %q, got %q", "custom_value", got)
	}
}
