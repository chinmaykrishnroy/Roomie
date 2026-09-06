package store

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math"
	"sort"
	"time"

	"example.com/roomie/server/internal/geo"
	"example.com/roomie/server/internal/search"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type Room struct {
	ID               string    `json:"id"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	Category         string    `json:"category"`
	IsCustomCategory bool      `json:"isCustomCategory"`
	IsPrivate        bool      `json:"isPrivate"`
	MaxParticipants  int       `json:"maxParticipants"`
	CentroidLat      float64   `json:"centroidLat"`
	CentroidLon      float64   `json:"centroidLon"`
	ParticipantCount int       `json:"participantCount"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type RoomWithScore struct {
	Room
	Score           float64 `json:"score"`
	DistanceKm      float64 `json:"distanceKm"`
	CategoryMatch   float64 `json:"categoryMatch"`
	ProximityMatch  float64 `json:"proximityMatch"`
	OccupancyScore  float64 `json:"occupancyScore"`
}

type Store struct {
	DB    *sql.DB
	Redis *redis.Client
}

func New(db *sql.DB, rdb *redis.Client) *Store {
	return &Store{DB: db, Redis: rdb}
}

// CreateRoom inserts a new room with computed vector embedding
func (s *Store) CreateRoom(ctx context.Context, r *Room) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	if r.MaxParticipants <= 0 || r.MaxParticipants > 16 {
		r.MaxParticipants = 16
	}

	embedText := fmt.Sprintf("%s %s %s", r.Category, r.Name, r.Description)
	vec := search.GenerateEmbedding(embedText)
	pgVecStr := vec.ToPgVector()

	query := `
		INSERT INTO rooms (
			id, code, name, description, category, is_custom_category,
			is_private, max_participants, embedding, centroid_lat, centroid_lon,
			participant_count, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9::vector, $10, $11, $12, NOW(), NOW()
		)
	`
	_, err := s.DB.ExecContext(ctx, query,
		r.ID, r.Code, r.Name, r.Description, r.Category, r.IsCustomCategory,
		r.IsPrivate, r.MaxParticipants, pgVecStr, r.CentroidLat, r.CentroidLon,
		0,
	)
	return err
}

func (s *Store) GetRoomByCode(ctx context.Context, code string) (*Room, error) {
	query := `
		SELECT id, code, name, description, category, is_custom_category,
		       is_private, max_participants, centroid_lat, centroid_lon,
		       participant_count, created_at, updated_at
		FROM rooms
		WHERE code = $1
	`
	r := &Room{}
	err := s.DB.QueryRowContext(ctx, query, code).Scan(
		&r.ID, &r.Code, &r.Name, &r.Description, &r.Category, &r.IsCustomCategory,
		&r.IsPrivate, &r.MaxParticipants, &r.CentroidLat, &r.CentroidLon,
		&r.ParticipantCount, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return r, nil
}

// ListPublicRooms performs weighted multi-parameter ranking and pagination
func (s *Store) ListPublicRooms(ctx context.Context, category, searchTxt string, userLat, userLon float64, hasLocation bool, page, limit int) ([]*RoomWithScore, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 12
	}

	// Retrieve public rooms
	query := `
		SELECT id, code, name, description, category, is_custom_category,
		       is_private, max_participants, centroid_lat, centroid_lon,
		       participant_count, created_at, updated_at,
		       embedding
		FROM rooms
		WHERE is_private = FALSE
	`
	rows, err := s.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var searchVec search.Vector
	if searchTxt != "" {
		searchVec = search.GenerateEmbedding(searchTxt)
	}

	var allScored []*RoomWithScore
	for rows.Next() {
		r := &Room{}
		var embedStr sql.NullString
		err := rows.Scan(
			&r.ID, &r.Code, &r.Name, &r.Description, &r.Category, &r.IsCustomCategory,
			&r.IsPrivate, &r.MaxParticipants, &r.CentroidLat, &r.CentroidLon,
			&r.ParticipantCount, &r.CreatedAt, &r.UpdatedAt,
			&embedStr,
		)
		if err != nil {
			continue
		}

		scored := &RoomWithScore{Room: *r}

		// 1. Relevance / Vector Match
		var relevanceScore float64
		if searchTxt != "" {
			var roomEmbed search.Vector
			if embedStr.Valid && embedStr.String != "" {
				if parsed, err := search.ParsePgVector(embedStr.String); err == nil && len(parsed) == len(searchVec) {
					roomEmbed = parsed
				}
			}
			if len(roomEmbed) == 0 {
				roomEmbed = search.GenerateEmbedding(r.Category + " " + r.Name + " " + r.Description)
			}
			sim := search.CosineSimilarity(searchVec, roomEmbed)
			relevanceScore = sim

			// Category boost/penalty if user also selected a category
			if category != "" && category != "all" {
				if r.Category == category {
					relevanceScore = math.Min(1.0, relevanceScore*1.2)
				} else {
					relevanceScore = relevanceScore * 0.4
				}
			}
		} else {
			// Browse mode without search query
			if category != "" && category != "all" {
				if r.Category == category {
					relevanceScore = 1.0
				} else {
					relevanceScore = 0.1
				}
			} else {
				relevanceScore = 0.5 // neutral baseline for unfiltered browse
			}
		}
		scored.CategoryMatch = relevanceScore

		// 2. Geolocation proximity (weight 0.30)
		var geoScore float64 = 0.5
		if hasLocation && (r.CentroidLat != 0 || r.CentroidLon != 0) {
			dist := geo.Haversine(userLat, userLon, r.CentroidLat, r.CentroidLon)
			scored.DistanceKm = dist
			geoScore = geo.ProximityScore(dist)
		}
		scored.ProximityMatch = geoScore

		// 3. Occupancy score (weight 0.20)
		// Active rooms with users are preferred, but not full (<= 16)
		occScore := float64(r.ParticipantCount) / 8.0
		if occScore > 1.0 {
			occScore = 1.0
		}
		if r.ParticipantCount >= r.MaxParticipants {
			occScore = 0.1 // Deprioritize full rooms
		}
		scored.OccupancyScore = occScore

		// 4. Recency score (weight 0.10)
		hoursAgo := time.Since(r.CreatedAt).Hours()
		recScore := 1.0 / (1.0 + (hoursAgo / 24.0))

		// Composite Score:
		// When user is searching, semantic match is the primary ranking factor (85%).
		// In browse mode, use the balanced formula (40% category + 30% geo + 20% occupancy + 10% recency).
		if searchTxt != "" {
			scored.Score = 0.85*relevanceScore + 0.05*geoScore + 0.05*occScore + 0.05*recScore
		} else {
			scored.Score = 0.40*relevanceScore + 0.30*geoScore + 0.20*occScore + 0.10*recScore
		}

		allScored = append(allScored, scored)
	}

	// Sort by composite score descending
	sort.Slice(allScored, func(i, j int) bool {
		return allScored[i].Score > allScored[j].Score
	})

	total := len(allScored)
	offset := (page - 1) * limit
	if offset >= total {
		return []*RoomWithScore{}, total, nil
	}

	end := offset + limit
	if end > total {
		end = total
	}

	return allScored[offset:end], total, nil
}

