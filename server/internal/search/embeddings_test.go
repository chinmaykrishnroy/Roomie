package search

import (
	"strings"
	"testing"
)

func TestEmbeddings(t *testing.T) {
	v1 := GenerateEmbedding("gaming and esports tournament stream")
	v2 := GenerateEmbedding("gaming esports video games")
	v3 := GenerateEmbedding("classical piano violin orchestra concert")

	sim12 := CosineSimilarity(v1, v2)
	sim13 := CosineSimilarity(v1, v3)

	if sim12 <= sim13 {
		t.Fatalf("expected gaming query to be more similar to gaming than classical music: sim12=%f, sim13=%f", sim12, sim13)
	}

	pgStr := v1.ToPgVector()
	if !strings.HasPrefix(pgStr, "[") || !strings.HasSuffix(pgStr, "]") {
		t.Fatalf("invalid pgvector string: %s", pgStr[:20])
	}
}
