package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// SafeTempDirPrefix creates a safe prefix for temporary directory names.
// Instead of using user-provided values directly (which could contain path
// separators or special characters), we use a hash of the value.
// This prevents directory traversal attacks while still providing
// unique prefixes per user.
func SafeTempDirPrefix(prefix, userIdentifier string) string {
	// Create a short hash of the user identifier
	hash := sha256.Sum256([]byte(userIdentifier))
	// Use first 8 characters of hex-encoded hash (32 bits of entropy)
	shortHash := hex.EncodeToString(hash[:])[:8]
	return prefix + shortHash
}
