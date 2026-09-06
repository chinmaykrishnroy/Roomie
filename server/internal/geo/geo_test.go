package geo

import (
	"math"
	"net/http"
	"testing"
)

func TestHaversine(t *testing.T) {
	// London to Paris ~ 343 km
	lonLondon := -0.1278
	latLondon := 51.5074
	lonParis := 2.3522
	latParis := 48.8566

	dist := Haversine(latLondon, lonLondon, latParis, lonParis)
	if math.Abs(dist-343.0) > 10.0 {
		t.Fatalf("expected dist ~343km, got %f", dist)
	}

	score := ProximityScore(dist)
	if score <= 0.6 || score >= 0.8 {
		t.Fatalf("expected score ~0.74, got %f", score)
	}
}

func TestCentroid(t *testing.T) {
	locs := []Location{
		{Latitude: 10, Longitude: 20},
		{Latitude: 30, Longitude: 40},
	}
	lat, lon := Centroid(locs)
	if lat != 20 || lon != 30 {
		t.Fatalf("expected 20, 30, got %f, %f", lat, lon)
	}
}

func TestLocationFromRequest(t *testing.T) {
	req, _ := http.NewRequest("GET", "http://localhost/rooms?lat=37.7749&lon=-122.4194", nil)
	lat, lon, ok := LocationFromRequest(req)
	if !ok || math.Abs(lat-37.7749) > 0.001 || math.Abs(lon+122.4194) > 0.001 {
		t.Fatalf("failed to parse location from query: %f, %f, %v", lat, lon, ok)
	}
}
