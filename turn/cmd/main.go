package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/pion/turn/v5"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	listenAddr := getEnv("TURN_LISTEN_ADDR", ":3478")
	publicIPStr := getEnv("TURN_PUBLIC_IP", "13.234.238.124")
	realm := getEnv("TURN_REALM", "roomie.turn")
	secret := getEnv("TURN_SECRET", "roomie-turn-secret-key-32-chars-long")
	healthAddr := getEnv("TURN_HEALTH_ADDR", "127.0.0.1:8081")

	relayMin, _ := strconv.Atoi(getEnv("TURN_RELAY_MIN", "49160"))
	relayMax, _ := strconv.Atoi(getEnv("TURN_RELAY_MAX", "49180"))

	publicIP := net.ParseIP(publicIPStr)
	if publicIP == nil {
		publicIP = net.ParseIP("127.0.0.1")
	}

	udpListener, err := net.ListenPacket("udp4", listenAddr)
	if err != nil {
		log.Error("Failed to listen UDP", "error", err)
		os.Exit(1)
	}
	defer udpListener.Close()

	tcpListener, err := net.Listen("tcp4", listenAddr)
	if err != nil {
		log.Error("Failed to listen TCP", "error", err)
		os.Exit(1)
	}
	defer tcpListener.Close()

	relayGen := &turn.RelayAddressGeneratorPortRange{
		RelayAddress: publicIP,
		Address:      "0.0.0.0",
		MinPort:      uint16(relayMin),
		MaxPort:      uint16(relayMax),
		MaxRetries:   100,
	}

	server, err := turn.NewServer(turn.ServerConfig{
		Realm: realm,
		AuthHandler: func(a *turn.RequestAttributes) (string, []byte, bool) {
			if a.Realm != realm || !validUsername(a.Username, time.Now()) {
				return "", nil, false
			}
			pw := generatePassword(secret, a.Username)
			return a.Username, turn.GenerateAuthKey(a.Username, realm, pw), true
		},
		PacketConnConfigs: []turn.PacketConnConfig{
			{
				PacketConn:            udpListener,
				RelayAddressGenerator: relayGen,
			},
		},
		ListenerConfigs: []turn.ListenerConfig{
			{
				Listener:              tcpListener,
				RelayAddressGenerator: relayGen,
			},
		},
	})
	if err != nil {
		log.Error("Failed to create TURN server", "error", err)
		os.Exit(1)
	}
	defer server.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"turn"}`))
	})

	healthServer := &http.Server{
		Addr:              healthAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		_ = healthServer.ListenAndServe()
	}()

	log.Info("Roomie TURN server active",
		"listen", listenAddr,
		"public_ip", publicIP.String(),
		"realm", realm,
		"relay_min", relayMin,
		"relay_max", relayMax,
		"health", healthAddr,
	)

	<-ctx.Done()
	log.Info("Stopping TURN server...")
	shCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = healthServer.Shutdown(shCtx)
}

func generatePassword(secret, username string) string {
	mac := hmac.New(sha1.New, []byte(secret))
	_, _ = mac.Write([]byte(username))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func validUsername(username string, now time.Time) bool {
	timestamp, subject, ok := strings.Cut(username, ":")
	if !ok || subject == "" {
		return false
	}
	expiry, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false
	}
	return expiry > now.Unix() && expiry <= now.Add(24*time.Hour).Unix()
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
