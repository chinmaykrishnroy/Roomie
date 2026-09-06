package search

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// VectorDimension matches Alibaba-NLP/gte-Qwen2-1.5B-instruct (1536 dimensions)
const VectorDimension = 1536

// Vector represents a normalized embedding vector
type Vector []float32

var (
	httpClient = &http.Client{Timeout: 4 * time.Second}
)

type embedRequest struct {
	Text string `json:"text"`
}

type embedResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
	Dim        int         `json:"dim"`
}

// GenerateEmbedding calls the Qwen2 embedding service if available,
// falling back gracefully to 1536d n-gram semantic hashing if unreachable.
func GenerateEmbedding(text string) Vector {
	serviceURL := os.Getenv("EMBEDDING_SERVICE_URL")
	if serviceURL != "" {
		if vec, err := fetchFromService(serviceURL, text); err == nil && len(vec) == VectorDimension {
			return vec
		}
	}

	return generateHashEmbedding(text)
}

func fetchFromService(url, text string) (Vector, error) {
	reqBody, err := json.Marshal(embedRequest{Text: text})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding service returned status %d", resp.StatusCode)
	}

	var res embedResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if len(res.Embeddings) > 0 && len(res.Embeddings[0]) == VectorDimension {
		return Vector(res.Embeddings[0]), nil
	}

	return nil, fmt.Errorf("invalid embedding response")
}

// generateHashEmbedding creates a 1536-dimensional normalized semantic feature vector
// using character/word n-gram hashing and TF-IDF weighting.
func generateHashEmbedding(text string) Vector {
	vec := make([]float32, VectorDimension)
	text = strings.ToLower(text)

	tokens := tokenize(text)
	if len(tokens) == 0 {
		vec[0] = 1.0
		return vec
	}

	// 1. Unigram frequency
	termFreq := make(map[string]float32)
	for _, tok := range tokens {
		termFreq[tok]++
	}

	// 2. Character n-grams (3-grams and 4-grams) for subword semantics
	for _, tok := range tokens {
		runes := []rune(tok)
		if len(runes) >= 3 {
			for i := 0; i <= len(runes)-3; i++ {
				ngram := string(runes[i : i+3])
				termFreq[ngram] += 0.5
			}
		}
	}

	// 3. Hash into 1536 dimensions
	for term, freq := range termFreq {
		h := sha256.Sum256([]byte(term))
		dim := int(binary.BigEndian.Uint32(h[0:4])) % VectorDimension
		sign := float32(1.0)
		if (h[4] & 1) == 1 {
			sign = -1.0
		}
		weight := float32(math.Log(1.0+float64(freq))) * sign
		vec[dim] += weight
	}

	// 4. L2 Normalize
	var sumSquares float64
	for _, val := range vec {
		sumSquares += float64(val * val)
	}
	norm := float32(math.Sqrt(sumSquares))
	if norm > 1e-6 {
		for i := range vec {
			vec[i] /= norm
		}
	} else {
		vec[0] = 1.0
	}

	return vec
}

// CosineSimilarity computes the dot product of two L2-normalized vectors
func CosineSimilarity(a, b Vector) float64 {
	if len(a) != len(b) {
		return 0
	}
	var dot float64
	for i := range a {
		dot += float64(a[i] * b[i])
	}
	if dot < 0 {
		return 0
	}
	if dot > 1 {
		return 1
	}
	return dot
}

// ToPgVector formats the vector for PostgreSQL pgvector, e.g. '[0.1,0.2,...]'
func (v Vector) ToPgVector() string {
	var sb strings.Builder
	sb.WriteString("[")
	for i, val := range v {
		if i > 0 {
			sb.WriteString(",")
		}
		sb.WriteString(fmt.Sprintf("%.5f", val))
	}
	sb.WriteString("]")
	return sb.String()
}

// ParsePgVector parses a pgvector string '[0.1,0.2,...]' into a Vector
func ParsePgVector(s string) (Vector, error) {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "[")
	s = strings.TrimSuffix(s, "]")
	if s == "" {
		return nil, fmt.Errorf("empty pgvector string")
	}
	parts := strings.Split(s, ",")
	vec := make(Vector, len(parts))
	for i, p := range parts {
		val, err := strconv.ParseFloat(strings.TrimSpace(p), 32)
		if err != nil {
			return nil, err
		}
		vec[i] = float32(val)
	}
	return vec, nil
}

func tokenize(s string) []string {
	return strings.FieldsFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})
}
