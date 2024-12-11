package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// logic to generate encryption secret for tw config
func GenerateEncryptionSecret(uuidStr, email, id string) string {
	hash := sha256.New()
	hash.Write([]byte(uuidStr + email + id))
	return hex.EncodeToString(hash.Sum(nil))
}
