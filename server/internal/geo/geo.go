package geo

import (
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
)

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

const earthRadiusKm = 6371.0

// Haversine calculates great-circle distance in kilometers
func Haversine(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0

	radLat1 := lat1 * math.Pi / 180.0
	radLat2 := lat2 * math.Pi / 180.0

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(radLat1)*math.Cos(radLat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// ProximityScore returns a 0.0 to 1.0 score where closer is higher
// d = 0 km -> 1.0; d = 1000 km -> 0.5; d = 5000 km -> 0.166
func ProximityScore(distanceKm float64) float64 {
	if distanceKm < 0 {
		distanceKm = 0
	}
	return 1.0 / (1.0 + (distanceKm / 1000.0))
}

// Centroid computes the arithmetic average latitude and longitude
func Centroid(locs []Location) (float64, float64) {
	if len(locs) == 0 {
		return 0, 0
	}
	var sumLat, sumLon float64
	for _, l := range locs {
		sumLat += l.Latitude
		sumLon += l.Longitude
	}
	return sumLat / float64(len(locs)), sumLon / float64(len(locs))
}

// ExtractClientIP retrieves client's public IP from headers or remote addr
func ExtractClientIP(r *http.Request) string {
	if cf := r.Header.Get("CF-Connecting-IP"); cf != "" {
		return strings.TrimSpace(cf)
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
			return strings.TrimSpace(parts[0])
		}
	}
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return strings.TrimSpace(xrip)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

// LocationFromRequest extracts coordinates: first from explicit query/headers, then Cloudflare geo headers
func LocationFromRequest(r *http.Request) (float64, float64, bool) {
	// 1. Check query parameters (browser navigator.geolocation)
	qLat := r.URL.Query().Get("lat")
	qLon := r.URL.Query().Get("lon")
	if qLat != "" && qLon != "" {
		lat, err1 := strconv.ParseFloat(qLat, 64)
		lon, err2 := strconv.ParseFloat(qLon, 64)
		if err1 == nil && err2 == nil && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 {
			return lat, lon, true
		}
	}

	// 2. Cloudflare geolocation headers
	cfLat := r.Header.Get("CF-IPLatitude")
	cfLon := r.Header.Get("CF-IPLongitude")
	if cfLat != "" && cfLon != "" {
		lat, err1 := strconv.ParseFloat(cfLat, 64)
		lon, err2 := strconv.ParseFloat(cfLon, 64)
		if err1 == nil && err2 == nil {
			return lat, lon, true
		}
	}

	return 0, 0, false
}
