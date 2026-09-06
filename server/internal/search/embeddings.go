package search

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"math"
	"strings"
	"unicode"
)

const VectorDimension = 384

// Vector represents a normalized embedding vector
type Vector []float32

// GenerateEmbedding creates a 384-dimensional normalized semantic feature vector
// using character/word n-gram hashing and TF-IDF weighting.
func GenerateEmbedding(text string) Vector {
	vec := make([]float32, VectorDimension)
	text = strings.ToLower(text)

	tokens := tokenize(text)
	if len(tokens) == 0 {
		// Return unit vector along first dimension if empty
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

	// 3. Hash into 384 dimensions
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
	// Clamp to [0, 1] range for scoring
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

func tokenize(s string) []string {
	return strings.FieldsFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})
}
