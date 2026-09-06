//go:build integration

package main_test

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"net"
	"os"
	"strconv"
	"testing"
	"time"

	"github.com/pion/turn/v5"
)

func TestTURNTransports(t *testing.T) {
	address := os.Getenv("TEST_TURN_ADDR")
	if address == "" {
		address = "127.0.0.1:3478"
	}
	secret := os.Getenv("TURN_SECRET")
	if secret == "" {
		secret = "roomie_turn_hmac_secret_key_32_chars_long"
	}
	realm := os.Getenv("TURN_REALM")
	if realm == "" {
		realm = "roomie.turn"
	}

	for _, transport := range []string{"udp", "tcp"} {
		t.Run(transport, func(t *testing.T) {
			var conn net.PacketConn
			if transport == "udp" {
				var err error
				conn, err = net.ListenPacket("udp4", "0.0.0.0:0")
				if err != nil {
					t.Fatal(err)
				}
			} else {
				raw, err := net.DialTimeout("tcp", address, 5*time.Second)
				if err != nil {
					t.Fatal(err)
				}
				conn = turn.NewSTUNConn(raw)
			}
			defer conn.Close()

			username := strconv.FormatInt(time.Now().Add(5*time.Minute).Unix(), 10) + ":integration"
			mac := hmac.New(sha1.New, []byte(secret))
			mac.Write([]byte(username))
			password := base64.StdEncoding.EncodeToString(mac.Sum(nil))

			client, err := turn.NewClient(&turn.ClientConfig{
				STUNServerAddr: address,
				TURNServerAddr: address,
				Conn:           conn,
				Username:       username,
				Password:       password,
				Realm:          realm,
			})
			if err != nil {
				t.Fatal(err)
			}
			defer client.Close()

			if err := client.Listen(); err != nil {
				t.Fatal(err)
			}

			mapped, err := client.SendBindingRequest()
			if err != nil {
				t.Fatal(err)
			}
			t.Logf("[%s] Mapped address: %s", transport, mapped.String())

			relay, err := client.Allocate()
			if err != nil {
				t.Fatal(err)
			}
			defer relay.Close()

			_, portStr, err := net.SplitHostPort(relay.LocalAddr().String())
			if err != nil {
				t.Fatal(err)
			}
			port, _ := strconv.Atoi(portStr)
			t.Logf("[%s] Allocated relay address: %s (port: %d)", transport, relay.LocalAddr().String(), port)

			if port < 49160 || port > 49180 {
				t.Fatalf("relay port %d outside expected range [49160, 49180]", port)
			}
		})
	}
}
