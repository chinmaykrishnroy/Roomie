package names

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

var adjectives = []string{
	"amber", "azure", "bold", "brave", "bright", "calm", "chill", "clever",
	"cool", "cosmic", "crisp", "dawn", "dusk", "electric", "ember", "epic",
	"fast", "fiery", "frost", "gentle", "golden", "grand", "happy", "hyper",
	"iron", "jade", "keen", "laser", "lively", "lucky", "lunar", "magic",
	"mellow", "mystic", "neon", "noble", "nova", "ocean", "polar", "prime",
	"quiet", "radiant", "rapid", "retro", "ruby", "rusty", "sage", "shadow",
	"silent", "silver", "solar", "spark", "stellar", "storm", "swift", "tidy",
	"urban", "valiant", "vibrant", "violet", "vivid", "warm", "wild", "zenith",
}

var nouns = []string{
	"badger", "bear", "bison", "blaze", "breeze", "cedar", "cheetah", "cliff",
	"comet", "canyon", "dolphin", "dragon", "eagle", "ember", "falcon", "fern",
	"finch", "forest", "fox", "glade", "grove", "harbor", "hawk", "haven",
	"island", "jaguar", "koala", "lake", "leopard", "lion", "lynx", "meadow",
	"meteor", "moon", "mountain", "nebula", "oasis", "orbit", "otter", "owl",
	"panda", "panther", "peak", "penguin", "phoenix", "pine", "planet", "quasar",
	"raven", "reef", "ridge", "river", "robin", "shadow", "spark", "star",
	"stream", "summit", "tiger", "valley", "vessel", "vortex", "wave", "wolf",
}

var verbs = []string{
	"build", "chill", "code", "create", "dance", "dream", "flow", "focus",
	"glow", "groove", "hang", "hike", "jam", "learn", "listen", "lounge",
	"play", "read", "relax", "share", "shine", "sing", "sketch", "study",
	"talk", "think", "vibe", "watch", "work", "write",
}

func cryptoInt(max int) int {
	if max <= 0 {
		return 0
	}
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0
	}
	return int(n.Int64())
}

// GenerateUsername generates an AdjectiveNoun username, e.g. "SwiftFalcon"
func GenerateUsername() string {
	adj := adjectives[cryptoInt(len(adjectives))]
	noun := nouns[cryptoInt(len(nouns))]
	return capitalize(adj) + capitalize(noun)
}

// GenerateRoomName generates an AdjectiveNoun or AdjectiveVerb name, e.g. "SilentStudy" or "CozyCampfire"
func GenerateRoomName() string {
	adj := adjectives[cryptoInt(len(adjectives))]
	if cryptoInt(2) == 0 {
		noun := nouns[cryptoInt(len(nouns))]
		return capitalize(adj) + capitalize(noun)
	}
	verb := verbs[cryptoInt(len(verbs))]
	return capitalize(adj) + capitalize(verb)
}

// GeneratePrivateRoomCode generates a friendly slug code like "swift-falcon-42"
// (hard to guess, easy to remember/share)
func GeneratePrivateRoomCode() string {
	adj := adjectives[cryptoInt(len(adjectives))]
	noun := nouns[cryptoInt(len(nouns))]
	num := cryptoInt(900) + 100 // 100 - 999
	return fmt.Sprintf("%s-%s-%d", adj, noun, num)
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return strings.ToUpper(s[:1]) + strings.ToLower(s[1:])
}
