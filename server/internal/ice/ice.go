package ice

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"
)

type Server struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}

type Configuration struct {
	ICEServers []Server  `json:"iceServers"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type Provider interface {
	Configuration(subject string, now time.Time) (Configuration, error)
}

type SharedSecretProvider struct {
	Secret string
	URLs   []string
	TTL    time.Duration
}

func (p SharedSecretProvider) Configuration(subject string, now time.Time) (Configuration, error) {
	if len(p.Secret) < 16 || p.TTL <= 0 || p.TTL > 24*time.Hour || subject == "" || strings.Contains(subject, ":") {
		return Configuration{}, errors.New("invalid ICE credential configuration")
	}
	expiry := now.Add(p.TTL)
	username := strconv.FormatInt(expiry.Unix(), 10) + ":" + subject
	return Configuration{
		ICEServers: []Server{
			{
				URLs:       p.URLs,
				Username:   username,
				Credential: Password(p.Secret, username),
			},
		},
		ExpiresAt: expiry,
	}, nil
}

func Password(secret, username string) string {
	mac := hmac.New(sha1.New, []byte(secret))
	_, _ = mac.Write([]byte(username))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func ValidUsername(username string, now time.Time) bool {
	timestamp, subject, ok := strings.Cut(username, ":")
	if !ok || subject == "" || len(username) > 128 {
		return false
	}
	expiry, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false
	}
	return expiry > now.Unix() && expiry <= now.Add(24*time.Hour).Unix()
}