// AddParticipant registers a participant in the room and recalculates centroid
func (s *Store) AddParticipant(ctx context.Context, roomID, userID, username string, lat, lon float64) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Upsert participant
	upsert := `
		INSERT INTO room_participants (room_id, user_id, username, latitude, longitude, joined_at, last_seen_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (room_id, user_id)
		DO UPDATE SET username = EXCLUDED.username, latitude = EXCLUDED.latitude,
		              longitude = EXCLUDED.longitude, last_seen_at = NOW()
	`
	if _, err := tx.ExecContext(ctx, upsert, roomID, userID, username, lat, lon); err != nil {
		return err
	}

	// Recalculate centroid and count
	countQuery := `
		SELECT COUNT(*), COALESCE(AVG(latitude), 0), COALESCE(AVG(longitude), 0)
		FROM room_participants
		WHERE room_id = $1
	`
	var count int
	var avgLat, avgLon float64
	if err := tx.QueryRowContext(ctx, countQuery, roomID).Scan(&count, &avgLat, &avgLon); err != nil {
		return err
	}

	updateRoom := `
		UPDATE rooms
		SET participant_count = $1, centroid_lat = $2, centroid_lon = $3, updated_at = NOW()
		WHERE id = $4
	`
	if _, err := tx.ExecContext(ctx, updateRoom, count, avgLat, avgLon, roomID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	if s.Redis != nil {
		_ = s.Redis.SAdd(ctx, "room:"+roomID+":users", userID).Err()
	}

	return nil
}

// RemoveParticipant deletes participant and updates centroid/count
func (s *Store) RemoveParticipant(ctx context.Context, roomID, userID string) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	delQuery := `DELETE FROM room_participants WHERE room_id = $1 AND user_id = $2`
	if _, err := tx.ExecContext(ctx, delQuery, roomID, userID); err != nil {
		return err
	}

	countQuery := `
		SELECT COUNT(*), COALESCE(AVG(latitude), 0), COALESCE(AVG(longitude), 0)
		FROM room_participants
		WHERE room_id = $1
	`
	var count int
	var avgLat, avgLon float64
	if err := tx.QueryRowContext(ctx, countQuery, roomID).Scan(&count, &avgLat, &avgLon); err != nil {
		return err
	}

	updateRoom := `
		UPDATE rooms
		SET participant_count = $1, centroid_lat = $2, centroid_lon = $3, updated_at = NOW()
		WHERE id = $4
	`
	if _, err := tx.ExecContext(ctx, updateRoom, count, avgLat, avgLon, roomID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	if s.Redis != nil {
		_ = s.Redis.SRem(ctx, "room:"+roomID+":users", userID).Err()
	}

	return nil
}

// CleanupInactiveRooms deletes rooms that have had 0 participants for longer than maxInactivity.
func (s *Store) CleanupInactiveRooms(ctx context.Context, maxInactivity time.Duration) (int64, error) {
	threshold := time.Now().Add(-maxInactivity)
	query := `
		DELETE FROM rooms
		WHERE participant_count = 0
		  AND updated_at < $1
		RETURNING id
	`
	rows, err := s.DB.QueryContext(ctx, query, threshold)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var deletedCount int64
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			deletedCount++
			if s.Redis != nil {
				_ = s.Redis.Del(ctx, "room:"+id+":users").Err()
			}
		}
	}
	return deletedCount, rows.Err()
}

// StartCleanupWorker runs a periodic background task to purge inactive rooms.
func (s *Store) StartCleanupWorker(ctx context.Context, interval, maxInactivity time.Duration) {
	runCleanup := func() {
		cleanCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()

		deleted, err := s.CleanupInactiveRooms(cleanCtx, maxInactivity)
		if err != nil {
			log.Printf("[cleaner] error purging inactive rooms: %v", err)
		} else if deleted > 0 {
			log.Printf("[cleaner] purged %d inactive room(s) (empty for > %v)", deleted, maxInactivity)
		}
	}

	// Initial cleanup on boot
	go runCleanup()

	// Periodic ticker
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				runCleanup()
			}
		}
	}()
}

