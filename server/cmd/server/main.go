package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"example.com/roomie/server/internal/api"
	"example.com/roomie/server/internal/ice"
	"example.com/roomie/server/internal/sfu"
	"example.com/roomie/server/internal/store"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	httpAddr := getEnv("HTTP_ADDR", ":8080")
	dbURL := getEnv("DATABASE_URL", "postgres://encounter:encounter@localhost:5432/encounter?sslmode=disable")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379/0")
	turnSecret := getEnv("TURN_SECRET", "roomie-turn-secret-key-32-chars-long")
	turnHost := getEnv("TURN_PUBLIC_IP", "13.234.238.124")
	turnPort := getEnv("TURN_PORT", "3478")

	// 1. Connect PostgreSQL
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	// 2. Connect Redis
	var rdb *redis.Client
	opt, err := redis.ParseURL(redisURL)
	if err == nil {
		rdb = redis.NewClient(opt)
		defer rdb.Close()
	} else {
		log.Printf("warning: Redis parse failed (%v), running without redis", err)
	}

	// 3. Initialize Stores & SFU
	st := store.New(db, rdb)

	// Auto-destroy inactive rooms: runs every 5 minutes, deletes rooms empty for >= 1 hour
	inactivityTimeout := 1 * time.Hour
	if envTimeout := os.Getenv("ROOM_INACTIVITY_TIMEOUT"); envTimeout != "" {
		if d, err := time.ParseDuration(envTimeout); err == nil {
			inactivityTimeout = d
		}
	}
	st.StartCleanupWorker(ctx, 5*time.Minute, inactivityTimeout)

	turnURL := fmt.Sprintf("turn:%s:%s?transport=udp", turnHost, turnPort)
	turnTCPURL := fmt.Sprintf("turn:%s:%s?transport=tcp", turnHost, turnPort)
	stunURL := fmt.Sprintf("stun:%s:%s", turnHost, turnPort)

	iceProv := ice.SharedSecretProvider{
		Secret: turnSecret,
		URLs:   []string{stunURL, turnURL, turnTCPURL},
		TTL:    1 * time.Hour,
	}

	hub := sfu.NewHub(st, iceProv)
	srv := api.NewServer(st, hub, iceProv)

	mux := http.NewServeMux()
	srv.Register(mux)

	// CORS wrapper
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:              httpAddr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("Roomie server listening on %s (TURN host: %s:%s)", httpAddr, turnHost, turnPort)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down Roomie server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
	log.Println("Server stopped")
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
